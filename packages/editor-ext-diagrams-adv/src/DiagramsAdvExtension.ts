// packages/editor-ext-diagrams-adv/src/DiagramsAdvExtension.ts
import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewRenderer } from '@tiptap/core'
import { DiagramAdvNodeViewRenderer } from './DiagramAdvNodeView'
import type { DiagramAdvAttrs, DiagramAdvOptions, DiagramKind } from './types'

const DEFAULT_TITLE = 'Diagrama avanzado'

/**
 * F2.11 — Nodo de dominio para diagramas avanzados.
 *
 * - Nodo único `diagramAdv` con atributo `kind`.
 * - El NodeView delega la representación en sub-vistas según `kind`.
 */
export const DiagramsAdvExtension = Node.create<
DiagramAdvOptions,
DiagramAdvAttrs
>({
  name: 'diagramAdv',

  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      id: {
        default: null,
      },
      kind: {
        default: 'ishikawa' as DiagramKind,
      },
      title: {
        default: null,
      },
      description: {
        default: null,
      },
      datasetRef: {
        default: null,
      },
      config: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="diagram-adv"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'diagram-adv',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      /**
       * Inserta un diagrama avanzado con los atributos proporcionados.
       * Se usa desde el panel `EditorDiagramsPanel` y otros flujos.
       */
      insertDiagramAdv:
      (attrs: Partial<DiagramAdvAttrs>) =>
      ({ chain }) => {
        const kind: DiagramKind = (attrs.kind ?? 'ishikawa') as DiagramKind

        return chain()
        .focus()
        .insertContent({
          type: this.name,
          attrs: {
            id:
            attrs.id ??
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? (crypto as any).randomUUID()
            : `diagram-${Math.random().toString(36).slice(2)}`),
                       kind,
                       title: attrs.title ?? DEFAULT_TITLE,
                       description: attrs.description ?? null,
                       datasetRef: attrs.datasetRef ?? null,
                       config: attrs.config ?? null,
          },
        })
        .run()
      },
    }
  },

  addNodeView(): NodeViewRenderer {
    return DiagramAdvNodeViewRenderer
  },
})
