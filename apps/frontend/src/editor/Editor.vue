<!-- apps/frontend/src/editor/Editor.vue -->
<template>
  <div class="disertare-editor-shell">
    <!-- Toolbar secundaria (superior: referencias, paginación, OCR, etc.) -->
    <EditorToolbarSecondary
      @toggle-references="toggleReferencesPanel"
      @toggle-paged-preview="togglePagedPreview"
      @toggle-ocr-panel="toggleOcrPanel"
      @toggle-page-sections-panel="togglePageSectionsPanel"
      @toggle-stats-panel="toggleStatsPanel"
      @toggle-bio-panel="toggleBioPanel"
      @toggle-circuits-panel="toggleCircuitsPanel"
    />

    <!-- Barra superior de estadísticas rápidas -->
    <EditorInfoBar :stats="stats" />

    <div class="disertare-editor-main">
      <div class="disertare-editor-content">
        <!-- Vista paginada F2.x -->
        <EditorPagedPreview
          v-if="isPagedPreview"
          :pages="pages"
        />

        <!-- Editor TipTap -->
        <EditorContent
          v-else
          :editor="editor"
        />
      </div>

      <!-- Sidebar derecho (citas, OCR, secciones de página, estadística, Bio...) -->
      <EditorSidebar
        :active-panel="activePanel"
        :editor="editor"
        :citation-manager="citationManager"
        :current-citation-style="currentCitationStyle"
        :citation-styles="citationStyles"
        @close="closeSidebar"
        @references-changed="onReferencesChanged"
        @update:current-citationStyle="changeCitationStyle"
        @insert-citation-from-panel="insertCitationFromPanel"
      />
    </div>

    <!-- Toolbar primaria (Fx, M, Img, Tabla, Química, Bio, Slides...) -->
    <EditorToolbarPrimary
      @insert-katex="commands.insertKatex"
      @insert-mermaid="commands.insertMermaid"
      @insert-code-block="commands.insertCodeBlock"
      @insert-image="commands.insertImage"
      @insert-table="commands.insertTable"
      @insert-gantt="commands.insertGantt"
      @insert-cad="commands.insertCad"
      @insert-dicom="commands.insertDicom"
      @insert-geospatial="commands.insertGeo"
      @insert-chem="commands.insertChem"
      @insert-bio-sequence="commands.insertBioSequence"
      @insert-circuit="commands.insertCircuit"
      @insert-slides="commands.insertSlides"
      @insert-citation="insertCitationFromToolbar"
      @insert-bibliography="insertBibliographyFromToolbar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Editor } from '@tiptap/core'
import { EditorContent } from '@tiptap/vue-3'
import type { CitationStyleId } from '@disertare/editor-citations'

/* Componentes */
import EditorToolbarSecondary from './EditorToolbarSecondary.vue'
import EditorToolbarPrimary from './EditorToolbarPrimary.vue'
import EditorSidebar from './EditorSidebar.vue'
import EditorInfoBar from './EditorInfoBar.vue'
import EditorPagedPreview from './EditorPagedPreview.vue'

/* Composables */
import { useDisertareEditor } from './composables/useDisertareEditor'
import { useEditorCommands } from './composables/useEditorCommands'
import { useEditorStats } from './composables/useEditorStats'
import { usePagedPreview } from './composables/usePagedPreview'
import { useEditorCitations } from './composables/useEditorCitations'

/* Instancia del editor */
const editor = ref<Editor | null>(null)

/* Citas / Bibliografía */
const {
  citationManager,
  currentCitationStyle,
  citationStyles,
  insertCitation,
  insertCitationFor,
  insertBibliographyBlock,
  forceRerenderCitationsAndBibliography,
} = useEditorCitations(() => editor.value)

/* Estadísticas */
const { stats, updateStats } = useEditorStats(() => editor.value)

/* Vista paginada */
const {
  isPagedPreview,
  pages,
  recomputePages,
} = usePagedPreview({
  getHtml: () => editor.value?.getHTML() ?? '',
})

/* Toolbar primaria */
const commands = useEditorCommands(editor)

/* Panel lateral activo */
type ActivePanel =
  | 'none'
  | 'references'
  | 'ocr'
  | 'pageSections'
  | 'stats'
  | 'bio'
  | 'circuits'

const activePanel = ref<ActivePanel>('none')

/* --------------------------------------------
 * Toggle handlers (toolbar secundaria)
 * -------------------------------------------- */
function toggleReferencesPanel() {
  activePanel.value =
    activePanel.value === 'references' ? 'none' : 'references'
}

function togglePagedPreview() {
  isPagedPreview.value = !isPagedPreview.value

  if (isPagedPreview.value) {
    recomputePages()
  }
}

function toggleOcrPanel() {
  activePanel.value = activePanel.value === 'ocr' ? 'none' : 'ocr'
}

function togglePageSectionsPanel() {
  activePanel.value =
    activePanel.value === 'pageSections' ? 'none' : 'pageSections'
}

function toggleStatsPanel() {
  activePanel.value = activePanel.value === 'stats' ? 'none' : 'stats'
}

function toggleBioPanel() {
  activePanel.value = activePanel.value === 'bio' ? 'none' : 'bio'
}

function toggleCircuitsPanel() {
  activePanel.value = activePanel.value === 'circuits' ? 'none' : 'circuits'
}

function closeSidebar() {
  activePanel.value = 'none'
}

/* --------------------------------------------
 * Citas desde panel y toolbar
 * -------------------------------------------- */
function insertCitationFromToolbar() {
  const refs = citationManager.listReferences()

  if (!refs.length) {
    activePanel.value = 'references'
    return
  }
  insertCitation()
}

function insertBibliographyFromToolbar() {
  insertBibliographyBlock()
}

/**
 * Recibe el payload completo del panel:
 *  - refId
 *  - locator (páginas)
 *  - prefix / suffix
 */
function insertCitationFromPanel(payload: {
  refId: string
  locator?: string
  prefix?: string
  suffix?: string
}) {
  insertCitationFor(
    payload.refId,
    payload.locator,
    payload.prefix,
    payload.suffix,
  )
}

/* Manejo de cambios en el panel de referencias */
function onReferencesChanged() {
  forceRerenderCitationsAndBibliography()
}

/* Cambio de estilo de citas */
function changeCitationStyle(style: CitationStyleId) {
  currentCitationStyle.value = style
}

/* --------------------------------------------
 * Inicializar editor
 * -------------------------------------------- */
useDisertareEditor({
  editor,
  citationManager,
  getCitationStyle: () => currentCitationStyle.value ?? 'apa',
  onUpdate: () => {
    updateStats()
    if (isPagedPreview.value) {
      recomputePages()
    }
  },
  onSelectionUpdate: () => {
    // reservado para futuras características contextuales
  },
})
</script>

<style scoped>
.disertare-editor-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.disertare-editor-main {
  display: flex;
  flex: 1;
  min-height: 0;
}

.disertare-editor-content {
  flex: 1;
  padding: 0.75rem;
  overflow: auto;
}
</style>
