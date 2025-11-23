// packages/editor-ext-stats/src/StatsChartNode.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import StatsChartNodeView from './StatsChartNodeView.vue'

export interface StatsChartAttrs {
  id: string
  title?: string | null
  spec: any | null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    statsChart: {
      /**
       * Inserta un gráfico estadístico (Vega-Lite) como nodo bloque.
       * F2.6: datos pequeños embebidos en el spec.
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

          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: {
                id,
                title: attrs.title ?? null,
                spec: attrs.spec ?? null,
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
