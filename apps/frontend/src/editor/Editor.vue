<!-- apps/frontend/src/editor/Editor.vue -->
<template>
  <div class="editor-container">
    <div class="ruler-horizontal" aria-hidden="true"></div>

    <div class="editor-main">
      <div class="ruler-vertical" aria-hidden="true"></div>

      <div class="editor-content">
        <!-- Contenedor oculto para medir altura de contenido (F2.2 / F2.3.R / F2.5) -->
        <div ref="pageMeasure" class="page-measure" aria-hidden="true"></div>

        <!-- Panel de referencias (F2.3) -->
        <EditorReferencesPanel
          v-if="showReferencesPanel"
          :citation-manager="citationManager"
          v-model:currentCitationStyle="currentCitationStyle"
          :citation-styles="citationStyles"
          @close="toggleReferencesPanel"
          @references-changed="handleReferencesChanged"
          @insert-citation="handleInsertCitationFromPanel"
        />

        <!-- Panel de configuración de encabezados / pies (F2.5) -->
        <EditorPageSectionsPanel v-if="showPageSectionsPanel" />

        <!-- Panel de OCR (F2.4) -->
        <EditorOcrPanel
          v-if="showOcrPanel"
          :editor="editor"
        />

        <!-- Zona principal de edición -->
        <div class="editor-pane-wrapper">
          <EditorPagedPreview
            v-if="isPagedPreview"
            :pages="pages"
          />
          <div
            v-else
            class="editor-pane editor-pane--continuous"
          >
            <EditorContent
              v-if="editor"
              :editor="editor"
            />
          </div>
        </div>

        <!-- Toolbars -->
        <EditorToolbarPrimary
          @insert-katex="insertKatex"
          @insert-mermaid="insertMermaid"
          @insert-code-block="insertCodeBlock"
          @insert-table="insertTable"
          @insert-image="insertImage"
          @insert-gantt="insertGantt"
          @insert-cad="insertCad"
          @insert-dicom="insertDicom"
          @insert-geospatial="insertGeoSpatial"
          @insert-slides="insertSlides"
          @insert-citation="handleInsertCitationFromToolbar"
          @insert-bibliography="insertBibliographyBlock"
        />

        <EditorToolbarSecondary
          :is-paged-preview="isPagedPreview"
          @toggle-references="toggleReferencesPanel"
          @toggle-paged-preview="togglePagedPreview"
          @toggle-ocr-panel="toggleOcrPanel"
          @toggle-page-sections-panel="togglePageSectionsPanel"
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
import EditorOcrPanel from './EditorOcrPanel.vue'
import EditorPageSectionsPanel from './EditorPageSectionsPanel.vue'
import EditorToolbarPrimary from './EditorToolbarPrimary.vue'
import EditorToolbarSecondary from './EditorToolbarSecondary.vue'
import EditorInfoBar from './EditorInfoBar.vue'

const editor = ref<Editor | null>(null)

// --------------------- citas y bibliografía -----------------------------

const {
  citationManager,
  currentCitationStyle,
  citationStyles,
  insertCitation,
  insertCitationFor,
  insertBibliographyBlock,
  forceRerenderCitationsAndBibliography,
} = useEditorCitations(() => editor.value)

// --------------------------- estadísticas -------------------------------

const { stats, updateStats } = useEditorStats(() => editor.value)

// ------------------------ vista paginada F2.2 ---------------------------

const { isPagedPreview, pages, pageMeasure, recomputePages } = usePagedPreview({
  getHtml: () => (editor.value ? editor.value.getHTML() : ''),
})

// -------------------------- comandos toolbar ----------------------------

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

// --------------------------- inicializar editor -------------------------

useDisertareEditor({
  editor,
  citationManager,
  getCitationStyle: () => currentCitationStyle.value,
  onUpdate: () => {
    updateStats()
    recomputePages()
  },
  onSelectionUpdate: () => {
    updateStats()
  },
})

// --------------------------- estado de paneles --------------------------

const showReferencesPanel = ref(false)
const showOcrPanel = ref(false)
const showPageSectionsPanel = ref(false)

// --------------------------- acciones de UI -----------------------------

const togglePagedPreview = (): void => {
  isPagedPreview.value = !isPagedPreview.value
  recomputePages()
}

const toggleReferencesPanel = (): void => {
  showReferencesPanel.value = !showReferencesPanel.value
}

const toggleOcrPanel = (): void => {
  showOcrPanel.value = !showOcrPanel.value
}

const togglePageSectionsPanel = (): void => {
  showPageSectionsPanel.value = !showPageSectionsPanel.value
}

const handleReferencesChanged = (): void => {
  forceRerenderCitationsAndBibliography()
}

const handleInsertCitationFromPanel = (refId: string): void => {
  insertCitationFor(refId)
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
.editor-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 16px 24px;
  box-sizing: border-box;
  background: #f3f2ff;
}

/* Reglas (F2.2) */
.ruler-horizontal {
  height: 24px;
  margin-left: 40px;
  margin-bottom: 8px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    #e0d6ff 0,
    #e0d6ff 1px,
    transparent 1px,
    transparent 16px
  );
  background-size: 16px 100%;
  opacity: 0.7;
}

.ruler-vertical {
  width: 24px;
  margin-right: 8px;
  border-radius: 4px;
  background: linear-gradient(
    to bottom,
    #e0d6ff 0,
    #e0d6ff 1px,
    transparent 1px,
    transparent 16px
  );
  background-size: 100% 16px;
  opacity: 0.7;
}

.editor-main {
  display: flex;
  flex: 1;
}

/* Zona central: paneles + editor */
.editor-content {
  flex: 1;
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 8px 16px;
  box-sizing: border-box;
}

/* Div oculto que se utiliza para medir el contenido HTML paginado */
.page-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
  max-width: var(--disertare-page-width, 794px);
}

/* Contenedor de la página o preview */
.editor-pane-wrapper {
  margin-bottom: 12px;
}

/* Vista continua (no paginada) */
.editor-pane {
  max-width: var(--disertare-page-width, 794px);
  margin: 0 auto;
  padding: var(--disertare-page-padding, 32px 40px);
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e0d6ff;
  box-shadow:
    0 10px 20px rgba(15, 23, 42, 0.06),
    0 2px 6px rgba(15, 23, 42, 0.04);
}

/* ---- Estilos base del contenido ProseMirror ---- */

.ProseMirror {
  outline: none;
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
  line-height: 1.2;
}

/* Listas */
.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5em;
  margin: 0 0 0.75em;
}

/* Tablas básicas (la extensión de tablas añade más estilos) */
.ProseMirror table {
  border-collapse: collapse;
  margin: 12px 0;
  width: 100%;
}

.ProseMirror th,
.ProseMirror td {
  border: 1px solid #d4d4f4;
  padding: 4px 6px;
  font-size: 13px;
}

/* Citas en bloque */
.ProseMirror blockquote {
  border-left: 3px solid #c4b5fd;
  margin: 0 0 0.75em;
  padding: 4px 10px;
  color: #4b5563;
  background: #f5f3ff;
  border-radius: 0 4px 4px 0;
}

/* Código en línea */
.ProseMirror code {
  font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  background: #f3f4ff;
  padding: 1px 4px;
  border-radius: 4px;
}

/* Bloques de código */
.ProseMirror pre {
  font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  padding: 8px 10px;
  background: #111827;
  color: #e5e7eb;
  border-radius: 6px;
  overflow-x: auto;
}

/* Citas y bibliografía (nodos especiales) */
.dsr-citation-inline {
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(106, 90, 249, 0.06);
  border: 1px dashed rgba(106, 90, 249, 0.5);
  color: #4c1d95;
  font-size: 12px;
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
