<!-- apps/frontend/src/editor/EditorTocPanel.vue -->
<template>
  <aside
    class="toc-panel"
    role="complementary"
    aria-label="TOC / Índice (F2.14)"
  >
    <header class="toc-panel__header">
      <div class="toc-panel__title-block">
        <h2 class="toc-panel__title">
          TOC / Índice
          <span class="toc-panel__phase">(F2.14)</span>
        </h2>
        <p class="toc-panel__subtitle">
          Genera un índice simple a partir de los encabezados del documento.
          Las partes académicas insertadas desde el panel de partes también
          se incluyen automáticamente (excepto la portada).
        </p>
      </div>

      <button
        type="button"
        class="toc-panel__close"
        @click="handleClose"
      >
        ✕
      </button>
    </header>

    <section class="toc-panel__section">
      <div class="toc-panel__field">
        <label class="toc-panel__label">
          Nivel mínimo de encabezado
        </label>
        <select
          v-model.number="minLevel"
          class="toc-panel__select"
        >
          <option :value="1">1</option>
          <option :value="2">2</option>
          <option :value="3">3</option>
        </select>
      </div>

      <button
        type="button"
        class="toc-panel__button"
        @click="handleRecompute"
      >
        Recalcular índice
      </button>

      <ul
        v-if="tocEntries.length"
        class="toc-panel__preview"
      >
        <li
          v-for="entry in tocEntries"
          :key="entry.id"
          :class="[
            'toc-panel__preview-item',
            `toc-panel__preview-item--level-${entry.level}`,
          ]"
        >
          {{ entry.text }}
        </li>
      </ul>
      <p
        v-else
        class="toc-panel__empty"
      >
        No se encontraron encabezados en el documento.
      </p>
    </section>

    <footer class="toc-panel__footer">
      <button
        type="button"
        class="toc-panel__button toc-panel__button--primary"
        :disabled="!tocEntries.length"
        @click="handleInsert"
      >
        Insertar índice en el documento
      </button>
    </footer>

    <p class="toc-panel__hint">
      El índice se inserta como una lista de contenido. Si ya insertaste un
      índice y vuelves a pulsar el botón, se te preguntará si quieres añadirlo
      de nuevo como contenido adicional.
    </p>
  </aside>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import type { Editor } from '@tiptap/core'
import { useEditorToc } from './composables/useEditorToc'

const props = defineProps<{
  editor: Editor | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const {
  minLevel,
  maxLevel,
  tocEntries,
  recomputeToc,
  insertTocIntoDocument,
} = useEditorToc(() => props.editor)

maxLevel.value = 6

// Para saber si ya insertamos un índice al menos una vez
const hasInsertedOnce = ref(false)

watchEffect(() => {
  if (props.editor) {
    recomputeToc()
  } else {
    tocEntries.value = []
  }
})

function handleRecompute() {
  recomputeToc()
}

function handleInsert() {
  if (!tocEntries.value.length) {
    recomputeToc()
    if (!tocEntries.value.length) return
  }

  if (hasInsertedOnce.value) {
    const shouldInsert = window.confirm(
      'El índice ya fue insertado en el documento. ¿Quieres insertarlo nuevamente como contenido adicional?',
    )

    if (!shouldInsert) {
      return
    }
  }

  insertTocIntoDocument()
  hasInsertedOnce.value = true
}

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.toc-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.toc-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.toc-panel__title-block {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.toc-panel__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.toc-panel__phase {
  font-size: 0.78rem;
  font-weight: 600;
  color: #4b3f72;
  background: #ede9fe;
  border-radius: 999px;
  padding: 2px 6px;
}

.toc-panel__subtitle {
  font-size: 0.8rem;
  color: #4b5563;
}

.toc-panel__close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 999px;
}

.toc-panel__close:hover {
  background: #f3f4f6;
}

.toc-panel__section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toc-panel__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toc-panel__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.toc-panel__select {
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  font-family: inherit;
  background: #ffffff;
}

.toc-panel__select:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 1px #e9d5ff;
}

.toc-panel__button {
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  font-size: 0.8rem;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
}

.toc-panel__button--primary {
  background: #4b3f72;
  color: #ffffff;
  border-color: #4b3f72;
}

.toc-panel__button--primary:disabled {
  opacity: 0.6;
  cursor: default;
}

.toc-panel__button--primary:not(:disabled):hover {
  background: #5b4a8a;
}

.toc-panel__preview {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 8rem;
  overflow: auto;
}

.toc-panel__preview-item {
  font-size: 0.78rem;
  color: #111827;
  padding: 0.1rem 0;
}

.toc-panel__preview-item--level-2 {
  padding-left: 0.75rem;
}

.toc-panel__preview-item--level-3 {
  padding-left: 1.5rem;
}

.toc-panel__empty {
  font-size: 0.78rem;
  color: #6b7280;
}

.toc-panel__footer {
  margin-top: 0.25rem;
}

.toc-panel__hint {
  font-size: 0.72rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
}
</style>
