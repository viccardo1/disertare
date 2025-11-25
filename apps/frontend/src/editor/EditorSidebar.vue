<!-- apps/frontend/src/editor/EditorSidebar.vue -->
<template>
  <aside
    v-if="activePanel !== 'none'"
    class="editor-sidebar"
  >
    <component
      :is="currentPanelComponent"
      v-bind="currentPanelProps"
    />
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
import EditorChemPanel from './EditorChemPanel.vue'

const props = defineProps<{
  activePanel: 'none' | 'references' | 'ocr' | 'pageSections' | 'stats' | 'chem'
  editor: Editor | null
  citationManager: any
  currentCitationStyle: CitationStyleId
  citationStyles: CitationStyleId[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'references-changed'): void
  (e: 'update:currentCitationStyle', value: CitationStyleId): void
  (e: 'insert-citation-from-panel', payload: {
    refId: string
    locator?: string
    prefix?: string
    suffix?: string
  }): void
}>()

const currentPanelComponent = computed(() => {
  switch (props.activePanel) {
    case 'references':
      return EditorReferencesPanel
    case 'ocr':
      return EditorOcrPanel
    case 'pageSections':
      return EditorPageSectionsPanel
    case 'stats':
      return EditorStatsPanel
    case 'chem':
      return EditorChemPanel
    default:
      return null
  }
})

const currentPanelProps = computed(() => {
  switch (props.activePanel) {
    case 'references':
      return {
        citationManager: props.citationManager,
        currentCitationStyle: props.currentCitationStyle,
        citationStyles: props.citationStyles,
        onClose: () => emit('close'),
        onReferencesChanged: () => emit('references-changed'),
        onUpdateCurrentCitationStyle: (value: CitationStyleId) =>
          emit('update:currentCitationStyle', value),
        onInsertCitation: (payload: {
          refId: string
          locator?: string
          prefix?: string
          suffix?: string
        }) => emit('insert-citation-from-panel', payload),
      }
    case 'ocr':
      return {
        editor: props.editor,
        onClose: () => emit('close'),
      }
    case 'pageSections':
      return {
        editor: props.editor,
        onClose: () => emit('close'),
      }
    case 'stats':
      return {
        editor: props.editor,
        onClose: () => emit('close'),
      }
    case 'chem':
      return {
        editor: props.editor,
        onClose: () => emit('close'),
      }
    default:
      return {}
  }
})
</script>

<style scoped>
.editor-sidebar {
  width: 320px;
  border-left: 1px solid #e5e7eb;
  padding: 8px;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
