<!-- apps/frontend/src/editor/EditorCircuitsPanel.vue -->
<template>
  <aside
    class="circuits-panel"
    role="complementary"
    aria-label="Circuitos (F2.9)"
  >
    <!-- Header -->
    <header class="circuits-panel__header">
      <div class="circuits-panel__title-block">
        <h2 class="circuits-panel__title">
          Circuitos
          <span class="circuits-panel__phase">(F2.9)</span>
        </h2>
        <p class="circuits-panel__subtitle">
          Define un bloque de circuito IEC/ANSI a nivel de documento. Más
          adelante se podrá vincular a motores de simulación sin perder
          compatibilidad.
        </p>
      </div>

      <button
        type="button"
        class="circuits-panel__close"
        @click="handleClose"
      >
        ✕
      </button>
    </header>

    <!-- Formulario principal -->
    <section class="circuits-panel__section">
      <label class="circuits-panel__field">
        <span class="circuits-panel__label">Etiqueta del circuito</span>
        <input
          v-model="label"
          type="text"
          class="circuits-panel__input"
          placeholder="Ej. Divisor de tensión, Puente de Wheatstone…"
        />
      </label>

      <label class="circuits-panel__field">
        <span class="circuits-panel__label">Notación / descripción</span>
        <textarea
          v-model="notation"
          rows="3"
          class="circuits-panel__textarea"
          placeholder="Describe la topología, elementos principales o una notación tipo netlist."
        />
      </label>

      <label class="circuits-panel__field">
        <span class="circuits-panel__label">Notas didácticas</span>
        <textarea
          v-model="notes"
          rows="3"
          class="circuits-panel__textarea circuits-panel__textarea--notes"
          placeholder="Objetivo del circuito, supuestos, advertencias, instrucciones para el lector, etc."
        />
      </label>
    </section>

    <!-- Acciones -->
    <footer class="circuits-panel__footer">
      <button
        type="button"
        class="circuits-panel__button circuits-panel__button--primary"
        :disabled="!canInsert"
        @click="handleInsert"
      >
        Insertar circuito en el documento
      </button>
      <button
        type="button"
        class="circuits-panel__button circuits-panel__button--ghost"
        @click="resetForm"
      >
        Limpiar formulario
      </button>
    </footer>

    <p class="circuits-panel__hint">
      El circuito se inserta como un bloque independiente (<code>circuitDiagram</code>).
      En fases posteriores se podrán añadir vistas IEC/ANSI detalladas,
      parámetros eléctricos y simulación.
    </p>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Editor } from '@tiptap/core'
import { useEditorCircuits } from './composables/useEditorCircuits'

const props = defineProps<{
  editor: Editor | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const {
  label,
  notation,
  notes,
  insertCircuitBlock,
  resetForm,
} = useEditorCircuits(() => props.editor)

const canInsert = computed(
  () => !!(label.value.trim() || notation.value.trim()),
)

function handleInsert() {
  if (!canInsert.value) return
  insertCircuitBlock()
  resetForm() // ← limpia el formulario después de insertar
}

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.circuits-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.circuits-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.circuits-panel__title-block {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.circuits-panel__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.circuits-panel__phase {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b21a8;
}

.circuits-panel__subtitle {
  font-size: 0.8rem;
  color: #4b5563;
  margin: 0;
}

.circuits-panel__close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  color: #6b7280;
}

.circuits-panel__section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.circuits-panel__field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.circuits-panel__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #4b5563;
}

.circuits-panel__input,
.circuits-panel__textarea {
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  padding: 0.35rem 0.45rem;
  font-size: 0.8rem;
  font-family: inherit;
}

.circuits-panel__textarea {
  resize: vertical;
  min-height: 3rem;
}

.circuits-panel__textarea--notes {
  min-height: 3.5rem;
}

.circuits-panel__input:focus,
.circuits-panel__textarea:focus {
  outline: none;
  border-color: #4b3f72;
  box-shadow: 0 0 0 1px rgba(75, 63, 114, 0.2);
}

.circuits-panel__footer {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.circuits-panel__button {
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.circuits-panel__button--primary {
  background: #4b3f72;
  color: #f9fafb;
  border-color: #4b3f72;
}

.circuits-panel__button--primary:disabled {
  opacity: 0.5;
  cursor: default;
}

.circuits-panel__button--ghost {
  background: transparent;
  color: #4b3f72;
  border-color: #e5e7eb;
}

.circuits-panel__button--ghost:hover {
  background: #f3ecff;
}

.circuits-panel__hint {
  font-size: 0.72rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
}
</style>
