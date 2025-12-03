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

import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { GeoSpatialNodeView } from './GeoSpatialNodeView'

export interface GeoSpatialOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    geospatial: {
      /**
       * Inserta un mapa geoespacial (GeoJSON/TopoJSON) editable
       */
      setGeoSpatial: (attrs: { geojson: string; fileName?: string }) => ReturnType
    }
  }
}

export const GeoSpatial = Node.create<GeoSpatialOptions>({
  name: 'geospatial',
  group: 'block',
  content: 'text*',
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      geojson: {
        default: '',
        parseHTML: element => element.getAttribute('data-geojson'),
        renderHTML: attributes => {
          return { 'data-geojson': attributes.geojson }
        },
      },
      fileName: {
        default: 'map.geojson',
        parseHTML: element => element.getAttribute('data-file-name'),
        renderHTML: attributes => {
          return { 'data-file-name': attributes.fileName }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-geospatial]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-geospatial': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setGeoSpatial:
        attrs =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                geojson: attrs.geojson,
                fileName: attrs.fileName || 'map.geojson',
              },
            })
            .run()
        },
    }
  },

  addNodeView() {
    return GeoSpatialNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('geoPasteHandler'),
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData('text/plain')
            if (!text) return false

            try {
              const json = JSON.parse(text)
              if (
                (json.type === 'FeatureCollection' || json.type === 'Topology') &&
                json.features?.length > 0
              ) {
                const { schema, dispatch } = view.state
                const node = schema.nodes.geospatial.create({
                  geojson: text,
                  fileName: 'clipboard.geojson',
                })
                const transaction = view.state.tr.replaceSelectionWith(node)
                dispatch(transaction)
                event.preventDefault()
                return true
              }
            } catch {
              // Not valid GeoJSON/TopoJSON
            }
            return false
          },
        },
      }),
    ]
  },
})
