<!-- apps/frontend/src/editor/Editor.vue -->
<template>
  <div class="disertare-editor-shell">
    <!-- Toolbar secundaria -->
    <EditorToolbarSecondary
      @toggle-references="toggleReferencesPanel"
      @toggle-paged-preview="togglePagedPreview"
      @toggle-ocr-panel="toggleOcrPanel"
      @toggle-page-sections-panel="togglePageSectionsPanel"
      @toggle-stats-panel="toggleStatsPanel"
      @toggle-stats-adv-panel="toggleStatsAdvPanel"
      @toggle-diagrams-panel="toggleDiagramsPanel"
      @toggle-slides-panel="toggleSlidesPanel"
      @toggle-bio-panel="toggleBioPanel"
      @toggle-circuits-panel="toggleCircuitsPanel"
      @toggle-pneumatics-panel="togglePneumaticsPanel"
      @toggle-screenshot-panel="toggleScreenshotPanel"
      @toggle-parts-panel="togglePartsPanel"
      @toggle-toc-panel="toggleTocPanel"
      @toggle-svg-panel="toggleSvgPanel"
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
      @insert-svg="commands.insertSvg"
      @upload-svg="commands.insertSvgFromFile"
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
  | 'stats-adv'
  | 'diagramsAdv'
  | 'slides'
  | 'bio'
  | 'circuits'
  | 'pneumatics'
  | 'screenshot'
  | 'parts'
  | 'toc'
  | 'svg'

const activePanel = ref<ActivePanel>('none')

/* Helper genérico para toggles de panel */
function togglePanel(panel: ActivePanel) {
  activePanel.value = activePanel.value === panel ? 'none' : panel
}

/* Toggles toolbar secundaria */
const toggleReferencesPanel = () => togglePanel('references')
const toggleOcrPanel = () => togglePanel('ocr')
const togglePageSectionsPanel = () => togglePanel('pageSections')
const toggleStatsPanel = () => togglePanel('stats')
const toggleStatsAdvPanel = () => togglePanel('stats-adv')
const toggleDiagramsPanel = () => togglePanel('diagramsAdv')
const toggleSlidesPanel = () => togglePanel('slides')
const toggleBioPanel = () => togglePanel('bio')
const toggleCircuitsPanel = () => togglePanel('circuits')
const togglePneumaticsPanel = () => togglePanel('pneumatics')
const toggleScreenshotPanel = () => togglePanel('screenshot')
const togglePartsPanel = () => togglePanel('parts')
const toggleTocPanel = () => togglePanel('toc')
const toggleSvgPanel = () => togglePanel('svg')

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
