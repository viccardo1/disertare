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
      @toggle-analytics-panel="toggleAnalyticsPanel"
      @toggle-containers-panel="toggleContainersPanel"
      @new-screenshot="handleNewScreenshot"
    />

    <!-- Barra superior de estadísticas rápidas -->
    <EditorInfoBar :stats="stats" />

    <div class="disertare-editor-main">
      <!-- Zona central: editor / vista paginada.
           Aquí aplicamos el estilo de columnas SOLO cuando NO está
           activa la vista paginada. -->
      <div
        class="disertare-editor-content"
        :style="layoutColumnsStyle"
      >
        <!-- Vista paginada (sin columnas aún, F2.19.R3) -->
        <EditorPagedPreview
          v-if="isPagedPreview"
          :pages="pages"
        />

        <!-- Editor TipTap en flujo continuo -->
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
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
import { useEditorScreenshot } from './composables/useEditorScreenshot'

const editor = ref<Editor | null>(null)

/* Citas */
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

/* Screenshot */
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
  | 'analytics'
  | 'containers'

const activePanel = ref<ActivePanel>('none')

/* Helper de toggles */
function togglePanel(panel: ActivePanel) {
  activePanel.value = activePanel.value === panel ? 'none' : panel
}

/* Toggles de paneles */
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
const toggleAnalyticsPanel = () => togglePanel('analytics')
const toggleContainersPanel = () => togglePanel('containers')

function togglePagedPreview() {
  isPagedPreview.value = !isPagedPreview.value
  if (isPagedPreview.value) {
    recomputePages()
  }
}

function closeSidebar() {
  activePanel.value = 'none'
}

/* Screenshot */
function handleNewScreenshot() {
  captureAndInsertScreenshot()
}

function handleSendScreenshotToSlide() {
  // Hook reservado para F2.13/F3.x
}

/* Atajo global para captura */
function onGlobalKeydown(e: KeyboardEvent) {
  const isCtrlOrCmd = e.ctrlKey || e.metaKey
  if (isCtrlOrCmd && e.shiftKey && e.code === 'KeyS') {
    e.preventDefault()
    handleNewScreenshot()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown))

/* Citas – integración toolbar / panel */
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

/**
 * F2.19.R2 — estilo de columnas para la vista de edición continua.
 *
 * Lee el atributo `layout.columns` del nodo `pageSection` activo:
 *   { count: number, gutter: number }
 *
 * y lo traduce a `column-count` / `column-gap` sobre el contenedor
 * `.disertare-editor-content`.
 *
 * NOTA: si está activa la vista paginada, no aplicamos columnas
 * aquí para no interferir con el paginador (eso será F2.19.R3).
 */
const layoutColumnsStyle = computed<Record<string, string>>(() => {
  // Si el usuario está en vista paginada, no aplicamos columnas aquí.
  if (isPagedPreview.value) {
    return {}
  }

  const inst = editor.value
  if (!inst) return {}

  try {
    const attrs = inst.getAttributes('pageSection') as {
      layout?: {
        columns?: {
          count?: number
          gutter?: number | null
        } | null
      }
    }

    const columns = attrs?.layout?.columns
    const count = columns?.count ?? 0

    if (!Number.isFinite(count) || count < 2) {
      // 1 columna o valor inválido → editor normal, sin columnas
      return {}
    }

    const gap = columns?.gutter ?? 24

    return {
      columnCount: String(count),
      columnGap: `${gap}px`,
    }
  } catch {
    // Si por cualquier razón getAttributes falla, no rompemos el editor.
    return {}
  }
})

/* Inicializar editor TipTap + extensiones Disertare */
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
    // En F2.x no necesitamos lógica adicional aquí
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

  /* Fallback suave para columnas:
     - Dejamos que el navegador rompa líneas de forma razonable.
     - Mantiene buen comportamiento aunque se activen las columnas. */
  word-wrap: break-word;
}
</style>
