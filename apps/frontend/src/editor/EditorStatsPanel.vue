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
        <span class="stats-panel__phase">(F2.6)</span>
      </h2>
      <p class="stats-panel__subtitle">
        Crea un dataset pequeño y genera una gráfica básica usando Vega-Lite.
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
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Editor } from '@tiptap/core'

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
      row[header] = Number.isFinite(numeric) && rawValue !== '' ? numeric : rawValue
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
  // Podríamos incluir rowInfo en el futuro si se desea
  return `${base}`
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

    datasets.value.push(dataset)
    selectedDatasetId.value = dataset.id
    fieldX.value = columns[0] ?? ''
    fieldY.value = columns[1] ?? ''

    errorMessage.value = ''
  } catch (err: unknown) {
    console.error('Error al crear dataset:', err)
    errorMessage.value =
      err instanceof Error
        ? err.message
        : 'No se pudo interpretar el dataset. Revisa el formato.'
  }
}

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
    base.mark = 'bar'
    base.encoding = {
      x: { field: xField, type: 'quantitative', bin: true },
      y: { aggregate: 'count', type: 'quantitative' },
    }
  } else {
    base.mark = 'bar'
  }

  return base
}

function handleInsertChart(): void {
  const editor = props.editor
  if (!editor) return

  const spec = buildVegaLiteSpec()
  if (!spec) return

  editor
    .chain()
    .focus()
    .insertContent({
      type: 'statsChart', // nodo de @disertare/editor-ext-stats
      attrs: {
        spec,
      },
    })
    .run()
}
</script>

<style scoped>
.stats-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Encabezado */
.stats-panel__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}

.stats-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: #1e1b4b;
}

.stats-panel__phase {
  font-weight: 500;
  font-size: 12px;
  margin-left: 4px;
  color: #6b21a8;
}

.stats-panel__subtitle {
  font-size: 12px;
  color: #4b5563;
}

/* Secciones */
.stats-panel__section {
  padding-top: 8px;
  border-top: 1px solid #f3e8ff;
  margin-top: 8px;
}

.stats-panel__section:first-of-type {
  margin-top: 4px;
}

.stats-panel__section-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #4338ca;
}

.stats-panel__hint {
  margin-bottom: 8px;
  font-size: 11px;
  color: #6b7280;
}

/* Campos */
.stats-panel__label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.stats-panel__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 9px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  resize: vertical;
  background: #f9fafb;
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
</style>
