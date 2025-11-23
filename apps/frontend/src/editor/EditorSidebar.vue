<!-- apps/frontend/src/editor/EditorSidebar.vue -->
<template>
  <aside
    v-if="activePanel !== 'none'"
    class="editor-sidebar"
    aria-label="Panel de herramientas del editor"
  >
    <div class="editor-sidebar__scroll">
      <!-- Citas / referencias -->
      <EditorReferencesPanel
        v-if="activePanel === 'references'"
        :citation-manager="citationManager"
        :current-citation-style="currentCitationStyle"
        :citation-styles="citationStyles"
        @update:currentCitationStyle="handleUpdateCitationStyle"
        @close="emitClose"
        @references-changed="emitReferencesChanged"
        @insert-citation="handleInsertCitationFromPanel"
      />

      <!-- OCR -->
      <EditorOcrPanel
        v-else-if="activePanel === 'ocr'"
        :editor="editor"
      />

      <!-- Encabezados y pies de página -->
      <EditorPageSectionsPanel
        v-else-if="activePanel === 'pageSections'"
      />

      <!-- Datos / Estadística (F2.6) -->
      <EditorStatsPanel
        v-else-if="activePanel === 'stats'"
        :editor="editor"
      />
    </div>

    <!-- Botón para contraer (equivale a cerrar el panel) -->
    <button
      type="button"
      class="editor-sidebar__collapse"
      @click="emitClose"
    >
      Cerrar panel
    </button>
  </aside>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/core'

import EditorReferencesPanel from './EditorReferencesPanel.vue'
import EditorOcrPanel from './EditorOcrPanel.vue'
import EditorPageSectionsPanel from './EditorPageSectionsPanel.vue'
import EditorStatsPanel from './EditorStatsPanel.vue'

type ActivePanel = 'none' | 'references' | 'ocr' | 'pageSections' | 'stats'

const props = defineProps<{
  activePanel: ActivePanel
  editor: Editor | null
  citationManager: any
  currentCitationStyle: string
  citationStyles: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'references-changed'): void
  (e: 'insert-citation-from-panel', refId: string): void
  (e: 'update:currentCitationStyle', value: string): void
}>()

const emitClose = (): void => {
  emit('close')
}

const emitReferencesChanged = (): void => {
  emit('references-changed')
}

const handleUpdateCitationStyle = (value: string): void => {
  emit('update:currentCitationStyle', value)
}

const handleInsertCitationFromPanel = (refId: string): void => {
  emit('insert-citation-from-panel', refId)
}
</script>

<style scoped>
.editor-sidebar {
  display: flex;
  flex-direction: column;
  width: 340px;
  max-width: 380px;
  flex-shrink: 0;
  margin-left: 12px;

  /* Evitar que el contenido quede oculto por el header/nav + footer fijo */
  max-height: calc(100vh - 96px);
}

/* Área interna con scroll propio.
   El padding-bottom extra asegura que los últimos controles (como
   el botón de insertar gráfica) suban por encima del footer fijo
   cuando se hace scroll hasta el final. */
.editor-sidebar__scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 8px 0 96px;
}

/* Botón “Cerrar panel” */
.editor-sidebar__collapse {
  margin-top: 4px;
  align-self: stretch;
  border: none;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: #f5f3ff;
  color: #4c1d95;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.05s ease;
}

.editor-sidebar__collapse:hover {
  background: #ede9fe;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.16);
}

.editor-sidebar__collapse:active {
  transform: translateY(1px);
}
</style>
