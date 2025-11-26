<!-- apps/frontend/src/editor/EditorPneumaticsPanel.vue -->
<template>
  <aside
    class="pneumatics-panel"
    role="complementary"
    aria-label="Neumática / Hidráulica (F2.10)"
  >
    <!-- Header -->
    <header class="pneumatics-panel__header">
      <div class="pneumatics-panel__title-block">
        <h2 class="pneumatics-panel__title">
          Neumática / Hidráulica
          <span class="pneumatics-panel__phase">(F2.10)</span>
        </h2>
        <p class="pneumatics-panel__subtitle">
          Define un bloque neumático/hidráulico a nivel de documento. Más
          adelante se podrán ligar motores de simulación y vistas esquemáticas
          detalladas.
        </p>
      </div>

      <button
        type="button"
        class="pneumatics-panel__close"
        @click="handleClose"
      >
        ✕
      </button>
    </header>

    <!-- Formulario principal -->
    <section class="pneumatics-panel__section">
      <label class="pneumatics-panel__field">
        <span class="pneumatics-panel__label">Etiqueta del bloque</span>
        <input
          v-model="label"
          type="text"
          class="pneumatics-panel__input"
          placeholder="Ej. Unidad de mantenimiento, Actuador de doble efecto…"
        />
      </label>

      <label class="pneumatics-panel__field">
        <span class="pneumatics-panel__label">
          Notación / descripción (ISO 1219, etc.)
        </span>
        <textarea
          v-model="notation"
          rows="3"
          class="pneumatics-panel__textarea"
          placeholder="Describe componentes, conexiones y símbolos (p. ej. ISO 1219) de forma breve."
        />
      </label>

      <label class="pneumatics-panel__field">
        <span class="pneumatics-panel__label">
          Notas didácticas / observaciones
        </span>
        <textarea
          v-model="notes"
          rows="3"
          class="pneumatics-panel__textarea pneumatics-panel__textarea--notes"
          placeholder="Notas sobre funcionamiento, puntos de seguridad, ajustes típicos, etc."
        />
      </label>
    </section>

    <!-- Acciones -->
    <footer class="pneumatics-panel__footer">
      <button
        type="button"
        class="pneumatics-panel__button pneumatics-panel__button--primary"
        :disabled="!canInsert"
        @click="handleInsert"
      >
        Insertar bloque neumática/hidráulica
      </button>
      <button
        type="button"
        class="pneumatics-panel__button pneumatics-panel__button--ghost"
        @click="resetForm"
      >
        Limpiar formulario
      </button>
    </footer>

    <p class="pneumatics-panel__hint">
      El bloque se inserta como un
      <code>circuitDiagram</code> especializado en neumática/hidráulica.
      En fases posteriores se podrán añadir vistas esquemáticas normalizadas,
      parámetros de operación de fluido y simulación.
    </p>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Editor } from '@tiptap/core'
import { useEditorPneumatics } from './composables/useEditorPneumatics'

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
  insertPneumaticBlock,
  resetForm,
} = useEditorPneumatics(() => props.editor)

const canInsert = computed(
  () => !!(label.value.trim() || notation.value.trim()),
)

function handleInsert() {
  if (!canInsert.value) return
  insertPneumaticBlock()
  resetForm()
}

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.pneumatics-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.pneumatics-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.pneumatics-panel__title-block {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.pneumatics-panel__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.pneumatics-panel__phase {
  font-size: 0.78rem;
  font-weight: 600;
  color: #4b3f72;
  background: #ede9fe;
  border-radius: 999px;
  padding: 2px 6px;
}

.pneumatics-panel__subtitle {
  font-size: 0.8rem;
  color: #4b5563;
}

.pneumatics-panel__close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 999px;
}

.pneumatics-panel__close:hover {
  background: #f3f4f6;
}

.pneumatics-panel__section {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.pneumatics-panel__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pneumatics-panel__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.pneumatics-panel__input,
.pneumatics-panel__textarea {
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  font-family: inherit;
}

.pneumatics-panel__textarea {
  resize: vertical;
  min-height: 3rem;
}

.pneumatics-panel__textarea--notes {
  min-height: 3.5rem;
}

.pneumatics-panel__input:focus,
.pneumatics-panel__textarea:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 1px #e9d5ff;
}

.pneumatics-panel__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.pneumatics-panel__button {
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  font-size: 0.8rem;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
}

.pneumatics-panel__button--primary {
  background: #4b3f72;
  color: #ffffff;
  border-color: #4b3f72;
}

.pneumatics-panel__button--primary:disabled {
  opacity: 0.6;
  cursor: default;
}

.pneumatics-panel__button--primary:not(:disabled):hover {
  background: #5b4a8a;
}

.pneumatics-panel__button--ghost {
  background: #ffffff;
  color: #4b3f72;
  border-color: #e5e7eb;
}

.pneumatics-panel__button--ghost:hover {
  background: #f3ecff;
}

.pneumatics-panel__hint {
  font-size: 0.72rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
}
</style>
