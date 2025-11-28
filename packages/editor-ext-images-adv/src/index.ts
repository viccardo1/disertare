// packages/editor-ext-images-adv/src/index.ts

import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'

import ImagesAdvNodeView from './ImagesAdvNodeView.vue'
import {
  createDefaultAdjustments,
  createDefaultFilters,
  createDefaultLayer,
  type ImagesAdvAttributes,
  type RasterFormat,
} from './types'

export interface ImagesAdvOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imagesAdv: {
      /**
       * Inserta un nodo de imagen avanzada.
       */
      setImagesAdv: (attrs: Partial<ImagesAdvAttributes>) => ReturnType

      /**
       * Convierte la imagen seleccionada (nodo `image`) en `imagesAdv`.
       */
      convertImageToImagesAdv: () => ReturnType
    }
  }
}

export const ImagesAdvExtension = Node.create<ImagesAdvOptions>({
  name: 'imagesAdv',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'disertare-images-adv',
      },
    }
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      title: { default: '' },
      format: { default: 'webp' as RasterFormat },
        width: { default: null },
        height: { default: null },

        layers: {
          default: () => [createDefaultLayer()],
        },
        activeLayerId: {
          default: 'base',
        },

        adjustments: {
          default: () => createDefaultAdjustments(),
        },
        filters: {
          default: () => createDefaultFilters(),
        },

        selectionType: {
          default: null,
        },
        selectionRect: {
          default: null,
        },

        removeExif: {
          default: true,
        },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-images-adv]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { 'data-images-adv': 'true' },
      ),
      ['img', { src: HTMLAttributes.src || '', alt: HTMLAttributes.alt || '' }],
    ]
  },

  addNodeView(): NodeViewRenderer {
    return VueNodeViewRenderer(ImagesAdvNodeView)
  },

  addCommands() {
    return {
      setImagesAdv:
      attrs =>
      ({ commands }) => {
        const defaults: ImagesAdvAttributes = {
          src: attrs.src ?? null,
          alt: attrs.alt ?? '',
          title: attrs.title ?? '',
          format: attrs.format ?? 'webp',
            width: attrs.width ?? null,
            height: attrs.height ?? null,
            layers: attrs.layers ?? [createDefaultLayer()],
                                                                activeLayerId: attrs.activeLayerId ?? 'base',
                                                                adjustments: attrs.adjustments ?? createDefaultAdjustments(),
                                                                filters: attrs.filters ?? createDefaultFilters(),
                                                                selectionType: attrs.selectionType ?? null,
                                                                selectionRect: attrs.selectionRect ?? null,
                                                                removeExif: attrs.removeExif ?? true,
        }

        return commands.insertContent({
          type: 'imagesAdv',
          attrs: defaults,
        })
      },

      convertImageToImagesAdv:
      () =>
      ({ state, tr, dispatch }) => {
        const { selection, schema } = state
        const imageType = schema.nodes.image
        const advType = schema.nodes.imagesAdv

        if (!imageType || !advType) return false
          const node = selection.node
          if (!node || node.type !== imageType) return false

            const pos = selection.$from.pos
            const attrs = node.attrs as any

            const advAttrs: Partial<ImagesAdvAttributes> = {
              src: attrs.src ?? null,
              alt: attrs.alt ?? '',
              title: attrs.title ?? '',
              width:
              typeof attrs.width === 'string'
? parseInt(attrs.width, 10) || null
: attrs.width ?? null,
height:
typeof attrs.height === 'string'
? parseInt(attrs.height, 10) || null
: attrs.height ?? null,
            }

            const newNode = advType.create(advAttrs)

            tr = tr.setNodeMarkup(pos, advType, newNode.attrs)

            if (dispatch) {
              dispatch(tr)
            }
            return true
      },
    }
  },
})
