<!-- apps/frontend/src/editor/Editor.vue -->
<template>
  <div class="editor-container">
    <div class="ruler-horizontal" aria-hidden="true"></div>
    <div class="editor-main">
      <div class="ruler-vertical" aria-hidden="true"></div>

      <div class="editor-content">
        <!-- Contenedor oculto para medir altura de contenido (F2.2) -->
        <div ref="pageMeasure" class="page-measure" aria-hidden="true"></div>

        <!-- Panel de referencias (F2.3) -->
        <div
          v-if="showReferencesPanel"
          class="references-panel"
        >
          <div class="references-panel__header">
            <span><strong>Citas</strong></span>
            <button
              type="button"
              class="references-panel__close"
              @click="toggleReferencesPanel"
            >
              ×
            </button>
          </div>

          <div class="references-panel__row">
            <label>
              Estilo de cita
              <select v-model="currentCitationStyle">
                <option
                  v-for="style in citationStyles"
                  :key="style"
                  :value="style"
                >
                  {{ style.toUpperCase() }}
                </option>
              </select>
            </label>
          </div>

          <div class="references-panel__row">
            <div class="references-panel__row-title">
              {{ editingRefId ? 'Editar referencia' : 'Nueva referencia rápida' }}
            </div>
            <label>
              Autor (Apellido, Nombre)
              <input
                v-model="newRefAuthor"
                placeholder="Pérez, Ana"
              />
            </label>
            <label>
              Año
              <input
                v-model="newRefYear"
                placeholder="2020"
              />
            </label>
            <label>
              Título
              <input
                v-model="newRefTitle"
                placeholder="Título de la obra"
              />
            </label>
            <div class="references-panel__new-actions">
              <button type="button" @click="addQuickReference">
                {{ editingRefId ? 'Guardar cambios' : 'Agregar y citar' }}
              </button>
              <button
                v-if="editingRefId"
                type="button"
                class="references-panel__secondary"
                @click="cancelEditReference"
              >
                Cancelar
              </button>
            </div>
          </div>

          <div class="references-panel__list">
            <div
              v-for="ref in references"
              :key="ref.id"
              class="references-panel__item"
            >
              <div class="references-panel__item-main">
                <div class="references-panel__item-title">
                  {{ ref.title || '[Sin título]' }}
                </div>
                <div class="references-panel__item-meta">
                  {{ primaryAuthorLabel(ref) }} ·
                  {{ ref.issued?.year ?? 's. f.' }}
                </div>
              </div>
              <div class="references-panel__item-actions">
                <button
                  type="button"
                  @click="insertCitationFor(ref.id)"
                >
                  Citar
                </button>
                <button
                  type="button"
                  @click="startEditReference(ref)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="references-panel__delete"
                  @click="deleteReference(ref.id)"
                >
                  ✕
                </button>
              </div>
            </div>

            <p
              v-if="references.length === 0"
              class="references-panel__empty"
            >
              Aún no hay referencias. Crea una arriba.
            </p>
          </div>

          <!-- Import/Export BibTeX / CSL-JSON -->
          <div class="references-panel__import">
            <details>
              <summary>BibTeX / CSL-JSON</summary>
              <div class="references-panel__import-section">
                <label>
                  BibTeX
                  <textarea
                    v-model="bibtexText"
                    rows="4"
                    spellcheck="false"
                  ></textarea>
                </label>
                <div class="references-panel__import-actions">
                  <button type="button" @click="importBibtex">
                    Importar BibTeX
                  </button>
                </div>

                <label>
                  CSL-JSON
                  <textarea
                    v-model="cslJsonText"
                    rows="4"
                    spellcheck="false"
                  ></textarea>
                </label>
                <div class="references-panel__import-actions">
                  <button type="button" @click="importCslJson">
                    Importar CSL-JSON
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>

        <!-- Vista CONTINUA (edición normal) -->
        <div
          v-if="editor && !isPagedPreview"
          class="editor-pane editor-pane--continuous"
        >
          <EditorContent :editor="editor" />
        </div>

        <!-- Vista PAGINADA 1:1 (F2.2) -->
        <div
          v-if="editor && isPagedPreview"
          class="editor-pane editor-pane--paged"
        >
          <div class="page-preview-container">
            <div
              v-for="page in pages"
              :key="page.index"
              class="page-preview"
            >
              <div
                class="page-preview-inner"
                v-html="page.html"
              />
              <div class="page-preview-footer">
                Página {{ page.index + 1 }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Barra inferior de herramientas (F2) -->
      <div class="editor-toolbar-container">
        <div class="editor-toolbar">
          <button @click="insertKatex" :aria-label="t('editor.toolbar.katex')">
            fx
          </button>
          <button
            @click="insertMermaid"
            :aria-label="t('editor.toolbar.mermaid')"
          >
            M
          </button>
          <button @click="insertCodeBlock" :aria-label="t('editor.toolbar.code')">
            ]
          </button>
          <button @click="insertTable" :aria-label="t('editor.toolbar.table')">
            T
          </button>
          <button
            @click="insertCitation"
            :aria-label="t('editor.toolbar.citation')"
          >
            Cita
          </button>
          <button
            @click="insertBibliographyBlock"
            :aria-label="t('editor.toolbar.bibliography')"
          >
            Biblio
          </button>
          <button @click="insertImage" :aria-label="t('editor.toolbar.image')">
            Img
          </button>

          <button @click="insertGantt" :aria-label="t('editor.toolbar.gantt')">
            Gantt
          </button>

          <button @click="insertCad" :aria-label="t('editor.toolbar.cad')">
            CAD
          </button>
          <button @click="insertDicom" :aria-label="t('editor.toolbar.dicom')">
            DICOM
          </button>
          <button
            @click="insertGeoSpatial"
            :aria-label="t('editor.toolbar.geospatial')"
          >
            Geo
          </button>
          <button
            @click="insertSlides"
            :aria-label="t('editor.toolbar.slides')"
          >
            Slides
          </button>
        </div>

        <div class="editor-toolbar-secondary">
          <button
            type="button"
            class="toolbar-toggle"
            @click="toggleReferencesPanel"
          >
            Gestor de citas
          </button>
          <button
            type="button"
            class="toolbar-toggle"
            @click="togglePagedPreview"
          >
            {{ isPagedPreview ? 'Vista continua' : 'Vista paginada 1:1' }}
          </button>
        </div>
      </div>
    </div>

    <div class="editor-info-bar" aria-live="polite">
      <span>Total: {{ stats.words }} palabras</span>
      <span>{{ stats.paragraphs }} párrafos</span>
      <span>Párrafo: {{ stats.wordsInCurrentParagraph }} palabras</span>
      <span>{{ stats.linesInCurrentParagraph }} líneas</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  onMounted,
  onUnmounted,
  reactive,
  markRaw,
  ref,
  watch,
} from 'vue'
import { EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Editor } from '@tiptap/core'

import 'katex/dist/katex.min.css'
import 'prismjs/themes/prism.css'

import { Katex } from '@disertare/editor-ext-katex'
import { Prism } from '@disertare/editor-ext-prism'
import { Mermaid } from '@disertare/editor-ext-mermaid'
import { Image } from '@disertare/editor-ext-images'
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from '@disertare/editor-ext-tables'
import { Gantt } from '@disertare/editor-ext-gantt'
import { Cad } from '@disertare/editor-ext-cad'
import { Dicom } from '@disertare/editor-ext-dicom'
import { GeoSpatial } from '@disertare/editor-ext-geospatial'
import { Slides } from '@disertare/editor-ext-slides'
import {
  CitationInline,
  Bibliography,
  createCitationManager,
  defaultCitationFormatter,
  parseBibTeX,
  formatBibTeX,
  toCslJson,
  fromCslJson,
} from '@disertare/editor-citations'
import type {
  CitationStyleId,
  Reference,
  PersonName,
} from '@disertare/editor-citations'

type Page = {
  index: number
  html: string
}

// Altura fija “útil” de página para F2.2 (contenido sin footer)
const PAGE_HEIGHT_PX = 1100

// ---- estado global del editor (F2 / F2.2) ------------------------

const stats = reactive({
  words: 0,
  paragraphs: 0,
  wordsInCurrentParagraph: 0,
  linesInCurrentParagraph: 0,
})

let editor: Editor | null = null

const isPagedPreview = ref(false)
const pages = ref<Page[]>([])

const pageMeasure = ref<HTMLElement | null>(null)

// placeholder i18n (se integrará en fases posteriores)
const t = (key: string) => key

// ---- F2.3: gestor de citas y estilo actual -----------------------

const citationManager = createCitationManager()
const currentCitationStyle = ref<CitationStyleId>('apa')
const citationStyles: CitationStyleId[] = [
  'apa',
  'mla',
  'chicago',
  'harvard',
  'vancouver',
  'ieee',
  'acs',
  'iso690',
  'turabian',
]

const showReferencesPanel = ref(false)
const references = ref<Reference[]>([])

const newRefAuthor = ref('')
const newRefYear = ref('')
const newRefTitle = ref('')

const editingRefId = ref<string | null>(null)

const bibtexText = ref('')
const cslJsonText = ref('')

// --- util para obligar a re-renderizar citas y bibliografía -----

function bumpCitationAndBibliographyRenderVersion(): void {
  if (!editor) return

  const { state, view } = editor
  let tr = state.tr
  let changed = false

  state.doc.descendants((node, pos) => {
    if (node.type.name === 'citationInline') {
      const current =
        (node.attrs as any).renderVersion != null
          ? Number((node.attrs as any).renderVersion)
          : 0

      const newAttrs = {
        ...node.attrs,
        renderVersion: current + 1,
      }

      tr = tr.setNodeMarkup(pos, node.type, newAttrs)
      changed = true
    } else if (node.type.name === 'bibliography') {
      const current =
        (node.attrs as any).renderVersion != null
          ? Number((node.attrs as any).renderVersion)
          : 0

      const newAttrs = {
        ...node.attrs,
        renderVersion: current + 1,
      }

      tr = tr.setNodeMarkup(pos, node.type, newAttrs)
      changed = true
    }
  })

  if (changed) {
    view.dispatch(tr)
  }
}

// cualquier cambio de estilo → el gestor actualiza su estilo
// y actualizamos representaciones + BibTeX / CSL
watch(currentCitationStyle, (style) => {
  citationManager.setStyle(style)
  refreshReferences()
})

function refreshReferences(): void {
  const refs = citationManager.listReferences()
  references.value = refs
  bibtexText.value = formatBibTeX(refs)
  cslJsonText.value = JSON.stringify(toCslJson(refs), null, 2)

  // Forzamos re-render de citas y bibliografía para que
  // el documento refleje los cambios de inmediato.
  bumpCitationAndBibliographyRenderVersion()
}

function parsePersonName(input: string): PersonName | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const parts = trimmed.split(',')
  if (parts.length === 2) {
    const family = parts[0].trim()
    const given = parts[1].trim()
    return { family, given }
  }
  return { literal: trimmed }
}

const resetQuickForm = (): void => {
  newRefAuthor.value = ''
  newRefYear.value = ''
  newRefTitle.value = ''
}

const addQuickReference = (): void => {
  const authorName = parsePersonName(newRefAuthor.value)
  const yearNum = parseInt(newRefYear.value, 10)
  const issued =
    Number.isFinite(yearNum) && !Number.isNaN(yearNum)
      ? { year: yearNum }
      : undefined

  // modo edición
  if (editingRefId.value) {
    const id = editingRefId.value
    citationManager.updateReference(id, {
      title: newRefTitle.value || 'Referencia sin título',
      author: authorName ? [authorName] : undefined,
      issued,
    })

    editingRefId.value = null
    resetQuickForm()
    refreshReferences()
    return
  }

  // modo alta rápida
  const ref = citationManager.addReference({
    type: 'article-journal',
    title: newRefTitle.value || 'Referencia sin título',
    author: authorName ? [authorName] : undefined,
    issued,
  })

  resetQuickForm()
  refreshReferences()

  if (editor) {
    editor
      .chain()
      .focus()
      .insertCitation({
        refId: ref.id,
        locator: null,
        prefix: null,
        suffix: null,
      })
      .run()
  }
}

const cancelEditReference = (): void => {
  editingRefId.value = null
  resetQuickForm()
}

const startEditReference = (ref: Reference): void => {
  editingRefId.value = ref.id
  newRefTitle.value = ref.title ?? ''

  const a = ref.author && ref.author[0]
  if (a?.family && a?.given) {
    newRefAuthor.value = `${a.family}, ${a.given}`
  } else if (a?.literal) {
    newRefAuthor.value = a.literal
  } else {
    newRefAuthor.value = a?.family ?? a?.given ?? ''
  }

  newRefYear.value =
    ref.issued && typeof ref.issued.year === 'number'
      ? String(ref.issued.year)
      : ''
}

const deleteReference = (id: string): void => {
  citationManager.removeReference(id)
  if (editingRefId.value === id) {
    editingRefId.value = null
    resetQuickForm()
  }
  refreshReferences()
}

const insertCitationFor = (refId: string): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .insertCitation({
      refId,
      locator: null,
      prefix: null,
      suffix: null,
    })
    .run()
}

function primaryAuthorLabel(ref: Reference): string {
  const a = ref.author && ref.author[0]
  if (!a) return 'Autor desconocido'
  if (a.family && a.given) return `${a.family}, ${a.given}`
  if (a.literal) return a.literal
  return a.family ?? a.given ?? 'Autor'
}

const importBibtex = (): void => {
  try {
    const parsed = parseBibTeX(bibtexText.value)
    for (const ref of parsed) {
      const { id, ...rest } = ref
      citationManager.addReference({ ...rest, id })
    }
    refreshReferences()
  } catch (error) {
    console.error('[F2.3] Error al importar BibTeX:', error)
  }
}

const importCslJson = (): void => {
  let data: unknown
  try {
    data = JSON.parse(cslJsonText.value)
  } catch (error) {
    console.error('[F2.3] CSL-JSON inválido:', error)
    return
  }

  const arr = Array.isArray(data) ? data : [data]
  const refs = fromCslJson(arr as any[])

  for (const ref of refs) {
    const { id, ...rest } = ref
    citationManager.addReference({ ...rest, id })
  }

  refreshReferences()
}

// --------- helpers F2.2: bloques y paginación ---------------------

function splitLongPreElement(el: HTMLElement): string[] {
  const codeEl = el.querySelector('code')
  const text = codeEl?.textContent ?? el.textContent ?? ''
  const lines = text.split('\n')

  if (lines.length <= 10) {
    return [el.outerHTML]
  }

  const chunks: string[] = []
  const chunkSize = 10

  for (let i = 0; i < lines.length; i += chunkSize) {
    const slice = lines.slice(i, i + chunkSize).join('\n')
    const wrapper = document.createElement('pre')
    const code = document.createElement('code')
    code.textContent = slice
    wrapper.appendChild(code)
    for (const attr of Array.from(el.attributes)) {
      wrapper.setAttribute(attr.name, attr.value)
    }
    chunks.push(wrapper.outerHTML)
  }

  return chunks
}

function splitHtmlIntoBlocks(html: string): string[] {
  if (!html.trim()) return []

  const container = document.createElement('div')
  container.innerHTML = html

  const blocks: string[] = []
  const blockSelectors = [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'pre',
    'table',
    'blockquote',
    'hr',
    'div',
    'section',
    'figure',
  ]

  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement

      if (el.matches('pre')) {
        const chunks = splitLongPreElement(el)
        blocks.push(...chunks)
      } else if (blockSelectors.some((sel) => el.matches(sel))) {
        blocks.push(el.outerHTML)
      } else {
        blocks.push(el.outerHTML)
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = (node.textContent ?? '').trim()
      if (trimmed) {
        const p = document.createElement('p')
        p.textContent = trimmed
        blocks.push(p.outerHTML)
      }
    }
  })

  return blocks
}

function paginateHtml(html: string, host: HTMLElement, maxHeight: number): Page[] {
  if (!html.trim()) {
    return [{ index: 0, html: '' }]
  }

  const blocks = splitHtmlIntoBlocks(html)
  const result: Page[] = []

  let currentBlocks: string[] = []
  let pageIndex = 0

  for (const block of blocks) {
    host.innerHTML = currentBlocks.join('') + block
    const h = host.offsetHeight

    if (h <= maxHeight || currentBlocks.length === 0) {
      currentBlocks.push(block)
      continue
    }

    host.innerHTML = currentBlocks.join('')
    const pageHtml = host.innerHTML

    if (pageHtml.replace(/<[^>]+>/g, '').trim().length > 0) {
      result.push({ index: pageIndex++, html: pageHtml })
    }

    currentBlocks = [block]
    host.innerHTML = block
  }

  if (currentBlocks.length) {
    host.innerHTML = currentBlocks.join('')
    const pageHtml = host.innerHTML
    if (pageHtml.replace(/<[^>]+>/g, '').trim().length > 0) {
      result.push({ index: pageIndex, html: pageHtml })
    }
  }

  return result
}

function recomputePages() {
  if (!editor || !isPagedPreview.value) {
    pages.value = []
    return
  }

  const html = editor.getHTML()
  const host = pageMeasure.value

  if (!host) {
    pages.value = [{ index: 0, html }]
    return
  }

  const computed = paginateHtml(html, host, PAGE_HEIGHT_PX)
  pages.value = computed
}

// ---------- estadísticas F2 (palabras, párrafos, etc.) ------------

function updateStats() {
  if (!editor) return

  const json = editor.getJSON()
  let totalWords = 0
  let paragraphs = 0

  const cursorPos = editor.state.selection.from
  let wordsInCurrentParagraph = 0
  let linesInCurrentParagraph = 0

  function countWords(text: string): number {
    const cleaned = text
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()
    if (!cleaned) return 0
    return cleaned.split(/\s+/).length
  }

  function traverse(node: any, fromPos: { value: number }) {
    if (!node) return

    if (node.type === 'paragraph') {
      paragraphs += 1

      const text = (node.content || [])
        .filter((child: any) => child.type === 'text')
        .map((child: any) => child.text || '')
        .join('')

      const wordCount = countWords(text)
      totalWords += wordCount

      const startPos = fromPos.value
      const endPos = startPos + text.length

      if (cursorPos >= startPos && cursorPos <= endPos) {
        wordsInCurrentParagraph = wordCount
        linesInCurrentParagraph = Math.max(1, Math.ceil(text.length / 80))
      }

      fromPos.value = endPos + 1
    } else if (Array.isArray(node.content)) {
      for (const child of node.content) {
        traverse(child, fromPos)
      }
    }
  }

  traverse(json, { value: 0 })

  stats.words = totalWords
  stats.paragraphs = paragraphs
  stats.wordsInCurrentParagraph = wordsInCurrentParagraph
  stats.linesInCurrentParagraph = linesInCurrentParagraph
}

// ---------------- ciclo de vida del editor ------------------------

onMounted(() => {
  try {
    editor = markRaw(
      new Editor({
        extensions: [
          StarterKit,
          Katex,
          Prism,
          Mermaid,
          Image,
          Table.configure({
            resizable: true,
            HTMLAttributes: { class: 'disertare-table' },
          }),
          TableRow,
          TableHeader,
          TableCell,
          Gantt,
          Cad,
          Dicom,
          GeoSpatial,
          Slides,
          CitationInline.configure({
            getReferenceById: (id: string) => citationManager.getReference(id),
            getCurrentStyle: () => currentCitationStyle.value,
            formatter: defaultCitationFormatter,
          }),
          Bibliography.configure({
            getReferences: () => citationManager.listReferences(),
            getCurrentStyle: () => currentCitationStyle.value,
            formatter: defaultCitationFormatter,
          }),
        ],
        content:
          '<p>Prueba F2: inserta KaTeX, código, Mermaid, tabla, ..., CAD, DICOM, GeoSpatial o Slides desde la barra inferior.</p>',
      }),
    )

    // Hacer visible el editor en window para inspección en consola
    ;(window as any).editor = editor

    editor.on('update', () => {
      updateStats()
      if (isPagedPreview.value) {
        recomputePages()
      }
    })

    editor.on('selectionUpdate', updateStats)

    if (isPagedPreview.value) {
      recomputePages()
    }

    refreshReferences()
  } catch (error) {
    console.error('[F2] Error al inicializar el editor:', error)
  }
})

onUnmounted(() => {
  if (editor) {
    editor.destroy()
    editor = null
    ;(window as any).editor = null
  }
})

// --------------------- acciones de UI -----------------------------

const togglePagedPreview = (): void => {
  isPagedPreview.value = !isPagedPreview.value
  if (isPagedPreview.value) {
    recomputePages()
  }
}

const toggleReferencesPanel = (): void => {
  showReferencesPanel.value = !showReferencesPanel.value
  if (showReferencesPanel.value) {
    refreshReferences()
  } else {
    cancelEditReference()
  }
}

// ---------- comandos toolbar (F2) ---------------------------------

const insertKatex = (): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setKatex({ content: 'E = mc^2', inline: false })
    .run()
}

const insertMermaid = (): void => {
  if (!editor) return
  const diagram = `graph TD
  A[Inicio] --> B{Decision}
  B -->|Sí| C[Camino 1]
  B -->|No| D[Camino 2]
`
  editor
    .chain()
    .focus()
    .setMermaid({
      code: diagram,
    })
    .run()
}

const insertCodeBlock = (): void => {
  if (!editor) return
  editor.chain().focus().setCodeBlock().run()
}

const insertTable = (): void => {
  if (!editor) return

  const anyEditor = editor as any
  const hasInsertTable = !!anyEditor.commands?.insertTable
  const hasSetTable = !!anyEditor.commands?.setTable

  if (hasInsertTable) {
    anyEditor.commands.insertTable({
      rows: 3,
      cols: 3,
      withHeaderRow: true,
    })
  } else if (hasSetTable) {
    anyEditor.commands.setTable({
      rows: 3,
      cols: 3,
      hasHeader: true,
    })
  } else {
    console.warn(
      '[F2] No se encontró ningún comando de tabla (insertTable ni setTable) en editor.commands.',
    )
  }
}

const insertImage = (): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setImage({
      src: 'https://placehold.co/600x400?text=Disertare+Image',
      alt: 'Imagen de prueba Disertare',
      title: 'Imagen de prueba',
    })
    .run()
}

const insertGantt = (): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setGantt({
      tasks: [
        { id: '1', name: 'Tarea 1', start: '2025-01-01', end: '2025-01-07' },
        { id: '2', name: 'Tarea 2', start: '2025-01-08', end: '2025-01-15' },
      ],
    })
    .run()
}

const insertCad = (): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setCad({
      src: 'https://example.com/archivo.dwg',
      title: 'Modelo CAD de ejemplo',
    })
    .run()
}

const insertDicom = (): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setDicom({
      src: 'https://example.com/estudio.dcm',
      title: 'Estudio DICOM de ejemplo',
    })
    .run()
}

const insertGeoSpatial = (): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setGeoSpatial({
      geojson: {
        type: 'FeatureCollection',
        features: [],
      },
      title: 'Capa geoespacial de ejemplo',
    })
    .run()
}

const insertSlides = (): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setSlides({
      content: 'Slide 1\n---\nSlide 2\n---\nSlide 3',
      title: 'Presentación de ejemplo',
      width: '600px',
      height: '400px',
    })
    .run()
}

// --------- F2.3: comandos para citas y bibliografía ---------------

const insertCitation = (): void => {
  if (!editor) return

  const currentRefs = citationManager.listReferences()
  if (currentRefs.length === 0) {
    showReferencesPanel.value = true
    return
  }

  const refId = currentRefs[0].id

  editor
    .chain()
    .focus()
    .insertCitation({
      refId,
      locator: null,
      prefix: null,
      suffix: null,
    })
    .run()
}

const insertBibliographyBlock = (): void => {
  if (!editor) return

  const { state } = editor
  const type = state.schema.nodes['bibliography']

  if (!type) {
    console.warn('[F2.3] Nodo bibliography no encontrado en el schema.')
    return
  }

  let foundPos: number | null = null

  state.doc.descendants((node, pos) => {
    if (node.type === type && foundPos === null) {
      foundPos = pos
      return false
    }
    return true
  })

  if (foundPos != null) {
    // Ya hay bibliografía: seleccionamos el nodo de bloque
    editor
      .chain()
      .focus()
      .setNodeSelection(foundPos)
      .run()
    return
  }

  // No hay bibliografía: insertamos una nueva
  editor
    .chain()
    .focus()
    .insertBibliography({
      style: currentCitationStyle.value,
      title: 'Referencias',
    })
    .run()
}
</script>

<style scoped>
/* estilos igual que antes, sin cambios */
.editor-container {
  --purple-fade: #e0d6ff33;
  --ruler-size: 20px;

  display: grid;
  grid-template-rows: var(--ruler-size) 1fr auto;
  height: 100%;
  overflow: hidden;
}

.ruler-horizontal {
  background: repeating-linear-gradient(
    to right,
    var(--purple-fade),
    var(--purple-fade) 10px,
    transparent 10px,
    transparent 20px
  );
  border-bottom: 1px solid var(--purple-fade);
}

.editor-main {
  display: grid;
  grid-template-columns: var(--ruler-size) 1fr;
  height: 100%;
  overflow: hidden;
}

.ruler-vertical {
  background: repeating-linear-gradient(
    to bottom,
    var(--purple-fade),
    var(--purple-fade) 10px,
    transparent 10px,
    transparent 20px
  );
  border-right: 1px solid var(--purple-fade);
}

.editor-content {
  position: relative;
  overflow: auto;
  padding: 24px;
  background: #f5f3ff;
}

/* Contenedor oculto para mediciones (F2.2) */
.page-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
  inset: 0;
  max-width: var(--disertare-page-width, 794px);
  padding: var(--disertare-page-padding, 32px 40px);
  box-sizing: border-box;
}

/* Paneles del editor */
.editor-pane {
  max-width: var(--disertare-page-width, 794px);
  margin: 0 auto;
}

/* Vista continua */
.editor-pane--continuous {
  background: #ffffff;
  padding: 24px 32px;
  border-radius: 4px;
  box-shadow:
    0 0 0 1px var(--purple-fade),
    0 4px 12px rgba(0, 0, 0, 0.06);
}

/* Vista paginada F2.2 */
.editor-pane--paged {
  padding: 16px 0 32px;
}

/* Toolbar inferior */
.editor-toolbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 16px;
  border-top: 1px solid #e0d6ff;
  background: #f9f7ff;
}

.editor-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.editor-toolbar-secondary {
  display: flex;
  gap: 8px;
}

/* Botones de toolbar */
.editor-toolbar button,
.editor-toolbar-secondary .toolbar-toggle {
  border: 1px solid #d3cfff;
  background: #ffffff;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  cursor: pointer;
  color: #4b3f72;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.editor-toolbar button:hover,
.editor-toolbar-secondary .toolbar-toggle:hover {
  background: #f3ecff;
  border-color: #c1b6ff;
  box-shadow: 0 0 0 1px #d3cfff;
}

.toolbar-toggle {
  font-weight: 600;
}

/* Info bar inferior */
.editor-info-bar {
  display: flex;
  gap: 16px;
  padding: 4px 16px 8px;
  font-size: 12px;
  color: #5f4b8b;
  background: #f2efff;
  border-top: 1px solid #e0d6ff;
}

/* Vista de páginas (F2.2) */
.page-preview-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  padding-bottom: 32px;
}

.page-preview {
  width: var(--disertare-page-width, 794px);
  min-height: var(--disertare-page-height, 1123px);
  background: #ffffff;
  box-shadow:
    0 0 0 1px var(--purple-fade),
    0 4px 16px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.page-preview-inner {
  flex: 1;
  padding: var(--disertare-page-padding, 32px 40px);
  overflow: hidden;
}

.page-preview-footer {
  padding: 4px 12px 8px;
  font-size: 11px;
  text-align: right;
  color: #6a5af9;
}

/* Estilos básicos del contenido ProseMirror */
.ProseMirror {
  outline: none;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  line-height: 1.6;
  font-size: 15px;
}

/* Párrafos y encabezados */
.ProseMirror p {
  margin: 0 0 0.75em;
}

.ProseMirror h1,
.ProseMirror h2,
.ProseMirror h3,
.ProseMirror h4,
.ProseMirror h5,
.ProseMirror h6 {
  margin: 1.5em 0 0.5em;
  font-weight: 600;
  line-height: 1.3;
}

.ProseMirror h1 {
  font-size: 28px;
}
.ProseMirror h2 {
  font-size: 24px;
}
.ProseMirror h3 {
  font-size: 20px;
}
.ProseMirror h4 {
  font-size: 18px;
}
.ProseMirror h5 {
  font-size: 16px;
}
.ProseMirror h6 {
  font-size: 14px;
}

/* Listas */
.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

/* Código */
.ProseMirror pre {
  background: #1e1e1e;
  color: #f8f8f2;
  padding: 12px 14px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 13px;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, 'Liberation Mono', 'Courier New', monospace;
}

/* KaTeX */
.katex-display {
  margin: 1em 0;
}

/* Tablas F2.1 */
.ProseMirror table,
.ProseMirror .disertare-table {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
}

.ProseMirror th,
.ProseMirror td,
.ProseMirror .disertare-table th,
.ProseMirror .disertare-table td {
  border: 1px solid #d3cfff;
  padding: 4px 8px;
  font-size: 13px;
}

.ProseMirror th,
.ProseMirror .disertare-table th {
  background: #f3ecff;
  font-weight: 600;
}

.ProseMirror tr:hover,
.ProseMirror .disertare-table tr:hover {
  background: #f9f6ff;
}

.ProseMirror .selectedCell {
  outline: 2px solid #ff9800;
  outline-offset: -2px;
}

.dsr-citation-inline {
  padding: 0 2px;
  border-radius: 2px;
  background: #f3ecff;
  color: #6a5af9;
  font-size: 0.85em;
}

.dsr-bibliography {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0d6ff;
}

.dsr-bibliography__title {
  font-size: 16px;
  margin-bottom: 8px;
  color: #3c366b;
}

.dsr-bibliography__list {
  padding-left: 20px;
  margin: 0;
}

/* Panel de referencias */
.references-panel {
  position: fixed;
  right: 24px;
  bottom: 72px;
  width: 320px;
  max-height: 60vh;
  background: #ffffff;
  border-radius: 6px;
  box-shadow:
    0 0 0 1px #e0d6ff,
    0 10px 30px rgba(0, 0, 0, 0.15);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 50;
  font-size: 13px;
}

.references-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.references-panel__close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
  color: #6a5af9;
}

.references-panel__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.references-panel__row-title {
  font-size: 12px;
  font-weight: 600;
  color: #4b3f72;
}

.references-panel__row label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.references-panel__row input,
.references-panel__row select {
  border-radius: 4px;
  border: 1px solid #d3cfff;
  padding: 4px 6px;
  font-size: 13px;
}

.references-panel__new-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
}

.references-panel__new-actions button,
.references-panel__item button {
  border-radius: 4px;
  border: 1px solid #d3cfff;
  background: #f3ecff;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
}

.references-panel__secondary {
  background: #ffffff;
}

.references-panel__list {
  margin-top: 4px;
  border-top: 1px solid #f1ecff;
  padding-top: 4px;
  overflow-y: auto;
}

.references-panel__item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px dashed #f1ecff;
}

.references-panel__item-main {
  flex: 1;
  min-width: 0;
}

.references-panel__item-title {
  font-weight: 600;
  color: #3c366b;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.references-panel__item-meta {
  font-size: 11px;
  color: #6b6b8f;
}

.references-panel__item-actions {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.references-panel__delete {
  background: #ffecec;
  border-color: #ffc5c5;
  color: #c53030;
}

.references-panel__empty {
  font-size: 12px;
  color: #7a7399;
  margin: 4px 0 0;
}

/* Import/Export BibTeX / CSL */
.references-panel__import {
  margin-top: 6px;
  border-top: 1px solid #f1ecff;
  padding-top: 4px;
}

.references-panel__import summary {
  cursor: pointer;
  font-weight: 600;
  color: #4b3f72;
}

.references-panel__import-section {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.references-panel__import textarea {
  width: 100%;
  min-height: 60px;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  border-radius: 4px;
  border: 1px solid #d3cfff;
  padding: 4px 6px;
}

.references-panel__import-actions {
  display: flex;
  justify-content: flex-end;
}

.references-panel__import-actions button {
  border-radius: 4px;
  border: 1px solid #d3cfff;
  background: #f3ecff;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
}
</style>
