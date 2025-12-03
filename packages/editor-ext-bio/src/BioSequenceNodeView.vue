/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  D  DISERTARE                                                    ║
 * ║  Plataforma avanzada de edición técnica, científica y            ║
 * ║  multidisciplinaria.                                             ║
 * ║                                                                  ║
 * ║  © 2025 Disertare Project — Licencia Privativa.                  ║
 * ║  Todos los derechos reservados.                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

<!-- packages/editor-ext-bio/src/BioSequenceNodeView.vue -->
<template>
  <NodeViewWrapper class="bio-sequence-node">
    <header class="bio-sequence-node__header">
      <div class="bio-sequence-node__title">
        <span class="bio-sequence-node__label">
          {{ label || 'Secuencia sin título' }}
        </span>
        <span class="bio-sequence-node__badge">
          {{ kindLabel }}
        </span>
      </div>
      <div class="bio-sequence-node__meta">
        <span class="bio-sequence-node__meta-item">
          {{ analysisSummary.lengthLabel }}
        </span>
        <span
          v-if="analysisSummary.gcLabel"
          class="bio-sequence-node__meta-item"
        >
          {{ analysisSummary.gcLabel }}
        </span>
        <span
          v-if="analysisSummary.orfLabel"
          class="bio-sequence-node__meta-item"
        >
          {{ analysisSummary.orfLabel }}
        </span>
      </div>
    </header>

    <section class="bio-sequence-node__body">
      <pre class="bio-sequence-node__sequence">
{{ sequenceSnippet }}
<span v-if="sequence.length > maxSnippetLength" class="bio-sequence-node__sequence-more">… ({{ sequence.length }} símbolos)</span>
      </pre>
    </section>

    <footer
      v-if="effectiveAnalysis.insights && effectiveAnalysis.insights.length"
      class="bio-sequence-node__footer"
    >
      <ul class="bio-sequence-node__insights">
        <li
          v-for="(msg, idx) in effectiveAnalysis.insights"
          :key="idx"
        >
          {{ msg }}
        </li>
      </ul>
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

type BioSequenceKind = 'dna' | 'rna' | 'protein'

interface OrfMeta {
  frame?: number
  start?: number
  end?: number
  lengthAminoacids?: number
}

interface BioAnalysisLike {
  rawLength?: number
  cleanedLength?: number
  gcPercent?: number | null
  baseCounts?: Record<string, number>
  invalidChars?: string[]
  motifs?: { motif: string; index: number }[]
  orfs?: OrfMeta[]
  complement?: string | null
  reverse?: string | null
  reverseComplement?: string | null
  insights?: string[]
}

/**
 * Accesores básicos
 */
const kind = computed<BioSequenceKind>(() => {
  const k = (props.node.attrs.kind as BioSequenceKind) ?? 'dna'
  if (k === 'dna' || k === 'rna' || k === 'protein') return k
  return 'dna'
})

const label = computed<string>(() => props.node.attrs.label ?? 'Secuencia sin título')

const sequence = computed<string>(() => String(props.node.attrs.sequence ?? ''))

const maxSnippetLength = 120

const sequenceSnippet = computed(() => {
  const seq = sequence.value
  if (seq.length <= maxSnippetLength) return seq
  return seq.slice(0, maxSnippetLength)
})

/**
 * Preferimos attrs.analysis (rellenado por useEditorBio),
 * pero si no existe hacemos un análisis mínimo como respaldo.
 */
const analysisFromAttrs = computed<BioAnalysisLike | null>(() => {
  const a = props.node.attrs.analysis
  if (a && typeof a === 'object') {
    return a as BioAnalysisLike
  }
  return null
})

function computeFallbackAnalysis(seq: string, k: BioSequenceKind): BioAnalysisLike {
  const rawLength = seq.length
  const cleaned = seq.replace(/[^A-Z]/gi, '').toUpperCase()
  const cleanedLength = cleaned.length

  let gc = 0
  if (k === 'dna' || k === 'rna') {
    for (const ch of cleaned) {
      if (ch === 'G' || ch === 'C') gc++
    }
  }

  const gcPercent =
    (k === 'dna' || k === 'rna') && cleanedLength > 0
      ? (gc / cleanedLength) * 100
      : null

  const insights: string[] = []

  if (cleanedLength === 0) {
    insights.push('La secuencia está vacía o no contiene símbolos alfabéticos.')
  } else if (gcPercent != null) {
    insights.push(`GC% aproximado: ${gcPercent.toFixed(1)}%.`)
  }

  return {
    rawLength,
    cleanedLength,
    gcPercent,
    orfs: [],
    insights,
  }
}

const effectiveAnalysis = computed<BioAnalysisLike>(() => {
  if (analysisFromAttrs.value) {
    return analysisFromAttrs.value
  }
  return computeFallbackAnalysis(sequence.value, kind.value)
})

/**
 * Resumen compacto para el encabezado del bloque.
 */
const analysisSummary = computed(() => {
  const a = effectiveAnalysis.value
  const length = a.cleanedLength ?? a.rawLength ?? sequence.value.length

  const lengthLabel = `${length} símbolo${length === 1 ? '' : 's'}`

  const gc =
    a.gcPercent != null
      ? `GC ${a.gcPercent.toFixed(1)}%`
      : null

  const orfsCount = Array.isArray(a.orfs) ? a.orfs.length : 0
  const orfLabel =
    orfsCount > 0 ? `${orfsCount} ORF${orfsCount > 1 ? 's' : ''}` : null

  return {
    lengthLabel,
    gcLabel: gc,
    orfLabel,
  }
})

const kindLabel = computed(() => {
  switch (kind.value) {
    case 'dna':
      return 'DNA'
    case 'rna':
      return 'RNA'
    case 'protein':
      return 'Proteína'
    default:
      return String(kind.value)
  }
})
</script>

<style scoped>
.bio-sequence-node {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 8px 10px;
  margin: 6px 0;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bio-sequence-node__header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bio-sequence-node__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.bio-sequence-node__label {
  font-weight: 600;
  color: #111827;
}

.bio-sequence-node__badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  white-space: nowrap;
}

.bio-sequence-node__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: #4b5563;
}

.bio-sequence-node__meta-item {
  font-variant-numeric: tabular-nums;
}

.bio-sequence-node__body {
  margin-top: 4px;
}

.bio-sequence-node__sequence {
  margin: 0;
  padding: 4px 6px;
  border-radius: 6px;
  background: #111827;
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
}

.bio-sequence-node__sequence-more {
  opacity: 0.7;
}

.bio-sequence-node__footer {
  margin-top: 4px;
}

.bio-sequence-node__insights {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
