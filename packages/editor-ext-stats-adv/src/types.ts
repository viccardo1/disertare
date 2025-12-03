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

// packages/editor-ext-stats-adv/src/types.ts
export type StatsPrimitive = number | string | boolean | null
export type StatsRow = Record<string, StatsPrimitive>

export type StatsColumnKind = 'numeric' | 'categorical' | 'datetime'

export interface StatsFieldDef {
  key: string
  label: string
  kind: StatsColumnKind
}

export interface StatsDataset {
  id: string
  label: string
  description?: string
  rows: StatsRow[]
  fields: StatsFieldDef[]
}

export type AggregateOp =
| 'count'
| 'sum'
| 'mean'
| 'median'
| 'min'
| 'max'

export interface StatsMeasure {
  field: string
  op: AggregateOp
  as: string
}

export type EncodingChannel =
| 'x'
| 'y'
| 'color'
| 'size'
| 'shape'
| 'column'
| 'row'

export type EncodingDataType =
| 'quantitative'
| 'nominal'
| 'temporal'
| 'ordinal'

export interface StatsEncodingField {
  channel: EncodingChannel
  field: string
  type: EncodingDataType
  bin?: boolean
  aggregate?: AggregateOp | null
}

export type StatsMark =
| 'bar'
| 'line'
| 'point'
| 'area'
| 'boxplot'
| 'histogram'

export interface StatsChartConfig {
  datasetId: string
  mark: StatsMark
  encodings: StatsEncodingField[]
  measures?: StatsMeasure[]
  title?: string | null
  description?: string | null
}

export interface StatsBuiltSpecResult {
  spec: any
  dataset: StatsDataset
}
