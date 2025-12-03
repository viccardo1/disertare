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
import { KatexNodeView } from './KatexNodeView'

export const Katex = Node.create({
  name: 'katex',
  content: 'text*',
  group: 'block',
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      content: {
        default: '',
          parseHTML: element => element.getAttribute('data-content'),
                                 renderHTML: attributes => {
                                   return { 'data-content': attributes.content }
                                 },
      },
      inline: {
        default: false,
          parseHTML: element => element.hasAttribute('data-inline'),
                                 renderHTML: attributes => {
                                   return { 'data-inline': attributes.inline ? '' : null }
                                 },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-katex]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-katex': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setKatex:
      attrs =>
      ({ chain }) => {
        return chain()
        .insertContent({
          type: this.name,
          attrs: {
            content: attrs.content || '',
            inline: attrs.inline || false,
          },
        })
        .run()
      },
    }
  },

  addNodeView() {
    return KatexNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('katexDropHandler'),
                 props: {
                   handleDOMEvents: {
                     drop(view, event) {
                       const files = Array.from(event.dataTransfer?.files || [])
                       const katexFile = files.find(f => f.name.toLowerCase().endsWith('.tex'))
                       if (!katexFile) return false

                         event.preventDefault()
                         const reader = new FileReader()
                         reader.onload = () => {
                           const content = reader.result as string
                           const { schema, dispatch } = view.state

                           const node = schema.nodes.katex.create({
                             content,
                             inline: false,
                           })

                           const transaction = view.state.tr.replaceSelectionWith(node)
                           dispatch(transaction)
                         }
                         reader.readAsText(katexFile)
                         return true
                     },
                   },
                 },
      }),
    ]
  },
})
