<!-- apps/frontend/src/editor/EditorSidebar.vue -->
<template>
  <aside
    v-if="activePanel !== 'none'"
    class="editor-sidebar"
    aria-label="Panel de herramientas"
  >
    <header class="editor-sidebar__header">
      <h2 class="editor-sidebar__title">
        {{ currentTitle }}
      </h2>

      <button
        type="button"
        class="editor-sidebar__close"
        @click="emit('close')"
      >
        ✕
      </button>
    </header>

    <section class="editor-sidebar__body">
      <!-- Gestor de citas -->
      <EditorReferencesPanel
        v-if="activePanel === 'references'"
        :editor="editor"
        :citation-manager="citationManager"
        :current-citation-style="currentCitationStyle"
        :citation-styles="citationStyles"
      />

      <!-- OCR -->
      <EditorOcrPanel
        v-else-if="activePanel === 'ocr'"
        :editor="editor"
      />

      <!-- Encabezados / pies de página -->
      <EditorPageSectionsPanel
        v-else-if="activePanel === 'pageSections'"
        :editor="editor"
      />

      <!-- Datos / Estadística (F2.6) -->
      <EditorStatsPanel
        v-else-if="activePanel === 'stats'"
        :editor="editor"
      />

      <!-- Diagramas avanzados (F2.11) -->
      <EditorDiagramsPanel
        v-else-if="activePanel === 'diagramsAdv'"
        :editor="editor"
      />

      <!-- Canvas de presentaciones (F2.12) -->
      <EditorSlidesPanel
        v-else-if="activePanel === 'slides'"
        :editor="editor"
      />

      <!-- Bio (secuencias) -->
      <EditorBioPanel
        v-else-if="activePanel === 'bio'"
        :editor="editor"
      />

      <!-- Circuitos -->
      <EditorCircuitsPanel
        v-else-if="activePanel === 'circuits'"
        :editor="editor"
      />

      <!-- Neumática / Hidráulica -->
      <EditorPneumaticsPanel
        v-else-if="activePanel === 'pneumatics'"
        :editor="editor"
      />

      <!-- Capturas de pantalla (F2.13) -->
      <EditorScreenshotPanel
        v-else-if="activePanel === 'screenshot'"
        :is-capturing="!!isCapturingScreenshot"
        :last-screenshot-data-url="lastScreenshotDataUrl"
        @new-screenshot="handleNewScreenshotFromPanel"
        @send-to-slide="handleSendToSlideFromPanel"
      />

      <!-- F2.14: Partes Académicas -->
      <EditorPartsPanel
        v-else-if="activePanel === 'parts'"
        :editor="editor"
      />

      <!-- F2.14: TOC / Índice -->
      <EditorTocPanel
        v-else-if="activePanel === 'toc'"
        :editor="editor"
      />

      <!-- F2.17: Análisis estadístico avanzado -->
      <EditorStatsAdvPanel
        v-else-if="activePanel === 'stats-adv'"
        :editor="editor"
      />

      <!-- F2.16: Panel SVG avanzado -->
      <EditorSvgPanel
        v-else-if="activePanel === 'svg'"
        :editor="editor"
      />

      <!-- F2.18: Bitácora analítica -->
      <EditorAnalyticsPanel
        v-else-if="activePanel === 'analytics'"
        :editor="editor"
      />

      <!-- F2.19: Zonas de texto -->
      <EditorContainersPanel
        v-else-if="activePanel === 'containers'"
        :editor="editor"
      />
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Editor } from '@tiptap/core'
import type { CitationStyleId } from '@disertare/editor-citations'

import EditorReferencesPanel from './EditorReferencesPanel.vue'
import EditorOcrPanel from './EditorOcrPanel.vue'
import EditorPageSectionsPanel from './EditorPageSectionsPanel.vue'
import EditorStatsPanel from './EditorStatsPanel.vue'
import EditorDiagramsPanel from './EditorDiagramsPanel.vue'
import EditorSlidesPanel from './EditorSlidesPanel.vue'
import EditorBioPanel from './EditorBioPanel.vue'
import EditorCircuitsPanel from './EditorCircuitsPanel.vue'
import EditorPneumaticsPanel from './EditorPneumaticsPanel.vue'
import EditorScreenshotPanel from './EditorScreenshotPanel.vue'
import EditorPartsPanel from './EditorPartsPanel.vue'
import EditorTocPanel from './EditorTocPanel.vue'
import EditorSvgPanel from './EditorSvgPanel.vue'
import EditorStatsAdvPanel from './EditorStatsAdvPanel.vue'
import EditorAnalyticsPanel from './EditorAnalyticsPanel.vue'
import EditorContainersPanel from './EditorContainersPanel.vue'

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

const props = defineProps<{
  activePanel: ActivePanel
  editor: Editor | null
  citationManager: {
    getReference: (id: string) => any
    listReferences: () => any[]
  }
  currentCitationStyle: CitationStyleId | null
  citationStyles: { id: CitationStyleId; label: string }[]
  isCapturingScreenshot?: boolean
  lastScreenshotDataUrl?: string | null
  onNewScreenshot?: () => void
  onSendScreenshotToSlide?: () => void
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function handleNewScreenshotFromPanel() {
  if (props.onNewScreenshot) {
    props.onNewScreenshot()
  }
}

function handleSendToSlideFromPanel() {
  if (props.onSendScreenshotToSlide) {
    props.onSendScreenshotToSlide()
  }
}

const titles: Record<Exclude<ActivePanel, 'none'>, string> = {
  references: 'Gestor de citas',
  ocr: 'OCR',
  pageSections: 'Encabezados / pies',
  stats: 'Datos / Estadística',
  'stats-adv': 'Análisis avanzado',
  diagramsAdv: 'Diagramas avanzados',
  slides: 'Canvas de presentaciones',
  bio: 'Bio (secuencias)',
  circuits: 'Circuitos',
  pneumatics: 'Neumática / Hidráulica',
  screenshot: 'Capturas de pantalla',
  parts: 'Partes académicas',
  toc: 'TOC / Índice',
  svg: 'SVG avanzado',
  analytics: 'Bitácora analítica',
  containers: 'Zonas de texto',
}

const currentTitle = computed(() => {
  if (props.activePanel === 'none') return ''
  return titles[props.activePanel] ?? ''
})
</script>

<style scoped>
.editor-sidebar {
  width: 340px;
  max-width: 100%;
  border-left: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
}

.editor-sidebar__header {
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-sidebar__title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.editor-sidebar__close {
  border: none;
  background: transparent;
  font-size: 14px;
  cursor: pointer;
  color: #6b7280;
  padding: 2px 4px;
}

.editor-sidebar__close:hover {
  color: #111827;
}

.editor-sidebar__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
