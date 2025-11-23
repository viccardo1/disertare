<!-- apps/frontend/src/editor/Editor.vue -->
<template>
  <div class="editor-container">
    <div class="editor-main">
      <div class="editor-body">
        <!-- Zona principal: reglas + contenido + toolbars -->
        <div class="editor-workspace">
          <div class="editor-rulers-row">
            <!-- Regla vertical pegada al área editable -->
            <div class="ruler-vertical" aria-hidden="true"></div>

            <!-- Tarjeta principal del editor -->
            <div class="editor-content">
              <!-- Barra secundaria (toggles) SIEMPRE arriba del área editable -->
              <EditorToolbarSecondary
                :is-paged-preview="isPagedPreview"
                @toggle-references="toggleReferencesPanel"
                @toggle-paged-preview="togglePagedPreview"
                @toggle-ocr-panel="toggleOcrPanel"
                @toggle-page-sections-panel="togglePageSectionsPanel"
                @toggle-stats-panel="toggleStatsPanel"
              />

              <!-- Regla horizontal inmediatamente sobre la página -->
              <div class="ruler-horizontal" aria-hidden="true"></div>

              <!-- Contenedor oculto para medir altura de contenido (F2.2 / F2.3.R / F2.5) -->
              <div ref="pageMeasure" class="page-measure" aria-hidden="true"></div>

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

              <!-- Barra primaria (inserción de nodos) - barra inferior F2 -->
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

              <!-- Barra de información: contador de palabras, etc. -->
              <EditorInfoBar :stats="stats" />
            </div>
          </div>
        </div>

        <!-- Panel unificado de herramientas (F2.6) -->
        <EditorSidebar
          :active-panel="activeSidebarPanel"
          :editor="editor"
          :citation-manager="citationManager"
          :current-citation-style="currentCitationStyle"
          :citation-styles="citationStyles"
          @close="closeSidebarPanel"
          @references-changed="handleReferencesChanged"
          @insert-citation-from-panel="handleInsertCitationFromPanel"
          @update:currentCitationStyle="handleUpdateCitationStyle"
        />
      </div>
    </div>
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
import EditorToolbarPrimary from './EditorToolbarPrimary.vue'
import EditorToolbarSecondary from './EditorToolbarSecondary.vue'
import EditorInfoBar from './EditorInfoBar.vue'
import EditorSidebar from './EditorSidebar.vue'

type SidebarPanel = 'none' | 'references' | 'ocr' | 'pageSections' | 'stats'

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

// ---------------------- inicializar editor core ------------------------

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

const activeSidebarPanel = ref<SidebarPanel>('none')

// --------------------------- acciones de UI -----------------------------

const setActiveSidebarPanel = (panel: SidebarPanel): void => {
  activeSidebarPanel.value =
    activeSidebarPanel.value === panel ? 'none' : panel
}

const closeSidebarPanel = (): void => {
  activeSidebarPanel.value = 'none'
}

const togglePagedPreview = (): void => {
  isPagedPreview.value = !isPagedPreview.value
  recomputePages()
}

const toggleReferencesPanel = (): void => {
  setActiveSidebarPanel('references')
}

const toggleOcrPanel = (): void => {
  setActiveSidebarPanel('ocr')
}

const togglePageSectionsPanel = (): void => {
  setActiveSidebarPanel('pageSections')
}

const toggleStatsPanel = (): void => {
  setActiveSidebarPanel('stats')
}

// Cambio de estilo de cita desde el panel unificado
const handleUpdateCitationStyle = (value: string): void => {
  currentCitationStyle.value = value
}

// Se invoca cuando el gestor de citas notifica cambios
const handleReferencesChanged = (): void => {
  forceRerenderCitationsAndBibliography()
}

// Inserta una cita elegida desde el panel y lo cierra
const handleInsertCitationFromPanel = (refId: string): void => {
  insertCitationFor(refId)
  closeSidebarPanel()
}

// La toolbar de "Cita" necesita abrir el panel si no hay refs
const handleInsertCitationFromToolbar = (): void => {
  if (citationManager.listReferences().length === 0) {
    setActiveSidebarPanel('references')
    return
  }

  insertCitation()
}
</script>

<style scoped>
:global(html, body, #app) {
  height: 100%;
}

:global(body) {
  margin: 0;
}

/* Aumentamos padding inferior para que nada quede oculto por el footer fijo */
.editor-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 16px 24px 96px;
  box-sizing: border-box;
  background: #f3f2ff;
}

.editor-main {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

/* Contiene contenido principal + panel unificado F2.6 */
.editor-body {
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
}

/* Columna izquierda: reglas + tarjeta del editor */
.editor-workspace {
  flex: 1 1 auto;
  min-width: 0;
}

/* Fila: regla vertical + tarjeta */
.editor-rulers-row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 8px;
}

/* Reglas (F2.2) */
.ruler-vertical {
  width: 24px;
  border-right: 1px solid #d0c4ff;
  background-image: linear-gradient(to bottom, #e0d5ff 1px, transparent 1px);
  background-size: 100% 8px;
  opacity: 0.5;
  flex-shrink: 0;
}

.ruler-horizontal {
  height: 24px;
  border-bottom: 1px solid #d0c4ff;
  margin-top: 8px;
  margin-bottom: 8px;
  background-image: linear-gradient(to right, #e0d5ff 1px, transparent 1px);
  background-size: 8px 100%;
  opacity: 0.5;
}

/* Tarjeta principal del editor */
.editor-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.08),
    0 0 0 1px rgba(148, 163, 184, 0.1);
  padding: 8px 8px 12px;
  box-sizing: border-box;
  min-height: 0;
}

/* Div oculto que se utiliza para medir el contenido HTML paginado */
.page-measure {
  position: absolute;
  left: -9999px;
  top: 0;
  width: 793.7px; /* ancho A4 a 96dpi aprox */
  padding: 96px 96px 96px 96px;
  box-sizing: border-box;
}

/* Zona principal de edición (paginada o continua) */
.editor-pane-wrapper {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-bottom: 12px;
}

.editor-pane {
  flex: 1 1 auto;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
  overflow-y: auto;
}

.editor-pane--continuous {
  padding: 16px 24px;
}

/* Contenido TipTap */
.ProseMirror {
  outline: none;
  min-height: 400px;
}

/* Estilos básicos para bibliografía (F2.3) */
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
