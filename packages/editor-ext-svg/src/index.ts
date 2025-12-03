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

// packages/editor-ext-svg/src/index.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import SvgNodeView from './SvgNodeView.vue'
import type { SvgAttributes, SvgViewSettings } from './types'

export const SvgExtension = Node.create({
  name: 'svgAdv',

  group: 'block',
  draggable: true,
  atom: true,

  addAttributes() {
    const defaultView: SvgViewSettings = {
      zoom: 1,
      panX: 0,
      panY: 0,
      showGrid: true,
      showGuides: true,
      snapToGrid: true,
      snapToGuides: true,
    }

    return {
      svgMarkup: {
        default: null,
      },
      viewBox: {
        default: null,
      },
      layers: {
        default: [],
      },
      activeLayerId: {
        default: null,
      },
      selection: {
        default: {
          type: null,
          ids: [],
        },
      },
      view: {
        default: defaultView,
      },
      lastBoolOp: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="svg-adv"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'svg-adv',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setSvgAdv:
        (attrs: Partial<SvgAttributes>) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run()
        },
      updateSvgMarkup:
        (svgMarkup: string) =>
        ({ state, tr, dispatch }) => {
          const { selection } = state
          const node = selection.node
          if (!node || node.type.name !== this.name) return false

          const pos = selection.$from.pos
          const newAttrs = {
            ...node.attrs,
            svgMarkup,
          }

          if (dispatch) {
            dispatch(tr.setNodeMarkup(pos, node.type, newAttrs))
          }

          return true
        },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(SvgNodeView)
  },
})

export { SvgNodeView }
export * from './types'
