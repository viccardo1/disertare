<!-- apps/frontend/src/editor/EditorSidebar.vue -->
<template>
  <aside
    v-if="activePanel !== 'none' && currentPanelComponent"
    class="editor-sidebar"
  >
    <component
      :is="currentPanelComponent"
      v-bind="currentPanelProps"
    />
  </aside>
</template>

<script setup lang="ts">
import { computed, type Ref } from 'vue'
import type { Editor } from '@tiptap/core'
import type { CitationStyleId } from '@disertare/editor-citations'

import EditorReferencesPanel from './EditorReferencesPanel.vue'
import EditorOcrPanel from './EditorOcrPanel.vue'
import EditorStatsPanel from './EditorStatsPanel.vue'
import EditorPageSectionsPanel from './EditorPageSectionsPanel.vue'
import EditorBioPanel from './EditorBioPanel.vue'

type ActivePanel =
  | 'none'
  | 'references'
  | 'ocr'
  | 'pageSections'
  | 'stats'
  | 'bio'

type CitationManager = {
  getReference: (id: string) => any
  listReferences: () => any[]
  addReference?: (ref: any) => void
  updateReference?: (ref: any) => void
  removeReference?: (id: string) => void
}

const props = defineProps<{
  activePanel: ActivePanel
  /**
   * Instancia de TipTap. Puede ser null mientras el editor se inicializa,
   * por eso aceptamos Editor | null para evitar el warning.
   */
  editor: Editor | null
  citationManager: CitationManager
  currentCitationStyle: CitationStyleId
  citationStyles: { id: CitationStyleId; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'references-changed'): void
  (e: 'insert-citation-from-panel', payload: {
    refId: string
    locator?: string
    prefix?: string
    suffix?: string
  }): void
  // Nota: el padre escucha @update:current-citationStyle (kebab-case),
  // así que aquí hacemos el puente desde el evento camelCase del panel.
  (e: 'update:current-citationStyle', value: CitationStyleId): void
}>()

/**
 * Editor como Ref sólo para el panel OCR, que espera Ref<Editor | null>.
 * Es readonly, pero useEditorOcr sólo lo lee, nunca asigna editor.value.
 */
const editorRef = computed(
  () => props.editor,
) as unknown as Ref<Editor | null>

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
    case 'bio':
      return EditorBioPanel
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
        // eventos del panel → EditorSidebar → Editor.vue
        onClose: () => emit('close'),
        onReferencesChanged: () => emit('references-changed'),
        'onUpdate:currentCitationStyle': (value: CitationStyleId) =>
          emit('update:current-citationStyle', value),
        onInsertCitation: (payload: {
          refId: string
          locator?: string
          prefix?: string
          suffix?: string
        }) => emit('insert-citation-from-panel', payload),
      }

    case 'ocr':
      return {
        editor: editorRef,
      }

    case 'pageSections':
      // usePageSections no necesita props, pero dejamos hook por si
      // más adelante ligamos secciones a un editor concreto.
      return {}

    case 'stats':
      return {
        editor: props.editor,
      }

    case 'bio':
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
