// apps/frontend/src/editor/composables/useEditorAnalyticsLog.ts
import { computed, ref } from 'vue'
import type { Editor } from '@tiptap/core'
import {
  getDataset,
  type StatsDataset,
  type StatsColumnKind,
} from '@disertare/editor-ext-stats-adv'

export interface AnalyticsChartFieldMeta {
  key: string
  kind: StatsColumnKind
}

export interface AnalyticsChartEntry {
  /**
   * id del nodo statsChart (StatsChartAttrs.id)
   */
  id: string
  /**
   * Posición aproximada del nodo en el documento.
   */
  pos: number
  /**
   * Título mostrado en el documento (si existe).
   */
  title: string | null
  /**
   * Dataset id registrado en stats-adv (puede ser null).
   */
  datasetId: string | null
  /**
   * Nombre descriptivo del dataset (label o id).
   */
  datasetLabel: string | null
  /**
   * Filas y columnas del dataset (si está disponible en stats-adv).
   */
  datasetRows: number | null
  datasetColumns: number | null
  /**
   * Receta textual usada (mini-lenguaje F2.17), si aplica.
   */
  recipe: string | null
  /**
   * Campos implicados en el análisis (F2.17).
   */
  fields: AnalyticsChartFieldMeta[] | null
  /**
   * Fecha de creación ISO-8601 del gráfico (StatsChartAttrs.createdAt).
   */
  createdAt: string | null
}

export interface AnalyticsDatasetSummary {
  datasetId: string
  label: string
  charts: number
  rows: number | null
  columns: number | null
}

/**
 * F2.18 — Bitácora analítica (nivel F2.x)
 */
export function useEditorAnalyticsLog(getEditor: () => Editor | null) {
  const entries = ref<AnalyticsChartEntry[]>([])
  const lastUpdated = ref<string | null>(null)
  const selectedChartId = ref<string | null>(null)

  function resolveDatasetMeta(datasetId: string | null): {
    dataset: StatsDataset | null
    label: string | null
    rows: number | null
    columns: number | null
  } {
    if (!datasetId) {
      return {
        dataset: null,
        label: null,
        rows: null,
        columns: null,
      }
    }

    const ds = getDataset(datasetId) ?? null
    if (!ds) {
      return {
        dataset: null,
        label: datasetId,
        rows: null,
        columns: null,
      }
    }

    return {
      dataset: ds,
      label: ds.label || datasetId,
      rows: ds.rows.length,
      columns: ds.fields.length,
    }
  }

  /**
   * Reconstruye la bitácora a partir del documento actual.
   */
  function recomputeFromDocument(): void {
    const editor = getEditor()
    if (!editor) return

      const doc = editor.state.doc
      const result: AnalyticsChartEntry[] = []

      doc.descendants((node, pos) => {
        // TipTap registra el nodo como "statsChart" (StatsChartNode).
        // @ts-expect-error type name runtime
        if (node.type?.name !== 'statsChart') return

          const attrs = node.attrs as {
            id?: string | null
            title?: string | null
            spec?: any | null
            datasetId?: string | null
            recipe?: string | null
            fields?: { key: string; kind: StatsColumnKind }[] | null
            createdAt?: string | null
          }

          const {
            dataset,
            label: datasetLabel,
            rows,
            columns,
          } = resolveDatasetMeta(attrs.datasetId ?? null)

          const id =
          attrs.id ??
          `stats-${result.length.toString(36)}-${Date.now().toString(36)}`

          result.push({
            id,
            pos,
            title: attrs.title ?? null,
            datasetId: attrs.datasetId ?? null,
            datasetLabel,
            datasetRows: rows,
            datasetColumns: columns,
            recipe: attrs.recipe ?? null,
            fields: attrs.fields ?? null,
            createdAt: attrs.createdAt ?? null,
          })
      })

      entries.value = result
      lastUpdated.value = new Date().toISOString()
  }

  /**
   * Enfoca un gráfico en el documento (coloca el cursor en su posición).
   */
  function focusChart(entry: AnalyticsChartEntry): void {
    const editor = getEditor()
    if (!editor) return

      selectedChartId.value = entry.id

      editor
      .chain()
      .setTextSelection(entry.pos)
      .scrollIntoView()
      .run()
  }

  const totalCharts = computed(() => entries.value.length)

  const datasetsSummary = computed<AnalyticsDatasetSummary[]>(() => {
    const map = new Map<string, AnalyticsDatasetSummary>()

    for (const entry of entries.value) {
      const datasetKey = entry.datasetId ?? 'sin-dataset'
      const label =
      entry.datasetLabel ??
      (entry.datasetId ?? 'Sin dataset asociado')

      const existing = map.get(datasetKey)
      if (existing) {
        existing.charts += 1
        continue
      }

      map.set(datasetKey, {
        datasetId: datasetKey,
        label,
        charts: 1,
        rows: entry.datasetRows,
        columns: entry.datasetColumns,
      })
    }

    return Array.from(map.values())
  })

  return {
    entries,
    lastUpdated,
    selectedChartId,
    totalCharts,
    datasetsSummary,
    recomputeFromDocument,
    focusChart,
  }
}
