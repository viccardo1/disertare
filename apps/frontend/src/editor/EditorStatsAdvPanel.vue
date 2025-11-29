<!-- apps/frontend/src/editor/EditorStatsAdvPanel.vue -->
<template>
  <aside
    class="stats-panel stats-adv-panel"
    role="complementary"
    aria-label="Análisis estadístico avanzado"
  >
    <!-- Encabezado -->
    <header class="stats-panel__header">
      <h2 class="stats-panel__title">
        Análisis avanzado
        <span class="stats-panel__phase">(F2.17)</span>
      </h2>
      <p class="stats-panel__subtitle">
        Usa datasets existentes para generar gráficos avanzados a partir de una
        receta de texto (tipo SPSS/Vega-Lite).
      </p>
    </header>

    <!-- Contenido principal -->
    <main class="stats-panel__body">
      <!-- 1) Selección de dataset -->
      <section class="stats-panel__section">
        <div class="stats-panel__section-header">
          <h3 class="stats-panel__section-title">
            1. Dataset activo
          </h3>
          <button
            type="button"
            class="stats-panel__section-action"
            @click="handleRefreshDatasets"
          >
            Actualizar lista
          </button>
        </div>

        <p class="stats-panel__help">
          Selecciona un dataset registrado desde el panel de datos/estadística
          (F2.6) o por otros módulos que expongan datos hacia F2.17.
        </p>

        <div v-if="datasets.length === 0" class="stats-panel__empty">
          <p>
            No hay datasets disponibles todavía. Crea uno desde el panel
            <strong>Datos y Estadística (F2.6)</strong> o registra uno desde el
            código antes de usar este panel.
          </p>
        </div>

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
                type="radio"
                name="stats-adv-dataset"
                class="stats-panel__dataset-radio"
                :value="dataset.id"
                :checked="dataset.id === state.selectedDatasetId"
                @change="() => handleSelectDataset(dataset.id)"
              />

              <span class="stats-panel__dataset-name">
                {{ dataset.displayName }}
              </span>
              <span class="stats-panel__dataset-meta">
                {{ dataset.columns }} columnas ·
                {{ dataset.rows }} filas
              </span>
            </label>
          </li>
        </ul>

        <!-- Variables del dataset activo -->
        <div
          v-if="activeDatasetFields.length"
          class="stats-panel__variables"
        >
          <div class="stats-panel__variables-header">
            <span class="stats-panel__variables-title">
              Variables del dataset
            </span>
            <span class="stats-panel__variables-hint">
              Usa estos nombres en la receta (x=, y=, color=, …)
            </span>
          </div>

          <ul class="stats-panel__variables-list">
            <li
              v-for="field in activeDatasetFields"
              :key="field.key"
              class="stats-panel__variables-item"
            >
              <span class="stats-panel__variables-badge">
                {{ kindLabel(field.kind) }}
              </span>
              <span class="stats-panel__variables-name">
                {{ field.key }}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <!-- 2) Receta de gráfico (mini-lenguaje) -->
      <section class="stats-panel__section">
        <h3 class="stats-panel__section-title">
          2. Receta de gráfico
        </h3>

        <p class="stats-panel__help">
          Escribe una receta corta para el gráfico. Ejemplo:
          <code>bar x=edad y=salario color=sexo</code>
        </p>

        <textarea
          v-model="state.miniLanguageInput"
          class="stats-panel__textarea"
          rows="3"
          placeholder="bar x=categoria y=valor"
          @input="clearError"
        />
      </section>

      <!-- 3) Opciones básicas: título -->
      <section class="stats-panel__section">
        <h3 class="stats-panel__section-title">
          3. Opciones del gráfico
        </h3>

        <label class="stats-panel__field">
          <span class="stats-panel__field-label"> Título (opcional) </span>
          <input
            v-model="state.chartTitle"
            type="text"
            class="stats-panel__input"
            placeholder="Relación entre edad y salario"
          />
        </label>
      </section>

      <!-- Estado / errores -->
      <p
        v-if="state.errorMessage"
        class="stats-panel__error"
      >
        {{ state.errorMessage }}
      </p>
    </main>

    <!-- Pie: acciones principales -->
    <footer class="stats-panel__footer">
      <button
        type="button"
        class="stats-panel__primary-button"
        :disabled="state.isRunning || !datasets.length"
        @click="handleInsertChart"
      >
        <span v-if="state.isRunning">Generando gráfico…</span>
        <span v-else>Insertar gráfico avanzado</span>
      </button>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { Editor } from '@tiptap/core'
import { useEditorStatsAdv } from './composables/useEditorStatsAdv'
import type { StatsColumnKind } from '@disertare/editor-ext-stats-adv'

const props = defineProps<{
  editor: Editor | null
}>()

const {
  state,
  datasets,
  activeDatasetFields,
  refreshDatasets,
  selectDataset,
  clearError,
  insertAdvancedChart,
} = useEditorStatsAdv(() => props.editor ?? null)

function handleRefreshDatasets() {
  refreshDatasets()
}

function handleSelectDataset(id: string) {
  selectDataset(id)
}

async function handleInsertChart() {
  await insertAdvancedChart()
}

function kindLabel(kind: StatsColumnKind): string {
  if (kind === 'numeric') return 'Numérico'
  if (kind === 'datetime') return 'Fecha/Hora'
  return 'Categórico'
}

onMounted(() => {
  refreshDatasets()
})
</script>

<style scoped>
.stats-adv-panel {
  border-top: 1px solid #e5e7eb;
}

/* Reutiliza la mayoría de las clases de .stats-panel ya definidas en F2.6.
   Aquí extendemos estilos específicos. */
.stats-panel__footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.stats-panel__primary-button {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: #4f46e5;
  color: #ffffff;
}

.stats-panel__primary-button:disabled {
  opacity: 0.6;
  cursor: default;
}

/* Lista de variables */
.stats-panel__variables {
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
  background: #f3f4ff;
}

.stats-panel__variables-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.stats-panel__variables-title {
  font-size: 11px;
  font-weight: 600;
  color: #111827;
}

.stats-panel__variables-hint {
  font-size: 11px;
  color: #6b7280;
}

.stats-panel__variables-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.stats-panel__variables-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border-radius: 999px;
  background: #eef2ff;
}

.stats-panel__variables-badge {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: #4338ca;
}

.stats-panel__variables-name {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
}
</style>
