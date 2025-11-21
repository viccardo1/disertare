<!-- apps/frontend/src/editor/Editor.vue -->
<template>
  <div class="editor-container">
    <div class="ruler-horizontal" aria-hidden="true"></div>
    <div class="editor-main">
      <div class="ruler-vertical" aria-hidden="true"></div>

      <div class="editor-content">
        <!-- Contenedor oculto para medir altura de contenido (F2.2 / F2.3.R) -->
        <div ref="pageMeasure" class="page-measure" aria-hidden="true"></div>

        <!-- Panel de referencias (F2.3) -->
        <EditorReferencesPanel
          v-if="showReferencesPanel"
          :citation-manager="citationManager"
          v-model:currentCitationStyle="currentCitationStyle"
          :citation-styles="citationStyles"
          @close="toggleReferencesPanel"
          @references-changed="onReferencesChanged"
          @insert-citation="insertCitationFor"
        />

        <!-- Vista CONTINUA (edición normal) -->
        <div
          v-if="editor && !isPagedPreview"
          class="editor-pane editor-pane--continuous"
        >
          <EditorContent :editor="editor" />
        </div>

        <!-- Vista PAGINADA 1:1 (F2.2 / F2.3.R) -->
        <EditorPagedPreview
          v-if="editor && isPagedPreview"
          :pages="pages"
        />
      </div>

      <!-- Barra inferior de herramientas (F2) -->
      <div class="editor-toolbar-container">
        <EditorToolbarPrimary
          @insert-katex="insertKatex"
          @insert-mermaid="insertMermaid"
          @insert-code-block="insertCodeBlock"
          @insert-table="insertTable"
          @insert-citation="handleInsertCitationFromToolbar"
          @insert-bibliography="insertBibliographyBlock"
          @insert-image="insertImage"
          @insert-gantt="insertGantt"
          @insert-cad="insertCad"
          @insert-dicom="insertDicom"
          @insert-geospatial="insertGeoSpatial"
          @insert-slides="insertSlides"
        />

        <EditorToolbarSecondary
          :is-paged-preview="isPagedPreview"
          @toggle-references="toggleReferencesPanel"
          @toggle-paged-preview="togglePagedPreview"
        />
      </div>
    </div>

    <EditorInfoBar :stats="stats" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { EditorContent } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/core'

import 'katex/dist/katex.min.css'
import 'prismjs/themes/prism.css'

import { usePagedPreview } from './composables/usePagedPreview'
import { useEditorStats } from './composables/useEditorStats'
import { useDisertareEditor } from './composables/useDisertareEditor'
import { useEditorCitations } from './composables/useEditorCitations'
import { useEditorCommands } from './composables/useEditorCommands'

import EditorPagedPreview from './EditorPagedPreview.vue'
import EditorReferencesPanel from './EditorReferencesPanel.vue'
import EditorToolbarPrimary from './EditorToolbarPrimary.vue'
import EditorToolbarSecondary from './EditorToolbarSecondary.vue'
import EditorInfoBar from './EditorInfoBar.vue'

// Instancia TipTap compartida
const editor = ref<Editor | null>(null)

// F2 / F2.2: estadísticas del documento
const { stats, updateStats } = useEditorStats(() => editor.value)

// F2.2 / F2.3.R: vista paginada 1:1
const {
  isPagedPreview,
  pages,
  pageMeasure,
  recomputePages,
} = usePagedPreview({
  getHtml: () => (editor.value ? editor.value.getHTML() : ''),
})

// F2.3: citas y bibliografía
const {
  citationManager,
  currentCitationStyle,
  citationStyles,
  insertCitation,
  insertCitationFor,
  insertBibliographyBlock,
  forceRerenderCitationsAndBibliography,
} = useEditorCitations(() => editor.value)

// F2: comandos de la toolbar (acciones sobre el editor)
const {
  insertKatex,
  insertMermaid,
  insertCodeBlock,
  insertTable,
  insertImage,
  insertGantt,
  insertCad,
  insertDicom,
  insertGeoSpatial,
  insertSlides,
} = useEditorCommands(() => editor.value)

// F2: instancia del editor TipTap vía composable
useDisertareEditor({
  editor,
  citationManager,
  getCitationStyle: () => currentCitationStyle.value,
  onUpdate: () => {
    updateStats()
    if (isPagedPreview.value) {
      recomputePages()
    }
  },
  onSelectionUpdate: () => {
    updateStats()
  },
})

const showReferencesPanel = ref(false)

// --------------------- acciones de UI -----------------------------

const togglePagedPreview = (): void => {
  isPagedPreview.value = !isPagedPreview.value
  // Recalcular páginas al cambiar de modo
  recomputePages()
}

const toggleReferencesPanel = (): void => {
  showReferencesPanel.value = !showReferencesPanel.value
}

const onReferencesChanged = (): void => {
  forceRerenderCitationsAndBibliography()
}

// La toolbar de "Cita" necesita abrir el panel si no hay refs
const handleInsertCitationFromToolbar = (): void => {
  const instance = editor.value
  if (!instance) return

  const currentRefs = citationManager.listReferences()
  if (currentRefs.length === 0) {
    showReferencesPanel.value = true
    return
  }

  insertCitation()
}
</script>

<style scoped>
/* Layout general y reglas */
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

/* Paneles del editor (continua) */
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

/* Citas y bibliografía */
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
</style>
