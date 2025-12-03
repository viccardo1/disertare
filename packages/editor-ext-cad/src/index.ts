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
import { CadNodeView } from './CadNodeView'

export interface CadOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    cad: {
      /**
       * Inserta un dibujo CAD (DXF) como imagen editable
       */
      setCad: (attrs: { dxfContent: string; fileName?: string }) => ReturnType
    }
  }
}

export const Cad = Node.create<CadOptions>({
  name: 'cad',
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
      dxfContent: {
        default: '',
        parseHTML: element => element.getAttribute('data-dxf'),
        renderHTML: attributes => {
          return { 'data-dxf': attributes.dxfContent }
        },
      },
      fileName: {
        default: 'dibujo.dxf',
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
        tag: 'div[data-disertare-cad]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-cad': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setCad:
        attrs =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                dxfContent: attrs.dxfContent,
                fileName: attrs.fileName || 'dibujo.dxf',
              },
            })
            .run()
        },
    }
  },

  addNodeView() {
    return CadNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('cadDropPasteHandler'),
        props: {
          handleDOMEvents: {
            drop(view, event) {
              const files = Array.from(event.dataTransfer?.files || [])
              const dxfFile = files.find(f => f.name.toLowerCase().endsWith('.dxf'))
              if (!dxfFile) return false

              event.preventDefault()
              const reader = new FileReader()
              reader.onload = () => {
                const { schema, dispatch } = view.state
                const node = schema.nodes.cad.create({
                  dxfContent: reader.result as string,
                  fileName: dxfFile.name,
                })
                const transaction = view.state.tr.replaceSelectionWith(node)
                dispatch(transaction)
              }
              reader.readAsText(dxfFile)
              return true
            },
          },
        },
      }),
    ]
  },
})
