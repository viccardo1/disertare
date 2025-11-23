<!-- packages/editor-ext-stats/src/StatsChartNodeView.vue -->
<template>
  <NodeViewWrapper
    as="figure"
    class="stats-chart-node"
    :data-stats-chart="attrs.id"
  >
    <figcaption
      v-if="attrs.title"
      class="stats-chart-title"
      data-stats-chart-title="true"
    >
      {{ attrs.title }}
    </figcaption>

    <div
      ref="chartEl"
      class="stats-chart-container"
      role="img"
      :aria-label="ariaLabel"
      data-stats-chart-content="true"
    />

    <p
      v-if="!attrs.spec"
      class="stats-chart-empty"
    >
      Sin configuración de gráfica. Usa el panel de Estadística para crear una.
    </p>
  </NodeViewWrapper>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/vue-3'
import vegaEmbed, {
  type VisualizationSpec,
  type EmbedOptions,
} from 'vega-embed'

const props = defineProps<NodeViewProps>()

const chartEl = ref<HTMLElement | null>(null)
let view: any = null

const attrs = computed(() => props.node.attrs as {
  id: string
  title?: string | null
  spec: string | null
})

const ariaLabel = computed(
  () => attrs.value.title || 'Gráfico estadístico generado en Disertare',
)

function getPlainSpec(): VisualizationSpec | null {
  const raw = attrs.value.spec
  if (!raw) return null

  try {
    if (typeof raw === 'string') {
      return JSON.parse(raw) as VisualizationSpec
    }
    // Fallback defensivo
    return JSON.parse(JSON.stringify(raw)) as VisualizationSpec
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Spec de estadística inválido:', e)
    return null
  }
}

async function renderChart() {
  if (!chartEl.value) return
  const spec = getPlainSpec()
  if (!spec) return

  if (view) {
    try {
      view.finalize()
    } catch {
      // ignoramos errores de finalización
    }
    view = null
  }

  const options: EmbedOptions = {
    actions: false,
    renderer: 'canvas',
  }

  try {
    const result = await vegaEmbed(chartEl.value, spec, options)
    view = result.view
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error al renderizar gráfico Vega-Lite:', e)
  }
}

onMounted(() => {
  void renderChart()
})

watch(
  () => attrs.value.spec,
  () => {
    void renderChart()
  },
)

onBeforeUnmount(() => {
  if (view) {
    try {
      view.finalize()
    } catch {
      // ignoramos errores
    }
  }
})
</script>

<style scoped>
.stats-chart-node {
  margin: 1.5rem 0;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e0e0f5;
  background: #faf9ff;
}

.stats-chart-title {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b3f72;
}

.stats-chart-container {
  width: 100%;
  min-height: 220px;
  max-height: 480px;
  overflow: hidden;
}

.stats-chart-empty {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #777;
}
</style>
