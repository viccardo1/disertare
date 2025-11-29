<!-- apps/frontend/src/editor/EditorToolbarSecondary.vue -->
<template>
  <div class="editor-toolbar-secondary">
    <!-- Paneles generales / modos -->
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

    <!-- Datos / Estadística (F2.6) -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-stats-panel')"
    >
      Datos / Estadística
    </button>

    <!-- F2.17: Análisis estadístico avanzado -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-stats-adv-panel')"
    >
      Análisis avanzado
    </button>

    <!-- F2.18: Bitácora analítica -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-analytics-panel')"
    >
      Bitácora analítica
    </button>

    <!-- Diagramas avanzados (F2.11) -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-diagrams-panel')"
    >
      Diagramas
    </button>

    <!-- Canvas de Presentaciones (F2.12) -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-slides-panel')"
    >
      Presentaciones
    </button>

    <!-- Bio (secuencias) -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-bio-panel')"
    >
      Bio
    </button>

    <!-- Circuitos -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-circuits-panel')"
    >
      Circuitos
    </button>

    <!-- Neumática / Hidráulica -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-pneumatics-panel')"
    >
      Neumática / Hidráulica
    </button>

    <!-- Capturas de pantalla (panel) -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-screenshot-panel')"
    >
      Capturas
    </button>

    <!-- F2.13: Nueva captura directa -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('new-screenshot')"
    >
      Nueva captura
    </button>

    <!-- Partes académicas -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-parts-panel')"
    >
      Partes académicas
    </button>

    <!-- Panel lateral SVG (F2.16) -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-svg-panel')"
    >
      SVG
    </button>

    <!-- F2.19: Zonas de texto -->
    <button
      type="button"
      class="toolbar-toggle"
      @click="emit('toggle-containers-panel')"
    >
      Zonas de texto
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
  (e: 'toggle-stats-adv-panel'): void
  (e: 'toggle-analytics-panel'): void
  (e: 'toggle-diagrams-panel'): void
  (e: 'toggle-slides-panel'): void
  (e: 'toggle-bio-panel'): void
  (e: 'toggle-circuits-panel'): void
  (e: 'toggle-pneumatics-panel'): void
  (e: 'toggle-screenshot-panel'): void
  (e: 'new-screenshot'): void
  (e: 'toggle-parts-panel'): void
  (e: 'toggle-svg-panel'): void
  (e: 'toggle-containers-panel'): void
}>()
</script>

<style scoped>
.editor-toolbar-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 8px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.toolbar-toggle {
  padding: 4px 8px;
  border-radius: 999px;
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
