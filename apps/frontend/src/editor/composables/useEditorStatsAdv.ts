// apps/frontend/src/editor/composables/useEditorStatsAdv.ts
import { reactive, ref, computed } from 'vue'
import type { Editor } from '@tiptap/core'
import type { StatsDataset } from '@disertare/editor-ext-stats-adv'
import {
  listDatasets,
  getDataset,
  buildVegaLiteSpec,
  parseStatsMiniLanguage,
} from '@disertare/editor-ext-stats-adv'

export interface StatsAdvDatasetSummary {
  id: string
  displayName: string
  rows: number
  columns: number
}

export interface StatsAdvState {
  selectedDatasetId: string | null
  /**
   * Entrada de "mini-lenguaje" tipo:
   *   bar x=edad y=salario color=sexo
   */
  miniLanguageInput: string
  /**
   * Título opcional del gráfico.
   */
  chartTitle: string
  /**
   * Bandera de ejecución (por si luego queremos mostrar spinner).
   */
  isRunning: boolean
  /**
   * Mensaje de error amigable para el panel.
   */
  errorMessage: string | null
}

/**
 * F2.17 — Estadística avanzada (núcleo de UI para gráficos avanzados).
 */
export function useEditorStatsAdv(getEditor: () => Editor | null) {
  const state = reactive<StatsAdvState>({
    selectedDatasetId: null,
    miniLanguageInput: '',
    chartTitle: '',
    isRunning: false,
    errorMessage: null,
  })

  const datasets = ref<StatsAdvDatasetSummary[]>([])

  function mapDatasetToSummary(ds: StatsDataset): StatsAdvDatasetSummary {
    return {
      id: ds.id,
      displayName: ds.label || ds.id,
      rows: ds.rows.length,
      columns: ds.fields.length,
    }
  }

  /**
   * Dataset activo completo (con fields, rows, etc.).
   */
  const activeDataset = computed<StatsDataset | null>(() => {
    if (!state.selectedDatasetId) return null
      return getDataset(state.selectedDatasetId) ?? null
  })

  /**
   * Variables del dataset activo.
   */
  const activeDatasetFields = computed(() => {
    return activeDataset.value?.fields ?? []
  })

  /**
   * Refresca la lista de datasets disponibles desde el registro global.
   */
  function refreshDatasets(): void {
    const list = listDatasets()
    datasets.value = list.map(mapDatasetToSummary)

    // Seleccionar automáticamente el primero si no hay ninguno seleccionado
    if (!state.selectedDatasetId && datasets.value.length > 0) {
      state.selectedDatasetId = datasets.value[0]?.id ?? null
    }

    // Si el dataset seleccionado ya no existe, limpiamos la selección
    if (
      state.selectedDatasetId &&
      !datasets.value.some((d) => d.id === state.selectedDatasetId)
    ) {
      state.selectedDatasetId = datasets.value[0]?.id ?? null
    }
  }

  function selectDataset(datasetId: string): void {
    state.selectedDatasetId = datasetId
    state.errorMessage = null
  }

  function clearError(): void {
    state.errorMessage = null
  }

  /**
   * Inserta un gráfico avanzado:
   * - usa el mini-lenguaje para construir StatsChartConfig,
   * - transforma a spec Vega-Lite,
   * - inserta el nodo statsChart vía comando TipTap.
   */
  async function insertAdvancedChart(): Promise<void> {
    const editor = getEditor()
    if (!editor) {
      state.errorMessage = 'El editor aún no está listo.'
      return
    }

    if (!state.selectedDatasetId) {
      state.errorMessage = 'Selecciona primero un dataset.'
      return
    }

    if (!state.miniLanguageInput.trim()) {
      state.errorMessage =
      'Escribe una receta de gráfico (por ejemplo: "bar x=edad y=salario color=sexo").'
      return
    }

    const dataset = getDataset(state.selectedDatasetId)
    if (!dataset) {
      state.errorMessage =
      'No se encontró el dataset seleccionado. Actualiza la lista e inténtalo de nuevo.'
      return
    }

    state.isRunning = true
    state.errorMessage = null

    try {
      const parsed = parseStatsMiniLanguage(
        state.miniLanguageInput,
        state.selectedDatasetId,
      )

      if (!parsed) {
        state.errorMessage =
        'No se pudo interpretar la receta. Revisa la sintaxis (ejemplo: "bar x=edad y=salario color=sexo").'
        return
      }

      const { spec } = buildVegaLiteSpec(parsed.config, dataset)

      const cleanedRecipe = state.miniLanguageInput.trim() || null
      const fields =
      dataset.fields?.map(f => ({ key: f.key, kind: f.kind })) ?? null

      editor
      .chain()
      .focus()
      // @ts-expect-error comando extendido por la extensión statsChart
      .insertStatsChart({
        title: state.chartTitle || null,
        spec,
        datasetId: state.selectedDatasetId,
        recipe: cleanedRecipe,
        fields,
      })
      .run()

      state.errorMessage = null
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[StatsAdv] Error al insertar gráfico avanzado:', error)
      state.errorMessage =
      'Ocurrió un error al generar el gráfico. Revisa la receta o el dataset.'
    } finally {
      state.isRunning = false
    }
  }

  return {
    state,
    datasets,
    activeDataset,
    activeDatasetFields,
    refreshDatasets,
    selectDataset,
    clearError,
    insertAdvancedChart,
  }
}
