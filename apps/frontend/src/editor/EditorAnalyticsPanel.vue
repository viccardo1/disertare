<!-- apps/frontend/src/editor/EditorAnalyticsPanel.vue -->
<template>
  <aside
    class="stats-panel analytics-panel"
    role="complementary"
    aria-label="Bitácora analítica"
  >
    <!-- Encabezado -->
    <header class="stats-panel__header">
      <h2 class="stats-panel__title">
        Bitácora analítica
        <span class="stats-panel__phase">(F2.18)</span>
      </h2>
      <p class="stats-panel__subtitle">
        Resume los gráficos estadísticos del documento y su origen de datos
        usando los metadatos de <code>statsChart</code> y
        <code>editor-ext-stats-adv</code>.
      </p>
    </header>

    <!-- Contenido principal -->
    <main class="stats-panel__body analytics-panel__body">
      <!-- Resumen general -->
      <section class="stats-panel__section">
        <div class="analytics-panel__section-header">
          <h3 class="stats-panel__section-title">
            1. Resumen del documento
          </h3>
          <button
            type="button"
            class="stats-panel__button stats-panel__button-primary"
            @click="handleRefresh"
          >
            Actualizar desde el documento
          </button>
        </div>

        <p class="stats-panel__hint">
          Se analizan los nodos <code>statsChart</code> presentes en el
          documento actual para construir una bitácora mínima de análisis.
        </p>

        <ul class="analytics-panel__summary-list">
          <li>
            <strong>{{ totalCharts }}</strong>
            gráficos estadísticos detectados.
          </li>
          <li>
            <strong>{{ datasetsSummary.length }}</strong>
            dataset(s) referenciado(s).
          </li>
          <li v-if="lastUpdated">
            Última actualización:
            <span class="analytics-panel__timestamp">
              {{ formatTimestamp(lastUpdated) }}
            </span>
          </li>
        </ul>
      </section>

      <!-- Resumen por dataset -->
      <section class="stats-panel__section">
        <h3 class="stats-panel__section-title">
          2. Datasets involucrados
        </h3>

        <p
          v-if="datasetsSummary.length === 0"
          class="stats-panel__hint"
        >
          Aún no hay datasets asociados a gráficos. Crea algún gráfico desde el
          panel de <strong>Datos y Estadística</strong> o
          <strong>Análisis avanzado</strong>.
        </p>

        <ul
          v-else
          class="analytics-panel__dataset-list"
        >
          <li
            v-for="ds in datasetsSummary"
            :key="ds.datasetId"
            class="analytics-panel__dataset-item"
          >
            <div class="analytics-panel__dataset-main">
              <span class="analytics-panel__dataset-label">
                {{ ds.label }}
              </span>
              <span class="analytics-panel__dataset-meta">
                {{ ds.charts }} gráfico(s)
                <span v-if="ds.rows !== null && ds.columns !== null">
                  · {{ ds.rows }} filas · {{ ds.columns }} columnas
                </span>
              </span>
            </div>
            <div
              v-if="ds.datasetId === 'sin-dataset'"
              class="analytics-panel__dataset-warning"
            >
              Los gráficos en este grupo no declaran un
              <code>datasetId</code>. En F2.x se permite, pero se recomienda
              vincularlos a un dataset para trazabilidad completa.
            </div>
          </li>
        </ul>
      </section>

      <!-- Lista de gráficos -->
      <section class="stats-panel__section">
        <h3 class="stats-panel__section-title">
          3. Gráficos y metadatos
        </h3>

        <p
          v-if="entries.length === 0"
          class="stats-panel__hint"
        >
          No se han encontrado gráficos <code>statsChart</code> en el
          documento.
        </p>

        <ul
          v-else
          class="analytics-panel__chart-list"
        >
          <li
            v-for="entry in entries"
            :key="entry.id"
            :class="[
              'analytics-panel__chart-item',
              { 'analytics-panel__chart-item--active': entry.id === selectedChartId },
            ]"
          >
            <header class="analytics-panel__chart-header">
              <div class="analytics-panel__chart-title-block">
                <span class="analytics-panel__chart-title">
                  {{ entry.title || 'Gráfico sin título' }}
                </span>
                <span
                  v-if="entry.datasetLabel"
                  class="analytics-panel__chart-dataset"
                >
                  Dataset:
                  <strong>{{ entry.datasetLabel }}</strong>
                  <span v-if="entry.datasetId && entry.datasetId !== entry.datasetLabel">
                    ({{ entry.datasetId }})
                  </span>
                </span>
              </div>

              <button
                type="button"
                class="analytics-panel__chart-action"
                @click="handleFocus(entry)"
              >
                Ir al gráfico
              </button>
            </header>

            <div class="analytics-panel__chart-meta">
              <span v-if="entry.createdAt">
                Creado:
                {{ formatTimestamp(entry.createdAt) }}
              </span>
              <span v-else>
                Creado: (sin marca de tiempo)
              </span>

              <span
                v-if="entry.fields && entry.fields.length"
                class="analytics-panel__chart-fields"
              >
                Campos:
                <template v-for="(f, idx) in entry.fields" :key="f.key">
                  <span class="analytics-panel__field-pill">
                    {{ f.key }} · {{ kindLabel(f.kind) }}
                  </span>
                  <span v-if="idx < entry.fields.length - 1">,</span>
                </template>
              </span>
            </div>

            <p
              v-if="entry.recipe"
              class="analytics-panel__chart-recipe"
            >
              Receta:
              <code>{{ recipePreview(entry.recipe) }}</code>
            </p>

            <p
              v-else
              class="analytics-panel__chart-recipe analytics-panel__chart-recipe--empty"
            >
              Este gráfico no declara receta (probablemente creado desde
              <strong>F2.6</strong> con configuración básica).
            </p>
          </li>
        </ul>
      </section>

      <!-- Nota de alcance -->
      <section class="stats-panel__section analytics-panel__scope-note">
        <p class="stats-panel__hint">
          Alcance F2.x:
          <br>
          Esta bitácora se basa sólo en los metadatos de
          <code>statsChart</code> y los datasets registrados en
          <code>editor-ext-stats-adv</code>.
          La integración completa con el formato <code>.dsrx</code> y el flujo
          de cálculo detallado se deja para la fase F3, tal como define la
          fuente única de verdad.
        </p>
      </section>
    </main>
  </aside>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { Editor } from '@tiptap/core'
import type { StatsColumnKind } from '@disertare/editor-ext-stats-adv'
import {
  useEditorAnalyticsLog,
  type AnalyticsChartEntry,
} from './composables/useEditorAnalyticsLog'

const props = defineProps<{
  editor: Editor | null
}>()

const {
  entries,
  lastUpdated,
  selectedChartId,
  totalCharts,
  datasetsSummary,
  recomputeFromDocument,
  focusChart,
} = useEditorAnalyticsLog(() => props.editor ?? null)

function formatTimestamp(iso: string): string {
  if (!iso) return ''
  // Formato corto: YYYY-MM-DD HH:MM
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${hh}:${mm}`
  } catch {
    return iso
  }
}

function recipePreview(recipe: string): string {
  const trimmed = recipe.trim()
  if (trimmed.length <= 120) return trimmed
  return `${trimmed.slice(0, 117)}…`
}

function kindLabel(kind: StatsColumnKind): string {
  if (kind === 'numeric') return 'Numérico'
  if (kind === 'datetime') return 'Fecha/Hora'
  return 'Categórico'
}

function handleRefresh() {
  recomputeFromDocument()
}

function handleFocus(entry: AnalyticsChartEntry) {
  focusChart(entry)
}

onMounted(() => {
  recomputeFromDocument()
})
</script>

<style scoped>
.analytics-panel__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Resumen */
.analytics-panel__section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.analytics-panel__summary-list {
  margin: 6px 0 0;
  padding-left: 16px;
  font-size: 12px;
  color: #374151;
}

.analytics-panel__timestamp {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
}

/* Datasets */
.analytics-panel__dataset-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.analytics-panel__dataset-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 6px 8px;
  background: #f9fafb;
}

.analytics-panel__dataset-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.analytics-panel__dataset-label {
  font-size: 12px;
  font-weight: 500;
  color: #111827;
}

.analytics-panel__dataset-meta {
  font-size: 11px;
  color: #6b7280;
}

.analytics-panel__dataset-warning {
  margin-top: 4px;
  font-size: 11px;
  color: #92400e;
  background: #fffbeb;
  border-radius: 8px;
  padding: 4px 6px;
}

/* Gráficos */
.analytics-panel__chart-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.analytics-panel__chart-item {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.analytics-panel__chart-item--active {
  border-color: #4f46e5;
  box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.25);
}

.analytics-panel__chart-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
}

.analytics-panel__chart-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.analytics-panel__chart-title {
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.analytics-panel__chart-dataset {
  font-size: 11px;
  color: #4b5563;
}

.analytics-panel__chart-action {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
  font-size: 11px;
  background: #ffffff;
  cursor: pointer;
}

.analytics-panel__chart-action:hover {
  border-color: #4f46e5;
}

.analytics-panel__chart-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #4b5563;
}

.analytics-panel__chart-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.analytics-panel__field-pill {
  padding: 2px 6px;
  border-radius: 999px;
  background: #eef2ff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
}

.analytics-panel__chart-recipe {
  font-size: 11px;
  color: #374151;
}

.analytics-panel__chart-recipe code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
}

.analytics-panel__chart-recipe--empty {
  color: #6b7280;
}

/* Nota de alcance */
.analytics-panel__scope-note {
  background: #f3f4ff;
  border-radius: 10px;
}

/* Reutiliza estilos de stats-panel de F2.6 para coherencia visual. */
</style>
