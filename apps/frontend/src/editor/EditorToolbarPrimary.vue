<!-- apps/frontend/src/editor/EditorToolbarPrimary.vue -->
<template>
  <div class="editor-toolbar">
    <button @click="emit('insert-katex')" :aria-label="t('editor.toolbar.katex')">
      fx
    </button>

    <button
      @click="emit('insert-mermaid')"
      :aria-label="t('editor.toolbar.mermaid')"
    >
      M
    </button>

    <button
      @click="emit('insert-code-block')"
      :aria-label="t('editor.toolbar.code')"
    >
      ]
    </button>

    <button
      @click="emit('insert-table')"
      :aria-label="t('editor.toolbar.table')"
    >
      T
    </button>

    <button
      @click="emit('insert-citation')"
      :aria-label="t('editor.toolbar.citation')"
    >
      Cita
    </button>

    <button
      @click="emit('insert-bibliography')"
      :aria-label="t('editor.toolbar.bibliography')"
    >
      Biblio
    </button>

    <button
      @click="emit('insert-image')"
      :aria-label="t('editor.toolbar.image')"
    >
      Img
    </button>

    <button
      @click="emit('insert-gantt')"
      :aria-label="t('editor.toolbar.gantt')"
    >
      Gantt
    </button>

    <button
      @click="emit('insert-cad')"
      :aria-label="t('editor.toolbar.cad')"
    >
      CAD
    </button>

    <button
      @click="emit('insert-dicom')"
      :aria-label="t('editor.toolbar.dicom')"
    >
      DICOM
    </button>

    <button
      @click="emit('insert-geospatial')"
      :aria-label="t('editor.toolbar.geospatial')"
    >
      Geo
    </button>

    <!-- NUEVO F2.7: botón de Química -->
    <button
      @click="emit('insert-chem')"
      :aria-label="t('editor.toolbar.chem')"
    >
      Química
    </button>

    <button
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
  (e: 'insert-table'): void
  (e: 'insert-citation'): void
  (e: 'insert-bibliography'): void
  (e: 'insert-image'): void
  (e: 'insert-gantt'): void
  (e: 'insert-cad'): void
  (e: 'insert-dicom'): void
  (e: 'insert-geospatial'): void
  (e: 'insert-chem'): void
  (e: 'insert-slides'): void
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
  font-size: 13px;
  line-height: 1;
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
