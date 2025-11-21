// packages/editor-citations/src/CitationInline.ts
import { Node, mergeAttributes } from '@tiptap/core'
import type {
  CitationFormatter,
  CitationLocation,
  CitationNodeAttrs,
  CitationStyleId,
  Reference,
} from './types'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citationInline: {
      /**
       * Inserta una nueva cita en la posición actual del cursor.
       */
      insertCitation: (attrs: CitationNodeAttrs) => ReturnType

      /**
       * Actualiza una cita existente (por ahora, match por selección actual).
       */
      updateCurrentCitation: (attrs: Partial<CitationNodeAttrs>) => ReturnType

      /**
       * Fuerza el re-render de todas las citas (para cambios de estilo
       * o actualización de referencias).
       */
      refreshCitations: (version: number) => ReturnType
    }
  }
}

export interface CitationInlineOptions {
  getReferenceById?: (id: string) => Reference | null
  getCurrentStyle?: () => CitationStyleId
  formatter?: CitationFormatter
}

/**
 * Nodo inline para citas en el texto principal.
 *
 * Importante para F2.3:
 * - Es un "atom" inline: se trata como un bloque indivisible (como una mención).
 * - Guarda sólo los IDs/attrs; el texto mostrado puede cambiar al cambiar el estilo
 *   o los metadatos de la referencia.
 */
export const CitationInline = Node.create<CitationInlineOptions>({
  name: 'citationInline',

  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      getReferenceById: () => null,
                                                                 getCurrentStyle: () => 'apa' as CitationStyleId,
                                                                 formatter: undefined,
    }
  },

  addAttributes() {
    return {
      refId: {
        default: null,
      },
      locator: {
        default: null,
      },
      prefix: {
        default: null,
      },
      suffix: {
        default: null,
      },
      /**
       * Atributo interno usado sólo para forzar re-render
       * cuando cambian el estilo o los metadatos.
       */
      renderVersion: {
        default: 0,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-citation-ref-id]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    // Evitamos que renderVersion acabe como atributo HTML.
    const { renderVersion, ...restAttrs } = HTMLAttributes as any

    const attrs = mergeAttributes(restAttrs, {
      'data-citation-ref-id': node.attrs.refId,
      'data-citation-locator': node.attrs.locator,
      'data-citation-prefix': node.attrs.prefix,
      'data-citation-suffix': node.attrs.suffix,
      class: 'dsr-citation-inline',
    })

    const refId = (node.attrs.refId as string) || ''
    const basePlaceholder =
    refId.length > 0 ? `[cita:${refId}]` : '[cita]'

const getRef = this.options.getReferenceById
const getStyle = this.options.getCurrentStyle
const formatter = this.options.formatter

let label = basePlaceholder

if (refId && getRef && getStyle && formatter) {
  const ref = getRef(refId)
  if (ref) {
    const loc: CitationLocation = {
      locator: node.attrs.locator ?? null,
      prefix: node.attrs.prefix ?? null,
      suffix: node.attrs.suffix ?? null,
    }
    const style = getStyle()
    label = formatter.formatInText(ref, loc, style)
  }
}

// Espacio no separable al final para que el texto siguiente no quede pegado.
const labelWithSpace = `${label}\u00A0`

return ['span', attrs, labelWithSpace]
  },

  addCommands() {
    return {
      insertCitation:
      (attrs: CitationNodeAttrs) =>
      ({ chain }) => {
        if (!attrs.refId) return false

          return chain()
          .insertContent({
            type: this.name,
            attrs,
          })
          .run()
      },

      updateCurrentCitation:
      (attrs: Partial<CitationNodeAttrs>) =>
      ({ state, dispatch }) => {
        const { selection } = state
        const { $from } = selection

        const node = selection.node ?? $from.nodeAfter

        if (!node || node.type.name !== this.name) {
          return false
        }

        const pos = selection.from

        const newAttrs = {
          ...node.attrs,
          ...attrs,
        }

        const tr = state.tr.setNodeMarkup(pos, node.type, newAttrs)

        if (dispatch) {
          dispatch(tr)
        }

        return true
      },

      refreshCitations:
      (version: number) =>
      ({ state, dispatch }) => {
        const { tr } = state

        state.doc.descendants((node, pos) => {
          if (node.type.name === this.name) {
            const newAttrs = {
              ...node.attrs,
              renderVersion: version,
            }
            tr.setNodeMarkup(pos, node.type, newAttrs)
          }
        })

        if (dispatch) {
          dispatch(tr)
        }

        return true
      },
    }
  },
})
