<!-- apps/frontend/src/editor/EditorStatsPanel.vue -->
<template>
  <aside
    class="stats-panel"
    role="complementary"
    aria-label="Datos y Estadística"
  >
    <header class="stats-panel__header">
      <h2 class="stats-panel__title">
        Datos y Estadística
        <span class="stats-panel__phase">(F2.6 / F2.19)</span>
      </h2>
      <p class="stats-panel__subtitle">
        Crea un dataset pequeño, genera una gráfica básica con Vega-Lite
        y ajusta el layout de columnas por sección de texto.
      </p>
    </header>

    <!-- 1) Dataset rápido -->
    <section class="stats-panel__section">
      <h3 class="stats-panel__section-title">1) Dataset rápido</h3>
      <p class="stats-panel__hint">
        Pega datos como <strong>CSV</strong> (primera línea = encabezados)
        o un arreglo <strong>JSON</strong> de objetos.
      </p>

      <label
        class="stats-panel__label"
        for="stats-raw-input"
      >
        Datos
      </label>
      <textarea
        id="stats-raw-input"
        v-model="rawInput"
        class="stats-panel__textarea"
        rows="6"
        spellcheck="false"
        placeholder="Ejemplo CSV:
categoria,valor
A,10
B,20
C,15

Ejemplo JSON:
[
  { &quot;grupo&quot;: &quot;Control&quot;, &quot;peso&quot;: 72 },
  { &quot;grupo&quot;: &quot;Experimental&quot;, &quot;peso&quot;: 80 }
]"
      />

      <label
        class="stats-panel__label"
        for="stats-dataset-name"
      >
        Nombre del dataset
      </label>
      <input
        id="stats-dataset-name"
        v-model="datasetName"
        class="stats-panel__input"
        type="text"
        placeholder="Ej. Encuesta rápida"
      />

      <button
        type="button"
        class="stats-panel__button stats-panel__button-primary"
        @click="handleCreateDataset"
      >
        Crear dataset
      </button>

      <p
        v-if="errorMessage"
        class="stats-panel__error"
      >
        {{ errorMessage }}
      </p>
    </section>

    <!-- 2) Datasets disponibles -->
    <section class="stats-panel__section">
      <h3 class="stats-panel__section-title">2) Datasets disponibles</h3>

      <p
        v-if="datasets.length === 0"
        class="stats-panel__hint"
      >
        Aún no hay datasets. Crea uno en el paso anterior.
      </p>

      <ul
        v-else
        class="stats-panel__dataset-list"
      >
        <li
          v-for="dataset in datasets"
          :key="dataset.id"
          class="stats-panel__dataset-item"
        >
          <label class="stats-panel__dataset-label">
            <input
              v-model="selectedDatasetId"
              class="stats-panel__radio"
              type="radio"
              :value="dataset.id"
            />
            <span class="stats-panel__dataset-name">
              {{ dataset.displayName }}
            </span>
            <span class="stats-panel__dataset-meta">
              {{ dataset.columns.length }} columnas ·
              {{ dataset.rows.length }} filas
            </span>
          </label>
        </li>
      </ul>
    </section>

    <!-- 3) Configurar gráfica -->
    <section class="stats-panel__section">
      <h3 class="stats-panel__section-title">3) Configurar gráfica</h3>

      <div class="stats-panel__field-row">
        <label
          class="stats-panel__label"
          for="stats-chart-type"
        >
          Tipo de gráfica
        </label>
        <select
          id="stats-chart-type"
          v-model="chartType"
          class="stats-panel__select"
        >
          <option value="bar">Barras</option>
          <option value="line">Línea</option>
          <option value="histogram">Histograma</option>
        </select>
      </div>

      <div class="stats-panel__field-row">
        <label
          class="stats-panel__label"
          for="stats-field-x"
        >
          Campo X
        </label>
        <select
          id="stats-field-x"
          v-model="fieldX"
          class="stats-panel__select"
        >
          <option
            disabled
            value=""
          >
            Selecciona
          </option>
          <option
            v-for="column in activeColumns"
            :key="`x-${column}`"
            :value="column"
          >
            {{ column }}
          </option>
        </select>
      </div>

      <div class="stats-panel__field-row">
        <label
          class="stats-panel__label"
          for="stats-field-y"
        >
          Campo Y
        </label>
        <select
          id="stats-field-y"
          v-model="fieldY"
          class="stats-panel__select"
        >
          <option
            disabled
            value=""
          >
            Selecciona
          </option>
          <option
            v-for="column in activeColumns"
            :key="`y-${column}`"
            :value="column"
          >
            {{ column }}
          </option>
        </select>
      </div>

      <label
        class="stats-panel__label"
        for="stats-chart-title"
      >
        Título de la gráfica (opcional)
      </label>
      <input
        id="stats-chart-title"
        v-model="chartTitle"
        class="stats-panel__input"
        type="text"
        placeholder="Ej. Distribución de respuestas"
      />

      <button
        type="button"
        class="stats-panel__button stats-panel__button-primary stats-panel__button-full"
        :disabled="!canInsertChart"
        @click="handleInsertChart"
      >
        Insertar gráfica en el documento
      </button>
    </section>

    <!-- 4) Layout de columnas (F2.19) -->
    <section class="stats-panel__section">
      <h3 class="stats-panel__section-title">
        4) Layout de columnas (F2.19)
      </h3>
      <p class="stats-panel__hint">
        Ajusta el número de columnas para la sección de texto actual.
        La conversión a texto continuo conserva el contenido y el orden lógico.
      </p>

      <div class="stats-panel__field-row stats-panel__layout-row">
        <label class="stats-panel__layout-checkbox">
          <input
            v-model="layoutColumnsEnabled"
            type="checkbox"
          />
          <span>Activar columnas en esta sección de texto</span>
        </label>
      </div>

      <div
        class="stats-panel__field-row"
        :class="{ 'stats-panel__field-row--disabled': !layoutColumnsEnabled }"
      >
        <label
          class="stats-panel__label"
          for="layout-columns-count"
        >
          Número de columnas
        </label>
        <select
          id="layout-columns-count"
          v-model.number="layoutColumnsCount"
          class="stats-panel__select"
          :disabled="!layoutColumnsEnabled"
        >
          <option :value="2">2 columnas</option>
          <option :value="3">3 columnas</option>
          <option :value="4">4 columnas</option>
        </select>
      </div>

      <div
        class="stats-panel__field-row"
        :class="{ 'stats-panel__field-row--disabled': !layoutColumnsEnabled }"
      >
        <label
          class="stats-panel__label"
          for="layout-columns-gutter"
        >
          Separación entre columnas (px)
        </label>
        <input
          id="layout-columns-gutter"
          v-model.number="layoutColumnsGutter"
          class="stats-panel__input"
          type="number"
          min="0"
          max="96"
          step="2"
          :disabled="!layoutColumnsEnabled"
        />
      </div>

      <div class="stats-panel__layout-actions">
        <button
          type="button"
          class="stats-panel__button stats-panel__button-primary"
          :disabled="!props.editor"
          @click="applyLayoutColumns"
        >
          Aplicar a sección actual
        </button>

        <button
          type="button"
          class="stats-panel__button stats-panel__button-secondary"
          :disabled="!props.editor"
          @click="resetToContinuousText"
        >
          Convertir a texto continuo
        </button>
      </div>

      <p class="stats-panel__hint stats-panel__hint-small">
        Las columnas se guardan como <code>layout.columns</code> en la sección.
        Si no hay columnas activas, el texto se comporta como una sola columna.
      </p>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Editor } from '@tiptap/core'
import {
  registerDataset,
  type StatsDataset,
  type StatsFieldDef,
  type StatsColumnKind,
} from '@disertare/editor-ext-stats-adv'

interface Dataset {
  id: string
  name: string
  displayName: string
  raw: string
  rows: Record<string, unknown>[]
  columns: string[]
}

const props = defineProps<{
  editor: Editor | null
}>()

const rawInput = ref('')
const datasetName = ref('')
const errorMessage = ref('')

const datasets = ref<Dataset[]>([])
const selectedDatasetId = ref<string | null>(null)

const chartType = ref<'bar' | 'line' | 'histogram'>('bar')
const fieldX = ref('')
const fieldY = ref('')
const chartTitle = ref('')

// F2.19 — layout de columnas por sección
const layoutColumnsEnabled = ref(false)
const layoutColumnsCount = ref(2)
const layoutColumnsGutter = ref(24)

const selectedDataset = computed<Dataset | null>(() => {
  return datasets.value.find(d => d.id === selectedDatasetId.value) ?? null
})

const activeColumns = computed<string[]>(() => {
  return selectedDataset.value?.columns ?? []
})

const canInsertChart = computed<boolean>(() => {
  return !!(
    props.editor &&
    selectedDataset.value &&
    fieldX.value &&
    fieldY.value
  )
})

function parseCsv(text: string): Dataset['rows'] {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
  const headerLine = lines.find(line => line.length > 0)
  if (!headerLine) {
    throw new Error('No se encontraron encabezados.')
  }

  const headerIndex = lines.indexOf(headerLine)
  const headers = headerLine.split(',').map(h => h.trim())

  const dataLines = lines.slice(headerIndex + 1).filter(line => line.length > 0)

  const rows: Dataset['rows'] = dataLines.map(line => {
    const values = line.split(',')
    const row: Record<string, unknown> = {}
    headers.forEach((header, idx) => {
      const rawValue = (values[idx] ?? '').trim()
      const numeric = Number(rawValue)
      row[header] =
        Number.isFinite(numeric) && rawValue !== '' ? numeric : rawValue
    })
    return row
  })

  return rows
}

function parseJson(text: string): Dataset['rows'] {
  const value = JSON.parse(text)
  if (!Array.isArray(value)) {
    throw new Error('El JSON debe ser un arreglo de objetos.')
  }
  return value as Dataset['rows']
}

function normaliseDatasetName(name: string, rows: Dataset['rows']): string {
  const base = name.trim() || 'Dataset sin nombre'
  const _rowInfo = rows.length === 1 ? '1 fila' : `${rows.length} filas`
  // Por ahora no mostramos rowInfo, pero lo podríamos usar en el futuro.
  return `${base}`
}

/**
 * F2.17 — inferencia muy simple del tipo de columna para registrar en stats-adv.
 */
function inferKindForField(
  field: string,
  sampleValues: unknown[],
): StatsColumnKind {
  const lower = field.toLowerCase()

  if (/(fecha|date|time|timestamp)/.test(lower)) return 'datetime'

  let numericCount = 0
  let stringCount = 0

  for (const v of sampleValues.slice(0, 20)) {
    if (typeof v === 'number') {
      numericCount += 1
    } else if (typeof v === 'string') {
      stringCount += 1
    }
  }

  if (numericCount > 0 && stringCount === 0) {
    return 'numeric'
  }

  return 'categorical'
}

/**
 * ¿Esta columna es numérica (todos los valores son number o null/undefined)?
 * Se usa para decidir si un "histograma" es realmente binning numérico
 * o si degradamos a barras de conteo por categoría.
 */
function isNumericFieldForDataset(dataset: Dataset, field: string): boolean {
  let hasNumeric = false
  for (const row of dataset.rows) {
    const value = row[field]
    if (value == null) continue
    if (typeof value === 'number' && Number.isFinite(value)) {
      hasNumeric = true
      continue
    }
    // Encontramos algo que NO es número → no tratamos como numérico
    return false
  }
  return hasNumeric
}

/**
 * Registra el dataset F2.6 en el motor F2.17 (`@disertare/editor-ext-stats-adv`)
 * para que el panel de Análisis avanzado pueda reutilizarlo.
 */
function registerDatasetForAdvancedStats(dataset: Dataset): void {
  const rows = dataset.rows
  const columns = dataset.columns

  const fields: StatsFieldDef[] = columns.map(col => {
    const sampleValues = rows.map(row => row[col])
    return {
      key: col,
      label: col,
      kind: inferKindForField(col, sampleValues),
    }
  })

  const advDataset: StatsDataset = {
    id: dataset.id,
    label: dataset.name,
    description: dataset.displayName,
    rows,
    fields,
  }

  registerDataset(advDataset)
}

function handleCreateDataset(): void {
  const source = rawInput.value.trim()
  if (!source) {
    errorMessage.value = 'Escribe o pega datos antes de crear el dataset.'
    return
  }

  try {
    let rows: Dataset['rows']
    if (source.trim().startsWith('[')) {
      rows = parseJson(source)
    } else {
      rows = parseCsv(source)
    }

    if (!rows.length || typeof rows[0] !== 'object') {
      throw new Error('No se pudieron detectar filas válidas.')
    }

    const columns = Object.keys(rows[0] as Record<string, unknown>)
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const name = datasetName.value.trim() || 'Dataset sin nombre'

    const dataset: Dataset = {
      id,
      name,
      displayName: normaliseDatasetName(name, rows),
      raw: source,
      rows,
      columns,
    }

    // 1) Registrar en la UI básica (F2.6)
    datasets.value.push(dataset)
    selectedDatasetId.value = dataset.id
    fieldX.value = columns[0] ?? ''
    fieldY.value = columns[1] ?? ''

    // 2) Registrar en el motor avanzado (F2.17)
    registerDatasetForAdvancedStats(dataset)

    errorMessage.value = ''
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error al crear dataset:', err)
    errorMessage.value =
      err instanceof Error
        ? err.message
        : 'No se pudo interpretar el dataset. Revisa el formato.'
  }
}

/**
 * Construye el spec Vega-Lite básico F2.6, con defensas:
 * - "line" y "bar" siguen igual.
 * - "histogram":
 *    - si X es numérico → binning real (histograma clásico);
 *    - si X NO es numérico → barras de conteo por categoría.
 */
function buildVegaLiteSpec() {
  const dataset = selectedDataset.value
  if (!dataset) return null

  const xField = fieldX.value
  const yField = fieldY.value
  if (!xField || !yField) return null

  const base: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: dataset.rows },
    title: chartTitle.value || dataset.name,
    encoding: {
      x: { field: xField },
      y: { field: yField },
    },
  }

  if (chartType.value === 'line') {
    base.mark = 'line'
  } else if (chartType.value === 'histogram') {
    const isNumeric = isNumericFieldForDataset(dataset, xField)

    if (isNumeric) {
      // Histograma numérico clásico
      base.mark = 'bar'
      base.encoding = {
        x: { field: xField, type: 'quantitative', bin: true },
        y: { aggregate: 'count', type: 'quantitative' },
      }
    } else {
      // Degradamos a barras por categoría:
      // Conteo de registros por valor distinto de X.
      base.mark = 'bar'
      base.encoding = {
        x: { field: xField, type: 'nominal' },
        y: { aggregate: 'count', type: 'quantitative' },
      }
    }
  } else {
    base.mark = 'bar'
  }

  return base
}

/**
 * F2.6 → usa el comando insertStatsChart del nodo statsChart (editor-ext-stats).
 * Ahora le pasamos también datasetId para que F2.17 pueda trazar el origen.
 */
function handleInsertChart(): void {
  const editor = props.editor
  if (!editor) return

  const spec = buildVegaLiteSpec()
  if (!spec) return

  const dataset = selectedDataset.value
  const title =
    chartTitle.value.trim() || dataset?.name || 'Gráfico sin título'

  // @ts-expect-error – comando extendido por la extensión statsChart
  editor.commands.insertStatsChart({
    title,
    spec,
    datasetId: dataset ? dataset.id : null,
    recipe: null,
    fields: null,
  })
}

/**
 * F2.19 — aplica layout.columns a la sección de texto actual.
 * Asume que el nodo de sección se llama `pageSection` y expone
 * un atributo `layout` con subcampo `columns: { count, gutter }`.
 */
function applyLayoutColumns(): void {
  const editor = props.editor
  if (!editor) return

  // Si no está activado, lo tratamos como "texto continuo"
  if (!layoutColumnsEnabled.value) {
    resetToContinuousText()
    return
  }

  const count = layoutColumnsCount.value
  const gutter = layoutColumnsGutter.value

  if (!Number.isFinite(count) || count < 2) {
    // Columna única → equivalente a texto continuo
    resetToContinuousText()
    return
  }

  editor
    .chain()
    .focus()
    .updateAttributes('pageSection', {
      layout: {
        columns: {
          count,
          gutter,
        },
      },
    })
    .run()
}

/**
 * F2.19 — elimina layout.columns, devolviendo la sección a texto continuo.
 */
function resetToContinuousText(): void {
  const editor = props.editor
  if (!editor) return

  // Intentamos respetar otros posibles subatributos de layout.
  const current = editor.getAttributes('pageSection') as {
    layout?: { columns?: unknown; [key: string]: unknown }
  }

  const nextLayout: Record<string, unknown> = { ...(current.layout ?? {}) }
  delete nextLayout.columns

  const hasOtherLayoutKeys = Object.keys(nextLayout).length > 0

  editor
    .chain()
    .focus()
    .updateAttributes('pageSection', {
      layout: hasOtherLayoutKeys ? nextLayout : null,
    })
    .run()

  // Sincronizamos el estado local del panel
  layoutColumnsEnabled.value = false
}
</script>

<style scoped>
.stats-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.stats-panel__header {
  padding: 0.75rem 0.75rem 0.5rem;
}

.stats-panel__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-panel__phase {
  font-size: 11px;
  font-weight: 500;
  color: #4b5563;
  background: #eef2ff;
  padding: 2px 6px;
  border-radius: 999px;
}

.stats-panel__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #4b5563;
}

.stats-panel__section {
  padding: 0.5rem 0.75rem 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.stats-panel__section-title {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.stats-panel__hint {
  margin: 0 0 6px;
  font-size: 11px;
  color: #6b7280;
}

.stats-panel__hint-small {
  margin-top: 4px;
  font-size: 10px;
}

.stats-panel__label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.stats-panel__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 9px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 11px;
  resize: vertical;
  min-height: 120px;
  margin-bottom: 8px;
}

.stats-panel__input,
.stats-panel__select {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 9px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 12px;
  background: #ffffff;
  margin-bottom: 8px;
}

.stats-panel__select {
  cursor: pointer;
}

/* Botones */
.stats-panel__button {
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease,
    background-color 0.1s ease;
}

.stats-panel__button-primary {
  background: #4f46e5;
  color: #ffffff;
  box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
}

.stats-panel__button-primary:disabled {
  opacity: 0.5;
  cursor: default;
  box-shadow: none;
}

.stats-panel__button-primary:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(79, 70, 229, 0.35);
}

.stats-panel__button-secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  box-shadow: none;
}

.stats-panel__button-secondary:hover {
  background: #f9fafb;
}

.stats-panel__button-full {
  width: 100%;
  margin-top: 4px;
}

/* Errores */
.stats-panel__error {
  margin-top: 6px;
  font-size: 11px;
  color: #b91c1c;
}

/* Lista de datasets */
.stats-panel__dataset-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stats-panel__dataset-item {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
  background: #f9fafb;
}

.stats-panel__dataset-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}

.stats-panel__radio {
  margin-right: 6px;
}

.stats-panel__dataset-name {
  font-size: 12px;
  font-weight: 500;
  color: #111827;
}

.stats-panel__dataset-meta {
  font-size: 11px;
  color: #6b7280;
}

.stats-panel__field-row {
  margin-bottom: 6px;
}

.stats-panel__field-row--disabled {
  opacity: 0.5;
}

/* Layout F2.19 */
.stats-panel__layout-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stats-panel__layout-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #374151;
}

.stats-panel__layout-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}
</style>
