<!-- packages/editor-ext-diagrams-adv/src/RiskMatrixNodeView.vue -->
<template>
  <NodeViewWrapper class="risk-matrix">
    <header class="risk-matrix__header">
      <input
        class="risk-matrix__title"
        type="text"
        :value="title"
        placeholder="Matriz de riesgo"
        @input="onTitleInput(($event.target as HTMLInputElement).value)"
      />

      <input
        class="risk-matrix__description"
        type="text"
        :value="description"
        placeholder="Proyecto / proceso / contexto (opcional)"
        @input="onDescriptionInput(($event.target as HTMLInputElement).value)"
      />
    </header>

    <section class="risk-matrix__axes">
      <div class="risk-matrix__axis-group">
        <h3>Probabilidad (eje Y)</h3>
        <div
          v-for="(level, index) in probLevels"
          :key="`p-${index}`"
          class="risk-matrix__axis-field"
        >
          <span>{{ probLevels.length - index }}</span>
          <input
            type="text"
            :value="level"
            placeholder="Nivel"
            @input="
              onProbLevelInput(
                index,
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>
      </div>

      <div class="risk-matrix__axis-group">
        <h3>Impacto (eje X)</h3>
        <div
          v-for="(level, index) in impactLevels"
          :key="`i-${index}`"
          class="risk-matrix__axis-field risk-matrix__axis-field--horizontal"
        >
          <span>{{ index + 1 }}</span>
          <input
            type="text"
            :value="level"
            placeholder="Nivel"
            @input="
              onImpactLevelInput(
                index,
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>
      </div>
    </section>

    <section class="risk-matrix__grid-wrapper">
      <div class="risk-matrix__grid">
        <!-- Encabezado horizontal (impacto) -->
        <div class="risk-matrix__grid-cell risk-matrix__grid-cell--corner" />
        <div
          v-for="(impact, iIndex) in impactLevels"
          :key="`head-x-${iIndex}`"
          class="risk-matrix__grid-cell risk-matrix__grid-cell--header"
        >
          {{ iIndex + 1 }}
        </div>

        <!-- Filas (probabilidad) + celdas -->
        <template
          v-for="(prob, pIndex) in probLevels"
          :key="`row-${pIndex}`"
        >
          <div class="risk-matrix__grid-cell risk-matrix__grid-cell--header">
            {{ probLevels.length - pIndex }}
          </div>

          <button
            v-for="(impact, iIndex) in impactLevels"
            :key="`cell-${pIndex}-${iIndex}`"
            type="button"
            class="risk-matrix__grid-cell risk-matrix__grid-cell--data"
            :class="{
              'risk-matrix__grid-cell--selected':
                selectedCell &&
                selectedCell.row === pIndex &&
                selectedCell.col === iIndex,
            }"
            @click="onCellClick(pIndex, iIndex)"
          >
            {{ riskLevelLabel(pIndex, iIndex) }}
          </button>
        </template>
      </div>
    </section>

    <section class="risk-matrix__summary">
      <label class="risk-matrix__field">
        <span>Riesgo principal (descripción)</span>
        <input
          type="text"
          :value="mainRiskDescription"
          placeholder="Ej. Retraso en la entrega por falta de recursos..."
          @input="
            onMainRiskDescriptionInput(
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </label>

      <p class="risk-matrix__hint">
        Celda seleccionada:
        <strong v-if="selectedCell">
          Prob. {{ probLabelByIndex(selectedCell.row) }} /
          Impacto {{ impactLabelByIndex(selectedCell.col) }}
        </strong>
        <span v-else>ninguna celda seleccionada.</span>
      </p>
    </section>

    <footer class="risk-matrix__footer">
      Matriz Probabilidad × Impacto editable. Los niveles pueden adaptarse al
      contexto (docente, ingeniería, institucional). La cuantificación detallada
      y vínculo con datos se completa dentro de F2.11.
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

const DEFAULT_PROB_LEVELS = [
  'Muy baja',
  'Baja',
  'Media',
  'Alta',
  'Muy alta',
]

const DEFAULT_IMPACT_LEVELS = [
  'Muy bajo',
  'Bajo',
  'Medio',
  'Alto',
  'Muy alto',
]

type SelectedCell = {
  row: number
  col: number
}

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
}>()

const title = computed(
  () => props.node.attrs.title ?? 'Matriz de riesgo',
)

const description = computed(
  () => props.node.attrs.description ?? '',
)

const probLevels = computed<string[]>(() => {
  const raw = props.node.attrs.probLevels as string[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_PROB_LEVELS]
  }
  return raw
})

const impactLevels = computed<string[]>(() => {
  const raw = props.node.attrs.impactLevels as string[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_IMPACT_LEVELS]
  }
  return raw
})

const selectedCell = computed<SelectedCell | null>(() => {
  const cell = props.node.attrs.selectedCell as SelectedCell | undefined
  if (!cell) return null
  if (
    typeof cell.row !== 'number' ||
    typeof cell.col !== 'number'
  ) {
    return null
  }
  return cell
})

const mainRiskDescription = computed(
  () =>
    props.node.attrs.mainRiskDescription ??
    '',
)

function onTitleInput(value: string) {
  props.updateAttributes({ title: value })
}

function onDescriptionInput(value: string) {
  props.updateAttributes({ description: value })
}

function commitProbLevels(next: string[]) {
  props.updateAttributes({
    probLevels: next,
  })
}

function commitImpactLevels(next: string[]) {
  props.updateAttributes({
    impactLevels: next,
  })
}

function onProbLevelInput(index: number, value: string) {
  const current = probLevels.value
  const next = [...current]
  if (!next[index]) return
  next[index] = value
  commitProbLevels(next)
}

function onImpactLevelInput(index: number, value: string) {
  const current = impactLevels.value
  const next = [...current]
  if (!next[index]) return
  next[index] = value
  commitImpactLevels(next)
}

function onCellClick(row: number, col: number) {
  props.updateAttributes({
    selectedCell: { row, col },
  })
}

function onMainRiskDescriptionInput(value: string) {
  props.updateAttributes({
    mainRiskDescription: value,
  })
}

function probLabelByIndex(rowIndex: number): string {
  const levels = probLevels.value
  const effectiveIndex = rowIndex
  return levels[effectiveIndex] ?? `${rowIndex + 1}`
}

function impactLabelByIndex(colIndex: number): string {
  const levels = impactLevels.value
  return levels[colIndex] ?? `${colIndex + 1}`
}

/**
 * Etiqueta de severidad (simple) basada en posición.
 * F2.11: lógica ligera, sin cálculos complejos.
 */
function riskLevelLabel(rowIndex: number, colIndex: number): string {
  const maxRow = probLevels.value.length - 1
  const maxCol = impactLevels.value.length - 1

  const normalizedRow = rowIndex / maxRow
  const normalizedCol = colIndex / maxCol
  const score = (normalizedRow + normalizedCol) / 2

  if (score < 0.33) return 'Bajo'
  if (score < 0.66) return 'Medio'
  return 'Alto'
}
</script>

<style scoped>
.risk-matrix {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 10px 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  font-size: 12px;
  color: #111827;
}

.risk-matrix__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.risk-matrix__title {
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
}

.risk-matrix__description {
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  padding: 4px 8px;
  font-size: 12px;
}

/* Ejes */

.risk-matrix__axes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.risk-matrix__axis-group h3 {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

.risk-matrix__axis-field {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
  font-size: 11px;
}

.risk-matrix__axis-field span {
  display: inline-flex;
  width: 16px;
  justify-content: center;
  color: #6b7280;
}

.risk-matrix__axis-field input {
  flex: 1;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

.risk-matrix__axis-field--horizontal span {
  width: 18px;
}

/* Grid */

.risk-matrix__grid-wrapper {
  overflow-x: auto;
  margin-bottom: 8px;
}

.risk-matrix__grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  border-collapse: collapse;
  border: 1px solid #e5e7eb;
}

.risk-matrix__grid-cell {
  min-width: 40px;
  min-height: 24px;
  font-size: 11px;
  padding: 3px 4px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

/* Esquina */

.risk-matrix__grid-cell--corner {
  background: #f9fafb;
}

/* Encabezados */

.risk-matrix__grid-cell--header {
  background: #f3f4f6;
  font-weight: 600;
  color: #4b5563;
}

/* Celdas de datos */

.risk-matrix__grid-cell--data {
  background: #ffffff;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  transition:
    background 0.12s ease,
    border-color 0.12s ease,
    box-shadow 0.12s ease;
}

.risk-matrix__grid-cell--data:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.risk-matrix__grid-cell--selected {
  background: #fee2e2;
  border-color: #f97373;
  box-shadow: 0 0 0 1px #fecaca;
}

/* Resumen */

.risk-matrix__summary {
  margin-bottom: 4px;
}

.risk-matrix__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}

.risk-matrix__field input {
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

.risk-matrix__hint {
  margin: 4px 0 0;
  font-size: 10px;
  color: #6b7280;
}

/* Footer */

.risk-matrix__footer {
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
}
</style>
