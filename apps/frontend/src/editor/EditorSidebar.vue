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
        aria-label="Cerrar panel de herramientas"
      >
        ✕
      </button>
    </header>

    <section class="editor-sidebar__body">
      <!-- Referencias / Gestor de citas -->
      <EditorReferencesPanel
        v-if="activePanel === 'references'"
        :citation-manager="citationManager"
        :current-citation-style="currentCitationStyle ?? 'apa'"
        :citation-styles="citationStyles"
        @references-changed="emit('references-changed')"
        @update:current-citationStyle="onUpdateCitationStyle"
        @insert-citation-from-panel="(payload) => emit('insert-citation-from-panel', payload)"
      />

      <!-- OCR -->
      <EditorOcrPanel
        v-else-if="activePanel === 'ocr'"
        :editor="editor"
      />

      <!-- Encabezados / Pies -->
      <EditorPageSectionsPanel
        v-else-if="activePanel === 'pageSections'"
        :editor="editor"
      />

      <!-- Datos / Estadística -->
      <EditorStatsPanel
        v-else-if="activePanel === 'stats'"
        :editor="editor"
      />

      <!-- Diagramas avanzados -->
      <EditorDiagramsPanel
        v-else-if="activePanel === 'diagramsAdv'"
        :editor="editor"
      />

      <!-- Presentaciones / Canvas de diapositivas -->
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
  (e: 'references-changed'): void
  (e: 'update:current-citationStyle', value: CitationStyleId): void
  (e: 'insert-citation-from-panel', payload: {
    refId: string
    locator?: string
    prefix?: string
    suffix?: string
  }): void
}>()

function onUpdateCitationStyle(style: CitationStyleId) {
  emit('update:current-citationStyle', style)
}

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
  diagramsAdv: 'Diagramas avanzados',
  slides: 'Canvas de presentaciones',
  bio: 'Bio (secuencias)',
  circuits: 'Circuitos',
  pneumatics: 'Neumática / Hidráulica',
  screenshot: 'Capturas de pantalla',
}

const currentTitle = computed(() => {
  if (props.activePanel === 'none') return ''
  return titles[props.activePanel] ?? ''
})
</script>

<style scoped>
.editor-sidebar {
  width: 320px;
  max-width: 40%;
  border-left: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.editor-sidebar__title {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: #4b3f72;
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
