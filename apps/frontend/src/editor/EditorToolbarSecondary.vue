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
      Vista paginada
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
      Encabezados / pies
    </button>

    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-stats-panel')"
    >
      Datos / Estadística
    </button>

    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-bio-panel')"
    >
      Bio (secuencias)
    </button>

    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-circuits-panel')"
    >
      Circuitos
    </button>

    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-pneumatics-panel')"
    >
      Neumática / Hidráulica
    </button>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'toggle-references'): void
  (e: 'toggle-paged-preview'): void
  (e: 'toggle-ocr-panel'): void
  (e: 'toggle-page-sections-panel'): void
  (e: 'toggle-stats-panel'): void
  (e: 'toggle-bio-panel'): void
  (e: 'toggle-circuits-panel'): void
  (e: 'toggle-pneumatics-panel'): void
}>()
</script>

<style scoped>
.editor-toolbar-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 8px;
  border-bottom: 1px solid #e5e7eb;
  background: #fdfbff;
}

.toolbar-toggle {
  border-radius: 999px;
  padding: 4px 10px;
  border: 1px solid #e5e7eb;
  background: #f9f5ff;
  font-size: 12px;
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
