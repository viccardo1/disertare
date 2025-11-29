// packages/editor-ext-stats/src/StatsChartNode.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import StatsChartNodeView from './StatsChartNodeView.vue'

export type StatsFieldKind = 'numeric' | 'categorical' | 'datetime'

export interface StatsChartFieldMeta {
  key: string
  kind: StatsFieldKind
}

export interface StatsChartAttrs {
  id: string
  title?: string | null
  spec: any | null
  /**
   * F2.17 — dataset origen de la gráfica (id registrado en stats-adv).
   */
  datasetId?: string | null
  /**
   * F2.17 — receta textual (mini-lenguaje) usada para generar el gráfico.
   * Para F2.6 se deja en null.
   */
  recipe?: string | null
  /**
   * F2.17 — metadatos de campos implicados en el análisis.
   */
  fields?: StatsChartFieldMeta[] | null
  /**
   * ISO-8601 de creación del gráfico (para auditoría básica).
   */
  createdAt?: string | null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    statsChart: {
      /**
       * Inserta un gráfico estadístico (Vega-Lite) como nodo bloque.
       *
       * - F2.6: datos pequeños embebidos en el spec.
       * - F2.17: admite datasetId, recipe y fields para trazabilidad.
       */
      insertStatsChart: (attrs: Partial<StatsChartAttrs>) => ReturnType
    }
  }
}

function createId() {
  return `stats-${Math.random().toString(36).slice(2, 10)}`
}

export const StatsChartNode = Node.create({
  name: 'statsChart',

  group: 'block',
  atom: true,

  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      title: {
        default: null,
      },
      spec: {
        default: null,
      },
      datasetId: {
        default: null,
      },
      recipe: {
        default: null,
      },
      fields: {
        default: null,
      },
      createdAt: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-stats-chart]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(
        {
          'data-stats-chart': 'true',
          'data-stats-chart-id': HTMLAttributes.id,
          ...(HTMLAttributes.datasetId
          ? { 'data-stats-chart-dataset': HTMLAttributes.datasetId }
          : {}),
        },
        HTMLAttributes,
      ),
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(StatsChartNodeView)
  },

  addCommands() {
    return {
      insertStatsChart:
      (attrs: Partial<StatsChartAttrs>) =>
      ({ chain }) => {
        const id = attrs.id ?? createId()
        const now =
        attrs.createdAt ??
        new Date().toISOString()

        return chain()
        .focus()
        .insertContent({
          type: this.name,
          attrs: {
            id,
            title: attrs.title ?? null,
            spec: attrs.spec ?? null,
            datasetId: attrs.datasetId ?? null,
            recipe: attrs.recipe ?? null,
            fields: attrs.fields ?? null,
            createdAt: now,
          },
        })
        .run()
      },
    }
  },

  /**
   * Opcional: evita que ProseMirror colapse atributos al pegar/serializar.
   */
  addProseMirrorPlugins() {
    return []
  },

  /**
   * Utilidad interna para localizar nodos de tipo statsChart.
   */
  findStatsNodes(doc: ProseMirrorNode) {
    const nodes: { node: ProseMirrorNode; pos: number }[] = []
    doc.descendants((node, pos) => {
      // @ts-ignore
      if (node.type?.name === this.name) {
        nodes.push({ node, pos })
      }
    })
    return nodes
  },
})
