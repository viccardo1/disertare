<!-- apps/frontend/src/editor/EditorToolbarPrimary.vue -->
<template>
  <div class="editor-toolbar">
    <!-- Matemáticas (KaTeX) -->
    <button
      type="button"
      @click="emit('insert-katex')"
      :aria-label="t('editor.toolbar.katex')"
    >
      fx
    </button>

    <!-- Diagramas Mermaid -->
    <button
      type="button"
      @click="emit('insert-mermaid')"
      :aria-label="t('editor.toolbar.mermaid')"
    >
      M
    </button>

    <!-- Bloque de código / Prism -->
    <button
      type="button"
      @click="emit('insert-code-block')"
      :aria-label="t('editor.toolbar.code')"
    >
      Code
    </button>

    <!-- Tabla -->
    <button
      type="button"
      @click="emit('insert-table')"
      :aria-label="t('editor.toolbar.table')"
    >
      Tabla
    </button>

    <!-- Cita -->
    <button
      type="button"
      @click="emit('insert-citation')"
      :aria-label="t('editor.toolbar.citation')"
    >
      Cita
    </button>

    <!-- Bibliografía -->
    <button
      type="button"
      @click="emit('insert-bibliography')"
      :aria-label="t('editor.toolbar.bibliography')"
    >
      Biblio
    </button>

    <!-- Imagen estándar por URL -->
    <button
      type="button"
      @click="emit('insert-image')"
      :aria-label="t('editor.toolbar.image')"
    >
      Img
    </button>

    <!-- Imagen estándar desde archivo local -->
    <button
      type="button"
      @click="emit('upload-image')"
      :aria-label="t('editor.toolbar.image_upload')"
    >
      Subir
    </button>

    <!-- Imagen avanzada (F2.15) por URL -->
    <button
      type="button"
      @click="emit('insert-image-adv')"
      :aria-label="t('editor.toolbar.image_advanced')"
    >
      Img+
    </button>

    <!-- Imagen avanzada desde archivo local -->
    <button
      type="button"
      @click="emit('upload-image-adv')"
      :aria-label="t('editor.toolbar.image_advanced_upload')"
    >
      Subir+
    </button>

    <!-- SVG vector avanzado (F2.16) -->
    <button
      type="button"
      @click="emit('insert-svg')"
      :aria-label="t('editor.toolbar.svg_advanced')"
    >
      SVG
    </button>

    <button
      type="button"
      @click="emit('upload-svg')"
      :aria-label="t('editor.toolbar.svg_upload')"
    >
      SVG+
    </button>

    <!-- Gantt -->
    <button
      type="button"
      @click="emit('insert-gantt')"
      :aria-label="t('editor.toolbar.gantt')"
    >
      Gantt
    </button>

    <!-- CAD -->
    <button
      type="button"
      @click="emit('insert-cad')"
      :aria-label="t('editor.toolbar.cad')"
    >
      CAD
    </button>

    <!-- DICOM -->
    <button
      type="button"
      @click="emit('insert-dicom')"
      :aria-label="t('editor.toolbar.dicom')"
    >
      DICOM
    </button>

    <!-- Geoespacial -->
    <button
      type="button"
      @click="emit('insert-geospatial')"
      :aria-label="t('editor.toolbar.geospatial')"
    >
      Geo
    </button>

    <!-- Química (F2.7) -->
    <button
      type="button"
      @click="emit('insert-chem')"
      :aria-label="t('editor.toolbar.chem')"
    >
      Chem
    </button>

    <!-- Bio (F2.8) -->
    <button
      type="button"
      @click="emit('insert-bio-sequence')"
      :aria-label="t('editor.toolbar.bio')"
    >
      Bio
    </button>

    <!-- Circuitos (F2.9) -->
    <button
      type="button"
      @click="emit('insert-circuit')"
      :aria-label="t('editor.toolbar.circuits')"
    >
      Circuits
    </button>

    <!-- Neumática / Hidráulica (F2.10) -->
    <button
      type="button"
      @click="emit('insert-pneumatics')"
      :aria-label="t('editor.toolbar.pneumatics')"
    >
      Pneum.
    </button>

    <!-- Slides (F2.12) -->
    <button
      type="button"
      @click="emit('insert-slides')"
      :aria-label="t('editor.toolbar.slides')"
    >
      Slides
    </button>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'insert-katex'): void
  (e: 'insert-mermaid'): void
  (e: 'insert-code-block'): void
  (e: 'insert-citation'): void
  (e: 'insert-bibliography'): void
  (e: 'insert-image'): void
  (e: 'upload-image'): void
  (e: 'insert-image-adv'): void
  (e: 'upload-image-adv'): void
  (e: 'insert-gantt'): void
  (e: 'insert-cad'): void
  (e: 'insert-dicom'): void
  (e: 'insert-geospatial'): void
  (e: 'insert-chem'): void
  (e: 'insert-bio-sequence'): void
  (e: 'insert-circuit'): void
  (e: 'insert-pneumatics'): void
  (e: 'insert-slides'): void
  (e: 'insert-svg'): void
  (e: 'upload-svg'): void
}>()

// placeholder i18n
const t = (key: string) => key
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Botones de toolbar */
.editor-toolbar button {
  border: 1px solid #d3cfff;
  background: #ffffff;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  color: #4b3f72;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.editor-toolbar button:hover {
  background: #f3ecff;
  border-color: #c1b6ff;
  box-shadow: 0 0 0 1px #d3cfff;
}
</style>
