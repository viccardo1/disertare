<!-- apps/frontend/src/editor/Editor.vue -->
<template>
  <div class="editor-container">
    <div class="ruler-horizontal" aria-hidden="true"></div>
    <div class="editor-main">
      <div class="ruler-vertical" aria-hidden="true"></div>

      <div class="editor-content">
        <!-- Contenedor oculto para medir altura de contenido (F2.2) -->
        <div ref="pageMeasure" class="page-measure" aria-hidden="true"></div>

        <!-- Vista CONTINUA (edición normal) -->
        <div
          v-if="editor && !isPagedPreview"
          class="editor-pane editor-pane--continuous"
        >
          <editor-content :editor="editor" />
        </div>

        <!-- Vista PAGINADA 1:1 (preview de solo lectura) · F2.2 -->
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

        <!-- Toolbar simple para pruebas de F2 (+ toggle F2.2) -->
        <div v-if="editor" class="editor-toolbar">
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
          <button @click="insertSlides" :aria-label="t('editor.toolbar.slides')">
            Slides
          </button>

          <!-- Toggle F2.2: vista continua / paginada -->
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
import { onMounted, onUnmounted, reactive, markRaw, ref } from 'vue'
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

// --------- helpers F2.2: bloques y paginación ---------------------

/**
 * Divide un bloque <pre><code> muy largo en sub-bloques
 * de ~5 líneas para que se repartan mejor entre páginas.
 */
function splitLongPreElement(el: HTMLElement): string[] {
  const codeEl = el.querySelector('code')
  const text = codeEl?.textContent ?? el.textContent ?? ''
  const lines = text.split('\n')

  const LINES_PER_CHUNK = 5
  const result: string[] = []
  const tempDiv = document.createElement('div')

  for (let i = 0; i < lines.length; i += LINES_PER_CHUNK) {
    const pre = document.createElement('pre')
    for (const attr of Array.from(el.attributes)) {
      pre.setAttribute(attr.name, attr.value)
    }

    const code = document.createElement('code')
    if (codeEl) {
      for (const attr of Array.from(codeEl.attributes)) {
        code.setAttribute(attr.name, attr.value)
      }
    }
    code.textContent = lines.slice(i, i + LINES_PER_CHUNK).join('\n')
    pre.appendChild(code)

    tempDiv.innerHTML = ''
    tempDiv.appendChild(pre)
    result.push(tempDiv.innerHTML)
  }

  return result
}

/**
 * Preprocesa el HTML en una lista de “bloques paginables”.
 * - Cada nodo de nivel superior es un bloque.
 * - Si un bloque <pre><code> es muy largo, se divide en sub-bloques.
 */
function extractBlocks(html: string): string[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const blocks: string[] = []
  const tempDiv = document.createElement('div')

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement

      if (el.tagName === 'PRE') {
        const codeText = el.textContent ?? ''
        if (codeText.length > 800) {
          const parts = splitLongPreElement(el)
          for (const part of parts) {
            blocks.push(part)
          }
          return
        }
      }

      if (el.outerHTML.trim()) {
        blocks.push(el.outerHTML)
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) {
        tempDiv.innerHTML = ''
        const p = document.createElement('p')
        p.textContent = text
        tempDiv.appendChild(p)
        blocks.push(tempDiv.innerHTML)
      }
    }
  })

  return blocks
}

/**
 * F2.2 — paginación basada en altura fija de página.
 */
function paginateHtml(html: string): Page[] {
  if (!html) {
    return [{ index: 0, html: '' }]
  }

  const host = pageMeasure.value
  if (!host) {
    return [{ index: 0, html }]
  }

  const blocks = extractBlocks(html)
  if (!blocks.length) {
    return [{ index: 0, html }]
  }

  const maxHeight = PAGE_HEIGHT_PX
  const result: Page[] = []
  let pageIndex = 0
  let currentBlocks: string[] = []

  host.innerHTML = ''

  for (const block of blocks) {
    host.innerHTML = currentBlocks.join('') + block
    const h = host.offsetHeight

    if (h <= maxHeight || currentBlocks.length === 0) {
      currentBlocks.push(block)
      continue
    }

    // cerrar página anterior
    host.innerHTML = currentBlocks.join('')
    const pageHtml = host.innerHTML

    if (pageHtml.replace(/<[^>]+>/g, '').trim().length > 0) {
      result.push({ index: pageIndex++, html: pageHtml })
    }

    // iniciar nueva página con el bloque actual
    currentBlocks = [block]
    host.innerHTML = block
  }

  // última página
  if (currentBlocks.length) {
    host.innerHTML = currentBlocks.join('')
    const pageHtml = host.innerHTML
    if (pageHtml.replace(/<[^>]+>/g, '').trim().length > 0) {
      result.push({ index: pageIndex, html: pageHtml })
    }
  }

  host.innerHTML = ''

  // eliminar páginas totalmente vacías, por seguridad
  return result.filter(
    (p) => p.html.replace(/<[^>]+>/g, '').trim().length > 0,
  )
}

function rebuildPages(): void {
  if (!editor) return
  const html = editor.getHTML()
  pages.value = paginateHtml(html)
}

function togglePagedPreview(): void {
  isPagedPreview.value = !isPagedPreview.value
  if (isPagedPreview.value) {
    rebuildPages()
  }
}

// ---------- stats + hook a paginación -----------------------------

const updateStats = (): void => {
  if (!editor) return
  const text = editor.getText()
  const tokens = text.match(/[\p{L}\p{N}]+/gu) ?? []
  stats.words = tokens.length
  stats.paragraphs = editor.state.doc.childCount

  const { $from } = editor.state.selection
  let currentParagraphNode: any = null
  for (let i = $from.depth; i >= 0; i--) {
    const node = $from.node(i)
    if (node.type.name === 'paragraph') {
      currentParagraphNode = node
      break
    }
  }

  if (currentParagraphNode) {
    const paraText = currentParagraphNode.textContent
    stats.wordsInCurrentParagraph =
      paraText.match(/[\p{L}\p{N}]+/gu)?.length || 0
    stats.linesInCurrentParagraph = Math.max(
      1,
      Math.ceil(paraText.length / 80),
    )
  } else {
    stats.wordsInCurrentParagraph = 0
    stats.linesInCurrentParagraph = 0
  }

  if (isPagedPreview.value) {
    rebuildPages()
  }
}

// ---------- ciclo de vida -----------------------------------------

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
        ],
        content:
          '<p>Prueba F2: inserta KaTeX, código, Mermaid, tabla, ..., CAD, DICOM, GeoSpatial o Slides desde la barra inferior.</p>',
      }),
    )

    editor.on('update', updateStats)
    updateStats()
    ;(window as any).editor = editor
  } catch (error) {
    console.error('[F2] Error al crear el editor:', error)
  }
})

onUnmounted(() => {
  editor?.destroy()
})

// ---------- comandos toolbar (sin cambios funcionales) ------------

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
  A[Inicio] --> B{Decisión}
  B -->|Sí| C[Camino 1]
  B -->|No| D[Camino 2]`

  editor
    .chain()
    .focus()
    .setMermaid({ content: diagram })
    .run()
}

const insertCodeBlock = (): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setPrism({
      language: 'javascript',
      content:
        '// Código de ejemplo\nfunction hola() {\n  console.log("Hola Disertare");\n}\n',
    })
    .run()
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

  const anyEditor = editor as any
  const chain = anyEditor.chain().focus() as any

  const sampleData =
    'Tarea A,2025-11-10,5\n' +
    'Tarea B,2025-11-12,3\n' +
    'Tarea C,2025-11-15,4'

  if (chain.setGantt) {
    chain
      .setGantt({
        mode: 'gantt',
        content: sampleData,
      })
      .run()
    return
  }

  if (anyEditor.commands?.setGantt) {
    anyEditor.commands.setGantt({
      mode: 'gantt',
      content: sampleData,
    })
    return
  }

  if (anyEditor.commands?.insertGantt) {
    anyEditor.commands.insertGantt({
      mode: 'gantt',
      content: sampleData,
    })
    return
  }

  console.warn(
    '[F2] No se encontró ningún comando de Gantt (setGantt / insertGantt) en editor.commands/chain.',
  )
}

const insertCad = (): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setCad({
      src: 'https://example.com/path-to-cad.dxf',
      title: 'Modelo CAD de ejemplo',
      width: '400px',
      height: '300px',
    })
    .run()
}

const insertDicom = (): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setDicom({
      src: 'https://example.com/path-to-dicom.dcm',
      title: 'Imagen DICOM de ejemplo',
      width: '400px',
      height: '300px',
    })
    .run()
}

const insertGeoSpatial = (): void => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setGeoSpatial({
      geoJson: '{}',
      title: 'Mapa GeoSpatial de ejemplo',
      width: '400px',
      height: '300px',
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
</script>

<style scoped>
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
    var(--purple-fade) 4px,
    transparent 4px,
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
    var(--purple-fade) 4px,
    transparent 4px,
    transparent 20px
  );
  border-right: 1px solid var(--purple-fade);
}

.editor-content {
  overflow: auto;
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
  position: relative;
}

/* Contenedor oculto para medición de altura (usa mismas dimensiones que la hoja) */
.page-measure {
  position: absolute;
  left: -99999px;
  top: 0;
  width: var(--disertare-page-width, 794px);
  padding: var(--disertare-page-padding, 32px 40px);
  visibility: hidden;
}

/* Paneles de vista */
.editor-pane {
  min-height: calc(100% - 2rem);
}

.editor-pane--continuous {
  background: #ffffff;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px var(--purple-fade);
}

.editor-pane--paged {
  background: transparent;
}

/* Contenedor de páginas F2.2 */
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
  border-top: 1px solid #eee9ff;
  background: #f9f6ff;
}

/* Toolbar inferior */
.editor-toolbar {
  position: sticky;
  bottom: 0;
  background: var(--purple-fade);
  padding: 4px;
  display: flex;
  gap: 4px;
  border-top: 1px solid var(--purple-fade);
}

.editor-toolbar button {
  padding: 4px 8px;
  font-size: 12px;
  background: #e0d6ff33;
  border: 1px solid #6a5f9444;
  border-radius: 4px;
  cursor: pointer;
}

.editor-toolbar button:hover {
  background: #6a5af922;
}

.toolbar-toggle {
  margin-left: auto;
  font-weight: 600;
}

/* Barra de info */
.editor-info-bar {
  display: flex;
  gap: 16px;
  padding: 4px 12px;
  background: var(--purple-fade);
  font-family: 'Atkinson Hyperlegible', sans-serif;
  font-size: 13px;
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
  padding: 4px 6px;
  font-size: 12px;
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
</style>
