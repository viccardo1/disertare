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
      @toggle-diagrams-panel="toggleDiagramsPanel"
      @toggle-slides-panel="toggleSlidesPanel"
      @toggle-bio-panel="toggleBioPanel"
      @toggle-circuits-panel="toggleCircuitsPanel"
      @toggle-pneumatics-panel="togglePneumaticsPanel"
      @toggle-screenshot-panel="toggleScreenshotPanel"
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

const activePanel = ref<ActivePanel>('none')

/* Toggles toolbar secundaria */
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

function toggleDiagramsPanel() {
  activePanel.value =
    activePanel.value === 'diagramsAdv' ? 'none' : 'diagramsAdv'
}

function toggleSlidesPanel() {
  activePanel.value =
    activePanel.value === 'slides' ? 'none' : 'slides'
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

function closeSidebar() {
  activePanel.value = 'none'
}

/* Acción F2.13: Nueva captura (toolbar, panel, atajo) */
async function handleNewScreenshot() {
  if (isCapturing.value) return
  await captureAndInsertScreenshot()
}

/**
 * F2.13 + F2.12:
 * Envía la última captura al Canvas de Presentaciones.
 *
 * - Si ya existe un nodo <slides>, agrega una diapositiva layout "title-image".
 * - Si no existe, crea un deck nuevo con esa única diapositiva.
 */
function handleSendScreenshotToSlide() {
  const ed = editor.value
  if (!ed) return

  const dataUrl = lastScreenshotDataUrl.value
  if (!dataUrl) {
    // eslint-disable-next-line no-alert
    alert('No hay ninguna captura reciente para enviar al Canvas.')
    return
  }

  const { state } = ed
  let slidesPos: number | null = null
  let slidesNode: any = null

  state.doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'slides') {
      slidesPos = pos
      slidesNode = node
      return false
    }
    return true
  })

  // Si no hay deck, creamos uno desde cero con una sola diapositiva de captura
  if (slidesPos === null || !slidesNode) {
    ed
      .chain()
      .focus()
      .insertContent({
        type: 'slides',
        attrs: {
          title: 'Presentación sin título',
          theme: 'default',
          content: 'Captura de pantalla',
          slides: JSON.stringify([
            {
              title: 'Captura de pantalla',
              body: '',
              layout: 'title-image',
              imageUrl: dataUrl,
            },
          ]),
        },
      })
      .run()
    // opcional: abrir automáticamente el panel de presentaciones
    activePanel.value = 'slides'
    return
  }

  // Hay deck existente: añadimos la diapositiva de captura
  let slidesArr: any[] = []
  const existingSlides = slidesNode.attrs.slides as string | null | undefined

  if (existingSlides) {
    try {
      const parsed = JSON.parse(existingSlides)
      if (Array.isArray(parsed)) {
        slidesArr = parsed
      }
    } catch {
      slidesArr = []
    }
  }

  if (!Array.isArray(slidesArr)) {
    slidesArr = []
  }

  slidesArr.push({
    title: 'Captura de pantalla',
    body: '',
    layout: 'title-image',
    imageUrl: dataUrl,
  })

  const legacyContent =
    slidesArr.length === 0
      ? ''
      : slidesArr
          .map((s: any, index: number) => {
            const title =
              (s.title || `Diapositiva ${index + 1}`).trim()
            const body = (s.body || '').trim()
            if (!body) return title
            return `${title}\n${body}`
          })
          .join('\n---\n')

  const newAttrs = {
    ...slidesNode.attrs,
    slides: JSON.stringify(slidesArr),
    content: legacyContent,
  }

  ed
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.setNodeMarkup(
        slidesPos as number,
        slidesNode.type,
        newAttrs,
      )
      return true
    })
    .run()

  // Opcional: cambiar al panel de Slides para que el usuario vea el resultado
  activePanel.value = 'slides'
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
