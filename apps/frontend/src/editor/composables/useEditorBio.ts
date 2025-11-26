// apps/frontend/src/editor/composables/useEditorBio.ts
import { computed, ref } from 'vue'
import type { Editor } from '@tiptap/core'

/**
 * F2.8 — Herramientas básicas de Bioinformática (secuencias).
 *
 * Este composable encapsula el estado del panel "Bio (secuencias)" y
 * la integración mínima con TipTap / editor-ext-bio.
 *
 * Diseñado para seguir el mismo patrón que useEditorChem:
 * - NO crea una instancia nueva de Editor.
 * - Por defecto usa window.editor (inyectado por useDisertareEditor).
 * - Opcionalmente puede recibir un getEditor() para desacoplarse.
 */

export type BioSequenceKind = 'dna' | 'rna' | 'protein'

export interface BaseCounts {
  A: number
  C: number
  G: number
  T: number
  U: number
  other: number
}

export interface SimpleOrf {
  frame: 0 | 1 | 2
  start: number // índice 0-based sobre la secuencia limpia
  end: number   // índice 0-based INCLUSIVE
  length: number
}

export interface MotifHit {
  motif: string
  positions: number[] // índices 0-based donde inicia el motivo
}

export interface BioSequenceAnalysis {
  rawLength: number
  cleanedLength: number
  gcPercent: number
  counts: BaseCounts
  orfs: SimpleOrf[]
  motifs: MotifHit[]
  complement: string
  reverse: string
  reverseComplement: string
  messages: string[]
}

type GetEditor = () => Editor | null

function resolveEditor(getEditor?: GetEditor): Editor | null {
  if (getEditor) {
    const ed = getEditor()
    if (ed) return ed
  }

  if (typeof window !== 'undefined' && (window as any).editor) {
    return (window as any).editor as Editor
  }

  return null
}

/**
 * Normaliza la secuencia:
 * - quita espacios, saltos de línea y números
 * - convierte a mayúsculas
 */
function normalizeSequence(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z]/g, '')
}

function computeCounts(seq: string): BaseCounts {
  const counts: BaseCounts = {
    A: 0,
    C: 0,
    G: 0,
    T: 0,
    U: 0,
    other: 0,
  }

  for (const ch of seq) {
    if (ch === 'A') counts.A += 1
      else if (ch === 'C') counts.C += 1
        else if (ch === 'G') counts.G += 1
          else if (ch === 'T') counts.T += 1
            else if (ch === 'U') counts.U += 1
              else counts.other += 1
  }

  return counts
}

function computeGcPercent(seq: string, counts: BaseCounts): number {
  const len = seq.length || 0
  if (!len) return 0
    const gc = counts.G + counts.C
    return (gc / len) * 100
}

function findMotifPositions(seq: string, motif: string): number[] {
  const positions: number[] = []
  if (!motif) return positions

    const motifUpper = motif.toUpperCase()
    const mlen = motifUpper.length

    if (!mlen) return positions

      for (let i = 0; i <= seq.length - mlen; i += 1) {
        if (seq.slice(i, i + mlen) === motifUpper) {
          positions.push(i)
        }
      }

      return positions
}

function findSimpleOrfs(seq: string, kind: BioSequenceKind): SimpleOrf[] {
  // Sólo tiene sentido para DNA/RNA.
  if (kind === 'protein') return []

    const startCodon = kind === 'rna' ? 'AUG' : 'ATG'
    const stopCodons = kind === 'rna' ? ['UAA', 'UAG', 'UGA'] : ['TAA', 'TAG', 'TGA']

    const orfs: SimpleOrf[] = []

    for (let frame: 0 | 1 | 2 = 0; frame < 3; frame = ((frame + 1) as 0 | 1 | 2)) {
      for (let i = frame; i <= seq.length - 3; i += 3) {
        const codon = seq.slice(i, i + 3)
        if (codon !== startCodon) continue

          // Buscar el primer codón de paro después del inicio
          for (let j = i + 3; j <= seq.length - 3; j += 3) {
            const codonStop = seq.slice(j, j + 3)
            if (stopCodons.includes(codonStop)) {
              const length = j + 3 - i
              orfs.push({
                frame,
                start: i,
                end: j + 2,
                length,
              })
              i = j + 3 // saltar después del codón stop
              break
            }
          }
      }
    }

    return orfs
}

function computeComplement(seq: string, kind: BioSequenceKind): string {
  if (kind === 'protein') return seq

    const dnaMap: Record<string, string> = {
      A: 'T',
      T: 'A',
      C: 'G',
      G: 'C',
    }

    const rnaMap: Record<string, string> = {
      A: 'U',
      U: 'A',
      C: 'G',
      G: 'C',
    }

    const map = kind === 'rna' ? rnaMap : dnaMap

    return seq
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
}

function buildMessages(analysis: BioSequenceAnalysis, kind: BioSequenceKind): string[] {
  const msgs: string[] = []

  if (!analysis.cleanedLength) {
    msgs.push('Introduce una secuencia válida para comenzar el análisis.')
    return msgs
  }

  if (kind !== 'protein') {
    msgs.push(
      `Contenido GC aproximado: ${analysis.gcPercent.toFixed(
        1,
      )} %. Valores altos suelen asociarse a regiones más estables (pero no es una regla absoluta).`,
    )
  }

  if (analysis.orfs.length) {
    const longest = analysis.orfs.reduce((acc, orf) =>
    orf.length > acc.length ? orf : acc,
    )
    msgs.push(
      `Se detectaron ${analysis.orfs.length} ORFs forward. El más largo comienza en la posición ${
        longest.start + 1
      } y tiene longitud ${longest.length} bases.`,
    )
  } else if (kind !== 'protein') {
    msgs.push(
      'No se detectaron ORFs largos en los tres marcos de lectura. Esto es habitual en secuencias cortas o fragmentos.',
    )
  }

  if (analysis.motifs.length) {
    msgs.push(
      `Se encontraron motivos conocidos: ${analysis.motifs
        .map((m) => m.motif)
        .join(', ')}.`,
    )
  }

  if (kind === 'protein') {
    msgs.push(
      'Para proteínas, este panel se centra en transformaciones básicas y motivos; para alineamientos avanzados se usará software dedicado en fases posteriores.',
    )
  }

  return msgs
}

/**
 * Alineamiento simplificado tipo "identidad":
 * coloca las dos secuencias una sobre otra y calcula % de matches directos.
 * NO es un algoritmo de alineamiento óptimo, solo una herramienta didáctica.
 */
function simpleIdentityAlignment(seq1: string, seq2: string): {
  pretty: string
  identityPercent: number
} {
  const maxLen = Math.max(seq1.length, seq2.length)
  if (!maxLen) {
    return { pretty: '', identityPercent: 0 }
  }

  const s1 = seq1.padEnd(maxLen, '-')
  const s2 = seq2.padEnd(maxLen, '-')

  let mid = ''
  let matches = 0

  for (let i = 0; i < maxLen; i += 1) {
    const a = s1[i]
    const b = s2[i]
    if (a === b && a !== '-') {
      mid += '|'
      matches += 1
    } else {
      mid += ' '
    }
  }

  const identityPercent = (matches / maxLen) * 100
  const pretty = `${s1}\n${mid}\n${s2}`

  return { pretty, identityPercent }
}

export function useEditorBio(getEditor?: GetEditor) {
  // Estado principal
  const kind = ref<BioSequenceKind>('dna')
  const label = ref<string>('')
  const sequence = ref<string>('')
  const motifsText = ref<string>('')

  // Alineamiento sencillo contra una segunda secuencia
  const alignmentSeq2 = ref<string>('')
  const alignmentResult = ref<string | null>(null)
  const alignmentInsights = ref<string | null>(null)
  const alignmentError = ref<string | null>(null)

  const analysis = ref<BioSequenceAnalysis | null>(null)

  const hasSequence = computed(() => normalizeSequence(sequence.value).length > 0)

  const hasAlignmentInput = computed(
    () =>
    normalizeSequence(sequence.value).length > 0 &&
    normalizeSequence(alignmentSeq2.value).length > 0,
  )

  const canInsertBio = computed(() => {
    const editor = resolveEditor(getEditor)
    return !!editor && hasSequence.value
  })

  function runAnalysis() {
    const raw = sequence.value ?? ''
    const cleaned = normalizeSequence(raw)

    const counts = computeCounts(cleaned)
    const gcPercent = computeGcPercent(cleaned, counts)

    const motifs: MotifHit[] = []
    const tokens = motifsText.value
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean)

    for (const token of tokens) {
      const positions = findMotifPositions(cleaned, token)
      if (positions.length) {
        motifs.push({ motif: token.toUpperCase(), positions })
      }
    }

    const orfs = findSimpleOrfs(cleaned, kind.value)
    const complement = computeComplement(cleaned, kind.value)
    const reverse = cleaned.split('').reverse().join('')
    const reverseComplement = complement.split('').reverse().join('')

    const baseAnalysis: BioSequenceAnalysis = {
      rawLength: raw.length,
      cleanedLength: cleaned.length,
      gcPercent,
      counts,
      orfs,
      motifs,
      complement,
      reverse,
      reverseComplement,
      messages: [],
    }

    baseAnalysis.messages = buildMessages(baseAnalysis, kind.value)
    analysis.value = baseAnalysis
  }

  function reset() {
    kind.value = 'dna'
    label.value = ''
    sequence.value = ''
    motifsText.value = ''
    alignmentSeq2.value = ''
    alignmentResult.value = null
    alignmentInsights.value = null
    alignmentError.value = null
    analysis.value = null
  }

  function insertBioSequence() {
    const editor = resolveEditor(getEditor)
    if (!editor) return

      const cleaned = normalizeSequence(sequence.value)
      if (!cleaned) return

        const safeLabel = label.value.trim() || 'Secuencia sin título'

        editor
        .chain()
        .focus()
        .insertContent({
          type: 'bioSequence',
          attrs: {
            id:
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? (crypto as any).randomUUID()
            : undefined,
            kind: kind.value,
            label: safeLabel,
            sequence: cleaned,
            // annotations se reservará para fases posteriores (features, ORFs, etc.)
          },
        })
        .run()
  }

  function runAlignment() {
    const s1 = normalizeSequence(sequence.value)
    const s2 = normalizeSequence(alignmentSeq2.value)

    if (!s1 || !s2) {
      alignmentError.value =
      'Introduce la secuencia principal y una segunda secuencia para alinear.'
      alignmentResult.value = null
      alignmentInsights.value = null
      return
    }

    alignmentError.value = null

    const { pretty, identityPercent } = simpleIdentityAlignment(s1, s2)
    alignmentResult.value = pretty
    alignmentInsights.value = `Identidad aproximada: ${identityPercent.toFixed(
      1,
    )} % sobre ${Math.max(s1.length, s2.length)} posiciones.`
  }

  return {
    kind,
    label,
    sequence,
    motifsText,
    analysis,
    hasSequence,
    canInsertBio,
    runAnalysis,
    reset,
    insertBioSequence,
    alignmentSeq2,
    alignmentResult,
    alignmentInsights,
    alignmentError,
    hasAlignmentInput,
    runAlignment,
  }
}
