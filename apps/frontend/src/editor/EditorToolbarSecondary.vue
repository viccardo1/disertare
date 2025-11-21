<!-- apps/frontend/src/editor/EditorToolbarSecondary.vue -->
<template>
  <div class="editor-toolbar-secondary">
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-references')"
    >
      Gestor de citas
    </button>

    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-paged-preview')"
    >
      {{ isPagedPreview ? 'Vista continua' : 'Vista paginada 1:1' }}
    </button>

    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-ocr-panel')"
    >
      OCR
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isPagedPreview: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-references'): void
  (e: 'toggle-paged-preview'): void
  (e: 'toggle-ocr-panel'): void
}>()

const isPagedPreview = props.isPagedPreview
</script>

<style scoped>
.editor-toolbar-secondary {
  display: flex;
  gap: 8px;
}

/* Botones secundarios / toggles */
.toolbar-toggle {
  border: 1px solid #d3cfff;
  background: #ffffff;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  cursor: pointer;
  color: #4b3f72;
  font-weight: 600;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.toolbar-toggle:hover {
  background: #f3ecff;
  border-color: #c1b6ff;
  box-shadow: 0 0 0 1px #d3cfff;
}
</style>
