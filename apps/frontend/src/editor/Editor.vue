<template>
  <div class="disertare-editor-shell">
    <!-- Toolbar secundaria -->
    <EditorToolbarSecondary
      @toggle-references="toggleReferencesPanel"
      @toggle-paged-preview="togglePagedPreview"
      @toggle-ocr-panel="toggleOcrPanel"
      @toggle-page-sections-panel="togglePageSectionsPanel"
      @toggle-stats-panel="toggleStatsPanel"
      @toggle-diagrams-panel="toggleDiagramsPanel"
      @toggle-slides-panel="toggleSlidesPanel"
      @toggle-bio-panel="toggleBioPanel"
      @toggle-circuits-panel="toggleCircuitsPanel"
      @toggle-pneumatics-panel="togglePneumaticsPanel"
      @toggle-screenshot-panel="toggleScreenshotPanel"
      @toggle-parts-panel="togglePartsPanel"
      @toggle-toc-panel="toggleTocPanel"
      @new-screenshot="handleNewScreenshot"
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

      <!-- Sidebar derecho -->
      <EditorSidebar
        :active-panel="activePanel"
        :editor="editor"
        :citation-manager="citationManager"
        :current-citation-style="currentCitationStyle"
        :citation-styles="citationStyles"
        :is-capturing-screenshot="isCapturing"
        :last-screenshot-data-url="lastScreenshotDataUrl"
        :on-new-screenshot="handleNewScreenshot"
        :on-send-screenshot-to-slide="handleSendScreenshotToSlide"
        @close="closeSidebar"
        @references-changed="onReferencesChanged"
        @update:current-citationStyle="changeCitationStyle"
        @insert-citation-from-panel="insertCitationFromPanel"
      />
    </div>

        <!-- Toolbar primaria -->
    <EditorToolbarPrimary
      @insert-katex="commands.insertKatex"
      @insert-mermaid="commands.insertMermaid"
      @insert-code-block="commands.insertCodeBlock"
      @insert-image="commands.insertImage"
      @upload-image="commands.insertImageFromLocal"
      @insert-image-adv="commands.insertAdvancedImage"
      @upload-image-adv="commands.insertAdvancedImageFromLocal"
      @insert-table="commands.insertTable"
      @insert-gantt="commands.insertGantt"
      @insert-cad="commands.insertCad"
      @insert-dicom="commands.insertDicom"
      @insert-geospatial="commands.insertGeo"
      @insert-chem="commands.insertChem"
      @insert-bio-sequence="commands.insertBioSequence"
      @insert-circuit="commands.insertCircuit"
      @insert-pneumatics="commands.insertPneumaticBlock"
      @insert-slides="commands.insertSlides"
      @insert-citation="insertCitationFromToolbar"
      @insert-bibliography="insertBibliographyFromToolbar"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Editor } from '@tiptap/core'
import { EditorContent } from '@tiptap/vue-3'
import type { CitationStyleId } from '@disertare/editor-citations'

import EditorToolbarSecondary from './EditorToolbarSecondary.vue'
import EditorToolbarPrimary from './EditorToolbarPrimary.vue'
import EditorSidebar from './EditorSidebar.vue'
import EditorInfoBar from './EditorInfoBar.vue'
import EditorPagedPreview from './EditorPagedPreview.vue'

import { useDisertareEditor } from './composables/useDisertareEditor'
import { useEditorCommands } from './composables/useEditorCommands'
import { useEditorStats } from './composables/useEditorStats'
import { usePagedPreview } from './composables/usePagedPreview'
import { useEditorCitations } from './composables/useEditorCitations'
import { useEditorScreenshot } from './composables/useEditorScreenshot' // F2.13

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

/* Captura de pantalla (F2.13) */
const {
  captureAndInsertScreenshot,
  isCapturing,
  lastScreenshotDataUrl,
} = useEditorScreenshot(editor)

/* Panel lateral activo */
type ActivePanel =
  | 'none'
  | 'references'
  | 'ocr'
  | 'pageSections'
  | 'stats'
  | 'diagramsAdv'
  | 'slides'
  | 'bio'
  | 'circuits'
  | 'pneumatics'
  | 'screenshot'
  | 'parts'
  | 'toc'

const activePanel = ref<ActivePanel>('none')

/* Toggles toolbar secundaria */
function toggleReferencesPanel() {
  activePanel.value =
    activePanel.value === 'references' ? 'none' : 'references'
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

function toggleDiagramsPanel() {
  activePanel.value =
    activePanel.value === 'diagramsAdv' ? 'none' : 'diagramsAdv'
}

function toggleSlidesPanel() {
  activePanel.value = activePanel.value === 'slides' ? 'none' : 'slides'
}

function toggleBioPanel() {
  activePanel.value = activePanel.value === 'bio' ? 'none' : 'bio'
}

function toggleCircuitsPanel() {
  activePanel.value =
    activePanel.value === 'circuits' ? 'none' : 'circuits'
}

function togglePneumaticsPanel() {
  activePanel.value =
    activePanel.value === 'pneumatics' ? 'none' : 'pneumatics'
}

function toggleScreenshotPanel() {
  activePanel.value =
    activePanel.value === 'screenshot' ? 'none' : 'screenshot'
}

function togglePartsPanel() {
  activePanel.value = activePanel.value === 'parts' ? 'none' : 'parts'
}

function toggleTocPanel() {
  activePanel.value = activePanel.value === 'toc' ? 'none' : 'toc'
}

function togglePagedPreview() {
  isPagedPreview.value = !isPagedPreview.value
  if (isPagedPreview.value) {
    recomputePages()
  }
}

function closeSidebar() {
  activePanel.value = 'none'
}

/* Capturas desde toolbar secundaria / panel */
function handleNewScreenshot() {
  captureAndInsertScreenshot()
}

function handleSendScreenshotToSlide() {
  // Implementación existente de F2.13 (ya la tienes en useEditorScreenshot)
}

/* Atajo de teclado F2.13: Ctrl+Shift+S / Cmd+Shift+S */
function onGlobalKeydown(e: KeyboardEvent) {
  const isCtrlOrCmd = e.ctrlKey || e.metaKey
  if (isCtrlOrCmd && e.shiftKey && e.code === 'KeyS') {
    e.preventDefault()
    handleNewScreenshot()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})

/* Citas desde toolbar/panel */
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

function onReferencesChanged() {
  forceRerenderCitationsAndBibliography()
}

function changeCitationStyle(style: CitationStyleId) {
  currentCitationStyle.value = style
}

/* Inicializar editor */
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
