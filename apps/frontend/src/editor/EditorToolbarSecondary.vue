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

    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-page-sections-panel')"
    >
      Encabezados y pies
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
  (e: 'toggle-page-sections-panel'): void
}>()

const isPagedPreview = props.isPagedPreview
</script>

<style scoped>
.editor-toolbar-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px 10px;
  border-top: 1px solid #e0d6ff;
  background: #f7f4ff;
}

.toolbar-toggle {
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #d3cfff;
  background: #ffffff;
  font-size: 12px;
  line-height: 1.2;
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
