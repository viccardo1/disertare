<!-- apps/frontend/src/editor/Editor.vue -->
<template>
  <div class="editor-container">
    <div class="ruler-horizontal" aria-hidden="true"></div>
    <div class="editor-main">
      <div class="ruler-vertical" aria-hidden="true"></div>
      <div class="editor-content">
        <editor-content v-if="editor" :editor="editor" />

        <!-- Toolbar simple para pruebas de F2 -->
        <div v-if="editor" class="editor-toolbar">
          <button @click="insertKatex" :aria-label="t('editor.toolbar.katex')">fx</button>
          <button @click="insertMermaid" :aria-label="t('editor.toolbar.mermaid')">M</button>
          <button @click="insertCodeBlock" :aria-label="t('editor.toolbar.code')">]</button>
          <button @click="insertTable" :aria-label="t('editor.toolbar.table')">T</button>
          <button @click="insertImage" :aria-label="t('editor.toolbar.image')">Img</button>
          <!-- Gantt -->
          <button @click="insertGantt" :aria-label="t('editor.toolbar.gantt')">Gantt</button>
          <!-- Nuevos nodos multimedia -->
          <button @click="insertCad" :aria-label="t('editor.toolbar.cad')">CAD</button>
          <button @click="insertDicom" :aria-label="t('editor.toolbar.dicom')">DICOM</button>
          <button @click="insertGeoSpatial" :aria-label="t('editor.toolbar.geospatial')">Geo</button>
          <button @click="insertSlides" :aria-label="t('editor.toolbar.slides')">Slides</button>
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
import { onMounted, onUnmounted, reactive, markRaw } from 'vue'
import { EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Editor } from '@tiptap/core'

// ✅ Assets obligatorios (F2)
import 'katex/dist/katex.min.css'
import 'prismjs/themes/prism.css'

// ✅ Extensiones propias de F2
import { Katex } from '@disertare/editor-ext-katex'
import { Prism } from '@disertare/editor-ext-prism'
import { Mermaid } from '@disertare/editor-ext-mermaid'
import { Image } from '@disertare/editor-ext-images'
import { Table, TableRow, TableHeader, TableCell } from '@disertare/editor-ext-tables'
import { Gantt } from '@disertare/editor-ext-gantt'
import { Cad } from '@disertare/editor-ext-cad'
import { Dicom } from '@disertare/editor-ext-dicom'
import { GeoSpatial } from '@disertare/editor-ext-geospatial'
import { Slides } from '@disertare/editor-ext-slides'

const stats = reactive({
  words: 0,
  paragraphs: 0,
  wordsInCurrentParagraph: 0,
  linesInCurrentParagraph: 0,
})

let editor: Editor | null = null

// Placeholder para i18n (F4.2+)
const t = (key: string) => key

const updateStats = () => {
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
    stats.wordsInCurrentParagraph = paraText.match(/[\p{L}\p{N}]+/gu)?.length || 0
    stats.linesInCurrentParagraph = Math.max(1, Math.ceil(paraText.length / 80))
  } else {
    stats.wordsInCurrentParagraph = 0
    stats.linesInCurrentParagraph = 0
  }
}

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
          '<p>Prueba F2: inserta KaTeX, código, Mermaid, tabla, imagen, Gantt, CAD, DICOM, GeoSpatial o Slides desde la barra inferior.</p>',
      }),
    )

    editor.on('update', updateStats)
    updateStats()

    // Para debugging en consola
    ;(window as any).editor = editor
  } catch (error) {
    console.error('[F2] Error al crear el editor:', error)
  }
})

const insertKatex = () => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setKatex({ content: 'E = mc^2', inline: false })
    .run()
}

const insertMermaid = () => {
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

const insertCodeBlock = () => {
  if (!editor) return
  editor
    .chain()
    .focus()
    .setPrism({
      language: 'javascript',
      content: '// Código de ejemplo\nfunction hola() {\n  console.log("Hola Disertare");\n}\n',
    })
    .run()
}

const insertTable = () => {
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

const insertImage = () => {
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

// --- Nuevo: inserción de Gantt ---
const insertGantt = () => {
  if (!editor) return

  const anyEditor = editor as any
  const chain = anyEditor.chain().focus() as any

  const sampleData =
    'Tarea A,2025-11-10,5\n' +
    'Tarea B,2025-11-15,3\n' +
    'Tarea C,2025-11-18,4'

  // Intentamos primero vía chain (lo más típico en TipTap)
  if (typeof chain.setGantt === 'function') {
    chain
      .setGantt({
        mode: 'gantt',
        content: sampleData,
      })
      .run()
    return
  }

  if (typeof chain.insertGantt === 'function') {
    chain
      .insertGantt({
        mode: 'gantt',
        content: sampleData,
      })
      .run()
    return
  }

  // Fallback directo a commands, por si la extensión se registró solo ahí
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

// --- Extensiones multimedia ya funcionando ---
const insertCad = () => {
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

const insertDicom = () => {
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

const insertGeoSpatial = () => {
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

const insertSlides = () => {
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

onUnmounted(() => {
  editor?.destroy()
})
</script>

<!-- Estilos del layout del editor (scoped) -->
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
  height: var(--ruler-size);
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
  width: var(--ruler-size);
  border-right: 1px solid var(--purple-fade);
}

.editor-content {
  overflow: auto;
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
  position: relative;
}

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
  border: 1px solid #6a5af944;
  border-radius: 4px;
  cursor: pointer;
}

.editor-toolbar button:hover {
  background: #6a5af922;
}

.editor-info-bar {
  display: flex;
  gap: 16px;
  padding: 4px 12px;
  background: var(--purple-fade);
  font-family: 'Atkinson Hyperlegible', sans-serif;
  font-size: 13px;
  color: #333;
  border-top: 1px solid var(--purple-fade);
}
</style>

<!-- Estilos GLOBALes para tablas dentro de ProseMirror -->
<style>
/* Tabla de TipTap / F2 dentro del editor */
.ProseMirror table,
.ProseMirror .disertare-table {
  border-collapse: collapse;
  width: 100%;
  background: #ffffff;
  table-layout: fixed;
  margin: 1rem 0;
}

/* Celdas y cabeceras visibles */
.ProseMirror th,
.ProseMirror td,
.ProseMirror .disertare-table th,
.ProseMirror .disertare-table td {
  border: 1px solid #6a5af9;
  min-width: 60px;
  min-height: 28px;
  padding: 4px 6px;
  font-size: 14px;
  text-align: left;
  vertical-align: top;
}

/* Cabecera destacada */
.ProseMirror th,
.ProseMirror .disertare-table th {
  background: #f3ecff;
  font-weight: 600;
}

/* Señal visual al pasar el ratón */
.ProseMirror tr:hover,
.ProseMirror .disertare-table tr:hover {
  background: #f9f6ff;
}

/* Celda seleccionada (cuando TipTap la marca) */
.ProseMirror .selectedCell {
  outline: 2px solid #ff9800;
  outline-offset: -2px;
}
</style>
