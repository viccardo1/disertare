<!-- apps/frontend/src/editor/EditorPartsPanel.vue -->
<template>
  <aside
    class="parts-panel"
    role="complementary"
    aria-label="Partes académicas (F2.14)"
  >
    <header class="parts-panel__header">
      <div class="parts-panel__title-block">
        <h2 class="parts-panel__title">
          Partes académicas
          <span class="parts-panel__phase">(F2.14)</span>
        </h2>
        <p class="parts-panel__subtitle">
          Define la estructura inicial del documento (tesis, artículo, reporte).
          Las partes se pueden renombrar y reordenar, y no se fuerza al usuario
          a mantener ninguna sección.
        </p>
      </div>

      <button
        type="button"
        class="parts-panel__close"
        @click="handleClose"
      >
        ✕
      </button>
    </header>

    <section class="parts-panel__section">
      <label class="parts-panel__field">
        <span class="parts-panel__label">Formato académico</span>
        <select
          v-model="selectedFormatId"
          class="parts-panel__select"
        >
          <option
            v-for="format in formats"
            :key="format.id"
            :value="format.id"
          >
            {{ format.label }}
          </option>
        </select>
      </label>

      <p
        v-if="currentFormat"
        class="parts-panel__format-description"
      >
        {{ currentFormat.description }}
      </p>

      <div
        v-if="currentFormat"
        class="parts-panel__parts-list"
      >
        <h3 class="parts-panel__parts-title">
          Partes incluidas en este documento
        </h3>

        <label
          v-for="part in currentFormat.parts"
          :key="part.id"
          class="parts-panel__checkbox"
        >
          <input
            type="checkbox"
            class="parts-panel__checkbox-input"
            :checked="isPartSelected(part.id)"
            @change="togglePart(part.id)"
          >
          <span class="parts-panel__checkbox-label">
            {{ part.label.es }}
          </span>
        </label>
      </div>
    </section>

    <footer class="parts-panel__footer">
      <button
        type="button"
        class="parts-panel__button parts-panel__button--primary"
        @click="handleInsertStructure"
      >
        Insertar estructura en el documento
      </button>
    </footer>

    <p class="parts-panel__hint">
      Se insertan encabezados de nivel 1 para cada parte seleccionada
      y un párrafo vacío debajo para que puedas comenzar a escribir.
      Más adelante podrás reorganizar y renombrar las secciones libremente.
    </p>
  </aside>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { useEditorParts } from './composables/useEditorParts'

const props = defineProps<{
  editor: Editor | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const {
  formats,
  selectedFormatId,
  currentFormat,
  isPartSelected,
  togglePart,
  insertStructureIntoDocument,
} = useEditorParts(() => props.editor)

function handleInsertStructure() {
  insertStructureIntoDocument()
}

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.parts-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.parts-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.parts-panel__title-block {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.parts-panel__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.parts-panel__phase {
  font-size: 0.78rem;
  font-weight: 600;
  color: #4b3f72;
  background: #ede9fe;
  border-radius: 999px;
  padding: 2px 6px;
}

.parts-panel__subtitle {
  font-size: 0.8rem;
  color: #4b5563;
}

.parts-panel__close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 999px;
}

.parts-panel__close:hover {
  background: #f3f4f6;
}

.parts-panel__section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.parts-panel__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.parts-panel__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.parts-panel__select {
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  font-family: inherit;
  background: #ffffff;
}

.parts-panel__select:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 1px #e9d5ff;
}

.parts-panel__format-description {
  font-size: 0.78rem;
  color: #4b5563;
}

.parts-panel__parts-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.parts-panel__parts-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem;
}

.parts-panel__checkbox {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #111827;
}

.parts-panel__checkbox-input {
  width: 14px;
  height: 14px;
}

.parts-panel__checkbox-label {
  flex: 1;
}

.parts-panel__footer {
  margin-top: 0.25rem;
}

.parts-panel__button {
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  font-size: 0.8rem;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
}

.parts-panel__button--primary {
  background: #4b3f72;
  color: #ffffff;
  border-color: #4b3f72;
}

.parts-panel__button--primary:hover {
  background: #5b4a8a;
}

.parts-panel__hint {
  font-size: 0.72rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
}
</style>
