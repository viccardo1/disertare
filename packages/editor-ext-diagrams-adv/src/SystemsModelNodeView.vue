/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  D  DISERTARE                                                    ║
 * ║  Plataforma avanzada de edición técnica, científica y            ║
 * ║  multidisciplinaria.                                             ║
 * ║                                                                  ║
 * ║  © 2025 Disertare Project — Licencia Privativa.                  ║
 * ║  Todos los derechos reservados.                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

<!-- packages/editor-ext-diagrams-adv/src/SystemsModelNodeView.vue -->
<template>
  <NodeViewWrapper class="systems-model">
    <header class="systems-model__header">
      <input
        class="systems-model__title"
        type="text"
        :value="title"
        placeholder="Modelo / análisis de sistemas"
        @input="onTitleInput(($event.target as HTMLInputElement).value)"
      />

      <input
        class="systems-model__description"
        type="text"
        :value="description"
        placeholder="Descripción general del sistema (opcional)"
        @input="onDescriptionInput(($event.target as HTMLInputElement).value)"
      />
    </header>

    <section class="systems-model__body">
      <!-- Entradas -->
      <div class="systems-model__column systems-model__column--inputs">
        <h3 class="systems-model__column-title">Entradas</h3>
        <ul class="systems-model__list">
          <li
            v-for="(entry, index) in inputs"
            :key="`in-${index}`"
          >
            <input
              type="text"
              :value="entry"
              placeholder="Recurso / señal / factor..."
              @input="
                onInputChange(
                  index,
                  ($event.target as HTMLInputElement).value,
                )
              "
            />
          </li>
        </ul>

        <button
          type="button"
          class="systems-model__add"
          @click="addInput"
        >
          + Añadir entrada
        </button>
      </div>

      <!-- Caja negra del sistema -->
      <div class="systems-model__column systems-model__column--system">
        <div class="systems-model__box">
          <input
            class="systems-model__system-name"
            type="text"
            :value="systemName"
            placeholder="Nombre del sistema / proceso"
            @input="onSystemNameInput(($event.target as HTMLInputElement).value)"
          />
          <textarea
            class="systems-model__system-notes"
            :value="systemNotes"
            rows="3"
            placeholder="Descripción interna (opcional): componentes, restricciones, supuestos..."
            @input="
              onSystemNotesInput(($event.target as HTMLTextAreaElement).value)
            "
          />
        </div>
      </div>

      <!-- Salidas -->
      <div class="systems-model__column systems-model__column--outputs">
        <h3 class="systems-model__column-title">Salidas</h3>
        <ul class="systems-model__list">
          <li
            v-for="(output, index) in outputs"
            :key="`out-${index}`"
          >
            <input
              type="text"
              :value="output"
              placeholder="Producto / resultado / indicador..."
              @input="
                onOutputChange(
                  index,
                  ($event.target as HTMLInputElement).value,
                )
              "
            />
          </li>
        </ul>

        <button
          type="button"
          class="systems-model__add"
          @click="addOutput"
        >
          + Añadir salida
        </button>
      </div>
    </section>

    <footer class="systems-model__footer">
      Modelo de “caja negra”: relaciona entradas, sistema y salidas. Las
      extensiones hacia diagramas causales, bucles de realimentación o matrices
      de parámetros se desarrollan sobre esta base dentro de F2.11–F3.x.
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
}>()

const title = computed(
  () =>
    props.node.attrs.title ?? 'Modelo / análisis de sistemas',
)

const description = computed(
  () => props.node.attrs.description ?? '',
)

const inputs = computed<string[]>(() => {
  const raw = props.node.attrs.inputs as string[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return ['']
  }
  return raw
})

const outputs = computed<string[]>(() => {
  const raw = props.node.attrs.outputs as string[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return ['']
  }
  return raw
})

const systemName = computed(
  () => props.node.attrs.systemName ?? '',
)

const systemNotes = computed(
  () => props.node.attrs.systemNotes ?? '',
)

function onTitleInput(value: string) {
  props.updateAttributes({ title: value })
}

function onDescriptionInput(value: string) {
  props.updateAttributes({ description: value })
}

function commitInputs(next: string[]) {
  props.updateAttributes({
    inputs: next,
  })
}

function commitOutputs(next: string[]) {
  props.updateAttributes({
    outputs: next,
  })
}

function onInputChange(index: number, value: string) {
  const current = inputs.value
  const next = [...current]
  next[index] = value
  commitInputs(next)
}

function onOutputChange(index: number, value: string) {
  const current = outputs.value
  const next = [...current]
  next[index] = value
  commitOutputs(next)
}

function addInput() {
  const current = inputs.value
  const next = [...current, '']
  commitInputs(next)
}

function addOutput() {
  const current = outputs.value
  const next = [...current, '']
  commitOutputs(next)
}

function onSystemNameInput(value: string) {
  props.updateAttributes({
    systemName: value,
  })
}

function onSystemNotesInput(value: string) {
  props.updateAttributes({
    systemNotes: value,
  })
}
</script>

<style scoped>
.systems-model {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 10px 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  font-size: 12px;
  color: #111827;
}

/* Header */

.systems-model__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.systems-model__title {
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
}

.systems-model__description {
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  padding: 4px 8px;
  font-size: 12px;
}

/* Body */

.systems-model__body {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.2fr) minmax(0, 1.1fr);
  gap: 8px;
  margin-bottom: 8px;
}

/* Columns */

.systems-model__column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.systems-model__column-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

/* Inputs/outputs list */

.systems-model__list {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.systems-model__list input {
  width: 100%;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

/* Add button */

.systems-model__add {
  margin-top: 2px;
  border-radius: 999px;
  border: 1px dashed #d1d5db;
  background: #fdfbff;
  font-size: 11px;
  padding: 3px 8px;
  cursor: pointer;
  color: #4b3f72;
}

.systems-model__add:hover {
  background: #f3ecff;
  border-color: #c1b6ff;
}

/* System box */

.systems-model__box {
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  padding: 8px;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.systems-model__system-name {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  background: #ffffff;
}

.systems-model__system-notes {
  border-radius: 6px;
  border: 1px dashed #d1d5db;
  padding: 4px 8px;
  font-size: 11px;
  resize: vertical;
  background: #ffffff;
}

/* Footer */

.systems-model__footer {
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
}
</style>
