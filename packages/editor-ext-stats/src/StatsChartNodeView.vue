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

    <!-- F2.17: Metadatos mínimos de análisis (dataset + receta) -->
    <footer
      v-if="hasMeta"
      class="stats-chart-meta"
    >
      <span
        v-if="attrs.datasetId"
        class="stats-chart-meta-badge"
      >
        Dataset: {{ attrs.datasetId }}
      </span>

      <span
        v-if="attrs.recipe"
        class="stats-chart-meta-recipe"
      >
        {{ recipePreview }}
      </span>
    </footer>
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
  spec: any | null
  datasetId?: string | null
  recipe?: string | null
  fields?: { key: string; kind: 'numeric' | 'categorical' | 'datetime' }[] | null
  createdAt?: string | null
})

const ariaLabel = computed(
  () => attrs.value.title || 'Gráfico estadístico generado en Disertare',
)

const hasMeta = computed(() => {
  return Boolean(attrs.value.datasetId || attrs.value.recipe)
})

const recipePreview = computed(() => {
  const r = attrs.value.recipe
  if (!r) return ''
  const trimmed = r.trim()
  if (trimmed.length <= 80) return trimmed
  return `${trimmed.slice(0, 77)}…`
})

function getPlainSpec(): VisualizationSpec | null {
  const raw = attrs.value.spec
  if (!raw) return null

  try {
    if (typeof raw === 'string') {
      return JSON.parse(raw) as VisualizationSpec
    }
    // Fallback defensivo: clonar para evitar mutaciones
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

/* F2.17: metadata del gráfico */
.stats-chart-meta {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 0.75rem;
  color: #4b5563;
}

.stats-chart-meta-badge {
  padding: 2px 6px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 500;
}

.stats-chart-meta-recipe {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  padding: 2px 4px;
  border-radius: 4px;
  background: #f3f4ff;
}
</style>
