// packages/editor-ext-stats-adv/src/syntax/index.ts
import type {
  EncodingChannel,
  EncodingDataType,
  StatsChartConfig,
  StatsMark,
} from '../types'

/**
 * Resultado del parser de mini-lenguaje.
 */
export interface ParsedStatsCommand {
  config: StatsChartConfig
}

/**
 * Determina un tipo de dato por defecto a partir del nombre del campo.
 */
function inferTypeFromFieldName(field: string): EncodingDataType {
  const lower = field.toLowerCase()

  // Fechas / tiempos
  if (/(fecha|date|hora|hour|time|timestamp|día|dia|mes|año|anio|year)/.test(lower)) {
    return 'temporal'
  }

  // Identificadores y categóricos típicos
  if (/^(id|clave|codigo|código)$/.test(lower)) {
    return 'nominal'
  }

  if (
    /(categoria|categoría|grupo|sexo|tipo|nivel|region|región|ciudad|escuela|facultad|carrera)/
    .test(lower)
  ) {
    return 'nominal'
  }

  // Nombres típicamente numéricos
  if (
    /(edad|valor|monto|importe|precio|costo|cantidad|score|puntuacion|puntuación|indice|índice|peso|altura|talla|ingreso|gasto)/
    .test(lower)
  ) {
    return 'quantitative'
  }

  // Por defecto asumimos categórico (más seguro)
  return 'nominal'
}

/**
 * Normaliza la marca de texto → StatsMark.
 */
function normalizeMark(token: string): StatsMark {
  const t = token.toLowerCase()
  if (t === 'line' || t === 'línea') return 'line'
    if (t === 'point' || t === 'punto' || t === 'scatter') return 'point'
      if (t === 'area' || t === 'área') return 'area'
        if (t === 'boxplot' || t === 'box') return 'boxplot'
          if (t === 'hist' || t === 'histograma') return 'histogram'
            return 'bar'
}

/**
 * Parser de receta simple:
 *
 *   "<mark> canal=campo canal=campo ..."
 *
 * Canales admitidos: x, y, color, size, shape, row, column.
 */
export function parseStatsMiniLanguage(
  input: string,
  datasetId: string,
): ParsedStatsCommand | null {
  const trimmed = input.trim()
  if (!trimmed) return null

    const tokens = trimmed.split(/\s+/)
    if (tokens.length === 0) return null

      const [markToken, ...restTokens] = tokens
      const mark = normalizeMark(markToken)

      const encodings: StatsChartConfig['encodings'] = []

      for (const token of restTokens) {
        const [channelRaw, fieldRaw] = token.split('=')
        if (!channelRaw || !fieldRaw) continue

          const channel = channelRaw.toLowerCase() as EncodingChannel
          const field = fieldRaw

          if (!['x', 'y', 'color', 'size', 'shape', 'column', 'row'].includes(channel))
            continue

            const type = inferTypeFromFieldName(field)

            encodings.push({
              channel,
              field,
              type,
              aggregate: null,
            })
      }

      if (encodings.length === 0) return null

        const config: StatsChartConfig = {
          datasetId,
          mark,
          encodings,
          measures: [],
          title: null,
          description: null,
        }

        return { config }
}
