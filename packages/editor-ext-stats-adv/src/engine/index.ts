// packages/editor-ext-stats-adv/src/engine/index.ts
import type {
  StatsBuiltSpecResult,
  StatsChartConfig,
  StatsDataset,
} from '../types'

export function buildVegaLiteSpec(
  config: StatsChartConfig,
  dataset: StatsDataset,
): StatsBuiltSpecResult {
  const enc: Record<string, any> = {}

  for (const channelDef of config.encodings) {
    const { channel, field, type, bin, aggregate } = channelDef

    enc[channel] = {
      field,
      type,
      ...(bin ? { bin: true } : {}),
      ...(aggregate ? { aggregate } : {}),
    }
  }

  const mark =
  config.mark === 'histogram'
  ? { type: 'bar' }
  : config.mark === 'boxplot'
  ? { type: 'boxplot' }
  : { type: config.mark }

  const spec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: dataset.rows,
    },
    mark,
    encoding: enc,
  }

  if (config.title) spec.title = config.title
    if (config.description) spec.description = config.description

      return {
        spec,
        dataset,
      }
}
