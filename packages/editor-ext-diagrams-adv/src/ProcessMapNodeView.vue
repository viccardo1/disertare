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

<!-- packages/editor-ext-diagrams-adv/src/ProcessMapNodeView.vue -->
<template>
  <NodeViewWrapper class="process-map">
    <header class="process-map__header">
      <input
        class="process-map__title"
        type="text"
        :value="title"
        placeholder="Mapa de procesos"
        @input="onTitleInput(($event.target as HTMLInputElement).value)"
      />

      <input
        class="process-map__description"
        type="text"
        :value="description"
        placeholder="Proceso / alcance (opcional)"
        @input="onDescriptionInput(($event.target as HTMLInputElement).value)"
      />
    </header>

    <section class="process-map__canvas">
      <div class="process-map__flow">
        <template
          v-for="(step, index) in steps"
          :key="step.id"
        >
          <div
            class="process-map__step"
            :class="`process-map__step--${step.type}`"
          >
            <div class="process-map__step-label">
              {{ step.label || defaultLabelForType(step.type, index) }}
            </div>
          </div>

          <div
            v-if="index < steps.length - 1"
            class="process-map__arrow"
          >
            <span>➜</span>
          </div>
        </template>
      </div>
    </section>

    <section class="process-map__editor">
      <h3 class="process-map__section-title">
        Pasos del proceso
      </h3>

      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="process-map__step-row"
      >
        <div class="process-map__step-row-main">
          <select
            class="process-map__select"
            :value="step.type"
            @change="
              onStepTypeChange(
                index,
                ($event.target as HTMLSelectElement).value as any,
              )
            "
          >
            <option value="start">Inicio / entrada</option>
            <option value="process">Actividad / tarea</option>
            <option value="decision">Decisión</option>
            <option value="end">Fin / salida</option>
          </select>

          <input
            class="process-map__input"
            type="text"
            :value="step.label"
            :placeholder="defaultLabelForType(step.type, index)"
            @input="
              onStepLabelInput(
                index,
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>

        <button
          type="button"
          class="process-map__remove"
          @click="removeStep(index)"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        class="process-map__add-step"
        @click="addStep"
      >
        + Añadir paso
      </button>
    </section>

    <footer class="process-map__footer">
      Mapa de procesos simplificado (BPMN-lite). Ajusta el tipo de cada paso
      (inicio, actividad, decisión, fin) y sus etiquetas para documentar el flujo.
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

type StepType = 'start' | 'process' | 'decision' | 'end'

type ProcessStep = {
  id: string
  type: StepType
  label: string
}

const DEFAULT_STEPS: ProcessStep[] = [
  { id: 's-1', type: 'start', label: 'Inicio' },
  { id: 's-2', type: 'process', label: 'Actividad principal' },
  { id: 's-3', type: 'end', label: 'Fin' },
]

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
}>()

const title = computed(
  () => props.node.attrs.title ?? 'Mapa de procesos',
)

const description = computed(
  () => props.node.attrs.description ?? '',
)

const steps = computed<ProcessStep[]>(() => {
  const raw = props.node.attrs.steps as ProcessStep[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_STEPS
  }

  return raw.map((s, index) => ({
    id: s?.id ?? `step-${index}`,
    type: (s?.type as StepType) || 'process',
    label: s?.label ?? '',
  }))
})

function commitSteps(next: ProcessStep[]) {
  props.updateAttributes({
    steps: next,
  })
}

function onTitleInput(value: string) {
  props.updateAttributes({ title: value })
}

function onDescriptionInput(value: string) {
  props.updateAttributes({ description: value })
}

function defaultLabelForType(type: StepType, index: number): string {
  switch (type) {
    case 'start':
      return 'Inicio'
    case 'process':
      return `Actividad ${index + 1}`
    case 'decision':
      return 'Decisión'
    case 'end':
      return 'Fin'
    default:
      return `Paso ${index + 1}`
  }
}

function addStep() {
  const current = steps.value
  const next: ProcessStep[] = [
    ...current,
    {
      id: `step-${Date.now()}`,
      type: 'process',
      label: '',
    },
  ]
  commitSteps(next)
}

function removeStep(index: number) {
  const current = steps.value
  if (current.length <= 1) return
  const next = [...current]
  next.splice(index, 1)
  commitSteps(next)
}

function onStepTypeChange(index: number, type: StepType) {
  const current = steps.value
  const next = [...current]
  if (!next[index]) return
  next[index] = {
    ...next[index],
    type,
  }
  commitSteps(next)
}

function onStepLabelInput(index: number, value: string) {
  const current = steps.value
  const next = [...current]
  if (!next[index]) return
  next[index] = {
    ...next[index],
    label: value,
  }
  commitSteps(next)
}
</script>

<style scoped>
.process-map {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 10px 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  font-size: 12px;
  color: #111827;
}

.process-map__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.process-map__title {
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
}

.process-map__description {
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  padding: 4px 8px;
  font-size: 12px;
}

/* Canvas */

.process-map__canvas {
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
  background: #f9fafb;
  padding: 8px;
  margin-bottom: 8px;
  overflow-x: auto;
}

.process-map__flow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Steps */

.process-map__step {
  min-width: 70px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  font-size: 11px;
  text-align: center;
}

.process-map__step--start {
  border-radius: 999px;
  border-color: #22c55e;
  background: #ecfdf3;
}

.process-map__step--end {
  border-radius: 999px;
  border-color: #ef4444;
  background: #fef2f2;
}

.process-map__step--decision {
  border-style: dashed;
  border-color: #f97316;
  background: #fff7ed;
}

.process-map__step--process {
  border-color: #60a5fa;
  background: #eff6ff;
}

.process-map__step-label {
  white-space: nowrap;
}

/* Arrow */

.process-map__arrow {
  font-size: 14px;
  color: #4b5563;
}

/* Editor de pasos */

.process-map__editor {
  margin-bottom: 4px;
}

.process-map__section-title {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

.process-map__step-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.process-map__step-row-main {
  display: flex;
  flex: 1;
  gap: 4px;
}

.process-map__select {
  flex: 0 0 140px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

.process-map__input {
  flex: 1;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

.process-map__remove {
  border-radius: 999px;
  border: 1px solid #fee2e2;
  background: #fef2f2;
  color: #b91c1c;
  width: 20px;
  height: 20px;
  font-size: 11px;
  cursor: pointer;
}

.process-map__add-step {
  margin-top: 4px;
  border-radius: 999px;
  border: 1px dashed #d1d5db;
  background: #fdfbff;
  font-size: 11px;
  padding: 3px 8px;
  cursor: pointer;
  color: #4b3f72;
}

.process-map__add-step:hover {
  background: #f3ecff;
  border-color: #c1b6ff;
}

/* Footer */

.process-map__footer {
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
}
</style>
