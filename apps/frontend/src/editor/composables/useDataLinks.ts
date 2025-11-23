// apps/frontend/src/editor/composables/useDataLinks.ts
import { reactive } from 'vue'

export type DataValue = string | number | boolean | null

export interface DataRow {
  [key: string]: DataValue
}

export interface InlineDataset {
  id: string
  name: string
  columns: string[]
  rows: DataRow[]
  source: 'inline'
}

type AnyDataset = InlineDataset

const state = reactive<{ datasets: AnyDataset[] }>({
  datasets: [],
})

function createId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  const time = Date.now().toString(36)
  return `${prefix}-${time}-${rand}`
}

/**
 * F2.6 — Enlace simple de datos ↔ editor.
 * Por ahora solo soporta datasets "inline" definidos desde el panel.
 */
export function useDataLinks() {
  function registerInlineDataset(input: {
    name: string
    columns: string[]
    rows: DataRow[]
  }): InlineDataset {
    const ds: InlineDataset = {
      id: createId('inline'),
      name: input.name,
      columns: [...input.columns],
      // Clonamos filas para evitar referencias raras
      rows: input.rows.map(row => ({ ...row })),
      source: 'inline',
    }

    state.datasets.push(ds)
    return ds
  }

  function getDatasetById(id: string): AnyDataset | undefined {
    return state.datasets.find(ds => ds.id === id)
  }

  return {
    datasets: state.datasets,
    registerInlineDataset,
    getDatasetById,
  }
}
