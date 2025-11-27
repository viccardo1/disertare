<!-- packages/editor-ext-diagrams-adv/src/DiagramAdvNodeView.vue -->
<template>
  <NodeViewWrapper class="diagram-adv-node">
    <header class="diagram-adv-node__header">
      <div class="diagram-adv-node__title-block">
        <span class="diagram-adv-node__title">
          {{ effectiveTitle }}
        </span>

        <span class="diagram-adv-node__badge">
          {{ kindLabel }}
        </span>
      </div>

      <p v-if="description" class="diagram-adv-node__description">
        {{ description }}
      </p>
    </header>

    <section class="diagram-adv-node__body">
      <!-- AQUÍ es donde cambiamos realmente de tipo de diagrama -->
      <component
        :is="currentBodyComponent"
        :node="node"
        :update-attributes="updateAttributes"
      />
    </section>

    <footer class="diagram-adv-node__footer">
      <small class="diagram-adv-node__hint">
        {{ footerHint }}
      </small>
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

import IshikawaNodeView from './IshikawaNodeView.vue'
import VennEulerNodeView from './VennEulerNodeView.vue'
import RiskMatrixNodeView from './RiskMatrixNodeView.vue'
import ProcessMapNodeView from './ProcessMapNodeView.vue'
import SystemsModelNodeView from './SystemsModelNodeView.vue'
import type { DiagramKind } from './types'

const props = defineProps(nodeViewProps)

const kind = computed<DiagramKind>(() => props.node.attrs.kind ?? 'ishikawa')
const title = computed(() => props.node.attrs.title as string | null)
const description = computed(() => props.node.attrs.description as string | null)

const effectiveTitle = computed(() => title.value || 'Diagrama avanzado')

const kindLabel = computed(() => {
  switch (kind.value) {
    case 'ishikawa':
      return 'Diagrama de Ishikawa'
    case 'venn':
      return 'Diagrama de Venn/Euler'
    case 'riskMatrix':
      return 'Matriz de riesgo'
    case 'processMap':
      return 'Mapa de procesos'
    case 'systemsModel':
      return 'Modelo / análisis de sistemas'
    default:
      return 'Diagrama avanzado'
  }
})

const footerHint = computed(() => {
  switch (kind.value) {
    case 'ishikawa':
      return 'Las ramas y categorías se pueden personalizar editando este bloque dentro de F2.11.'
    case 'venn':
      return 'Los conjuntos y sus intersecciones se definen y etiquetan en este bloque.'
    case 'riskMatrix':
      return 'Probabilidad × impacto. Los niveles de riesgo se configuran desde la plantilla seleccionada.'
    case 'processMap':
      return 'Mapa de procesos básico. Los pasos y decisiones pueden refinarse en el documento.'
    case 'systemsModel':
      return 'Modelo causal / análisis de sistemas. Variables y relaciones se ajustan desde este bloque.'
    default:
      return ''
  }
})

const currentBodyComponent = computed(() => {
  switch (kind.value) {
    case 'ishikawa':
      return IshikawaNodeView
    case 'venn':
      return VennEulerNodeView
    case 'riskMatrix':
      return RiskMatrixNodeView
    case 'processMap':
      return ProcessMapNodeView
    case 'systemsModel':
      return SystemsModelNodeView
    default:
      return IshikawaNodeView
  }
})
</script>

<style scoped>
.diagram-adv-node {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 12px 14px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
}

.diagram-adv-node__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.diagram-adv-node__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.diagram-adv-node__title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.diagram-adv-node__badge {
  align-self: flex-start;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
}

.diagram-adv-node__description {
  margin: 0;
  margin-left: 12px;
  font-size: 11px;
  color: #4b5563;
}

.diagram-adv-node__body {
  margin-top: 8px;
  font-size: 11px;
  color: #111827;
}

.diagram-adv-node__footer {
  margin-top: 8px;
}

.diagram-adv-node__hint {
  font-size: 10px;
  color: #6b7280;
}
</style>
