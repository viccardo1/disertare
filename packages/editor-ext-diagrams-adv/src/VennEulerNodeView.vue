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

<!-- packages/editor-ext-diagrams-adv/src/VennEulerNodeView.vue -->
<template>
  <NodeViewWrapper class="diagram-venn">
    <header class="diagram-venn__header">
      <input
        class="diagram-venn__title"
        type="text"
        :value="title"
        placeholder="Diagrama de Venn / Euler"
        @input="onTitleInput(($event.target as HTMLInputElement).value)"
      />

      <input
        class="diagram-venn__description"
        type="text"
        :value="description"
        placeholder="Descripción / contexto (opcional)"
        @input="onDescriptionInput(($event.target as HTMLInputElement).value)"
      />
    </header>

    <section class="diagram-venn__controls">
      <label class="diagram-venn__field">
        <span>Número de conjuntos (2–4)</span>
        <input
          type="number"
          min="2"
          max="4"
          :value="sets.length"
          @input="onSetCountInput(($event.target as HTMLInputElement).value)"
        />
      </label>
    </section>

    <section class="diagram-venn__body">
      <!-- Vista “diagramática” simplificada -->
      <div
        class="diagram-venn__canvas"
        :class="`diagram-venn__canvas--${sets.length}`"
      >
        <div
          v-for="(set, index) in sets"
          :key="set.id"
          class="diagram-venn__circle"
          :class="`diagram-venn__circle--${index + 1}`"
        >
          <span class="diagram-venn__circle-label">
            {{ set.label || `Conjunto ${index + 1}` }}
          </span>
        </div>
      </div>

      <!-- Configuración de conjuntos -->
      <div class="diagram-venn__sets">
        <h3 class="diagram-venn__section-title">Conjuntos</h3>
        <div
          v-for="(set, index) in sets"
          :key="set.id"
          class="diagram-venn__set-row"
        >
          <label class="diagram-venn__field diagram-venn__field--inline">
            <span>Etiqueta</span>
            <input
              type="text"
              :value="set.label"
              :placeholder="`Conjunto ${index + 1}`"
              @input="
                onSetLabelInput(
                  index,
                  ($event.target as HTMLInputElement).value,
                )
              "
            />
          </label>

          <label class="diagram-venn__field diagram-venn__field--inline">
            <span>Nota / descripción</span>
            <input
              type="text"
              :value="set.note"
              placeholder="p.ej. Estudiantes con beca"
              @input="
                onSetNoteInput(
                  index,
                  ($event.target as HTMLInputElement).value,
                )
              "
            />
          </label>
        </div>
      </div>
    </section>

    <footer class="diagram-venn__footer">
      Vista simplificada de Venn/Euler. Define de 2 a 4 conjuntos, sus nombres y
      notas. La integración con datos (cardinalidades, porcentajes) se completa
      dentro de la misma F2.11.
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

type VennSet = {
  id: string
  label: string
  note?: string
}

const DEFAULT_SETS: VennSet[] = [
  { id: 'set-a', label: 'A', note: '' },
  { id: 'set-b', label: 'B', note: '' },
  { id: 'set-c', label: 'C', note: '' },
]

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
}>()

const title = computed(
  () => props.node.attrs.title ?? 'Diagrama de Venn / Euler',
)

const description = computed(
  () => props.node.attrs.description ?? '',
)

const sets = computed<VennSet[]>(() => {
  const raw = props.node.attrs.sets as VennSet[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length < 2) {
    return DEFAULT_SETS.slice(0, 2)
  }

  return raw.map((s, index) => ({
    id: s?.id ?? `set-${index}`,
    label: s?.label ?? `Conjunto ${index + 1}`,
    note: s?.note ?? '',
  }))
})

function commitSets(next: VennSet[]) {
  props.updateAttributes({
    sets: next,
  })
}

function onTitleInput(value: string) {
  props.updateAttributes({ title: value })
}

function onDescriptionInput(value: string) {
  props.updateAttributes({ description: value })
}

function onSetCountInput(rawValue: string) {
  const current = sets.value
  let nextCount = Number.parseInt(rawValue, 10)
  if (Number.isNaN(nextCount)) return

  nextCount = Math.min(4, Math.max(2, nextCount))

  const next: VennSet[] = []

  for (let i = 0; i < nextCount; i += 1) {
    const existing = current[i]
    if (existing) {
      next.push(existing)
    } else {
      next.push({
        id: `set-${Date.now()}-${i}`,
        label: `Conjunto ${i + 1}`,
        note: '',
      })
    }
  }

  commitSets(next)
}

function onSetLabelInput(index: number, value: string) {
  const current = sets.value
  const next = [...current]
  if (!next[index]) return

  next[index] = {
    ...next[index],
    label: value,
  }

  commitSets(next)
}

function onSetNoteInput(index: number, value: string) {
  const current = sets.value
  const next = [...current]
  if (!next[index]) return

  next[index] = {
    ...next[index],
    note: value,
  }

  commitSets(next)
}
</script>

<style scoped>
.diagram-venn {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 10px 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  font-size: 12px;
  color: #111827;
}

.diagram-venn__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.diagram-venn__title {
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
}

.diagram-venn__description {
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  padding: 4px 8px;
  font-size: 12px;
}

.diagram-venn__controls {
  margin-bottom: 8px;
}

.diagram-venn__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}

.diagram-venn__field input {
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

/* Cuerpo */

.diagram-venn__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 10px;
  margin-bottom: 8px;
}

/* “Lienzo” con círculos */

.diagram-venn__canvas {
  position: relative;
  min-height: 120px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
}

/* Posiciones para 2, 3 y 4 conjuntos */

.diagram-venn__circle {
  position: absolute;
  border-radius: 999px;
  border: 1px solid #c7d2fe;
  background: rgba(219, 234, 254, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  padding: 4px;
  text-align: center;
}

.diagram-venn__circle-label {
  max-width: 70px;
}

/* 2 conjuntos */
.diagram-venn__canvas--2 .diagram-venn__circle--1 {
  width: 70px;
  height: 70px;
  left: 18%;
  top: 25%;
}

.diagram-venn__canvas--2 .diagram-venn__circle--2 {
  width: 70px;
  height: 70px;
  right: 18%;
  top: 25%;
}

/* 3 conjuntos */
.diagram-venn__canvas--3 .diagram-venn__circle--1 {
  width: 70px;
  height: 70px;
  left: 14%;
  top: 30%;
}

.diagram-venn__canvas--3 .diagram-venn__circle--2 {
  width: 70px;
  height: 70px;
  right: 14%;
  top: 30%;
}

.diagram-venn__canvas--3 .diagram-venn__circle--3 {
  width: 70px;
  height: 70px;
  left: 50%;
  transform: translateX(-50%);
  top: 10%;
}

/* 4 conjuntos - disposición aproximada */
.diagram-venn__canvas--4 .diagram-venn__circle--1 {
  width: 60px;
  height: 60px;
  left: 12%;
  top: 20%;
}

.diagram-venn__canvas--4 .diagram-venn__circle--2 {
  width: 60px;
  height: 60px;
  right: 12%;
  top: 20%;
}

.diagram-venn__canvas--4 .diagram-venn__circle--3 {
  width: 60px;
  height: 60px;
  left: 22%;
  bottom: 12%;
}

.diagram-venn__canvas--4 .diagram-venn__circle--4 {
  width: 60px;
  height: 60px;
  right: 22%;
  bottom: 12%;
}

/* Config de conjuntos */

.diagram-venn__sets {
  font-size: 11px;
}

.diagram-venn__section-title {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

.diagram-venn__set-row {
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 6px;
  margin-bottom: 4px;
  background: #fdfbff;
}

.diagram-venn__field--inline {
  flex-direction: column;
  gap: 2px;
  margin-bottom: 2px;
}

.diagram-venn__footer {
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
}
</style>
