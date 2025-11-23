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
      Vista paginada 1:1
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

    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-stats-panel')"
    >
      Datos / Estadística
    </button>
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  (e: 'toggle-references'): void
  (e: 'toggle-paged-preview'): void
  (e: 'toggle-ocr-panel'): void
  (e: 'toggle-page-sections-panel'): void
  (e: 'toggle-stats-panel'): void
}>()
</script>

<style scoped>
.editor-toolbar-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e3e0ff;
  background: #faf9ff;
}

.toolbar-toggle {
  font-size: 0.8rem;
  line-height: 1.2;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #d3cfff;
  background: #f6f4ff;
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
