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
import { PrismNodeView } from './PrismNodeView'

export const Prism = Node.create({
  name: 'prism',
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
      language: {
        default: 'plaintext',
          parseHTML: element => element.getAttribute('data-language'),
                                 renderHTML: attributes => {
                                   return { 'data-language': attributes.language }
                                 },
      },
      content: {
        default: '',
          parseHTML: element => element.getAttribute('data-content'),
                                 renderHTML: attributes => {
                                   return { 'data-content': attributes.content }
                                 },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-prism]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-prism': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setPrism:
      attrs =>
      ({ chain }) => {
        return chain()
        .insertContent({
          type: this.name,
          attrs: {
            language: attrs.language || 'plaintext',
            content: attrs.content || '',
          },
        })
        .run()
      },
    }
  },

  addNodeView() {
    return PrismNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('prismDropHandler'),
                 props: {
                   handleDOMEvents: {
                     drop(view, event) {
                       const files = Array.from(event.dataTransfer?.files || [])
                       const prismFile = files.find(f => f.name.toLowerCase().endsWith('.txt') || f.name.toLowerCase().endsWith('.js') || f.name.toLowerCase().endsWith('.py'))
                       if (!prismFile) return false

                         event.preventDefault()
                         const reader = new FileReader()
                         reader.onload = () => {
                           const content = reader.result as string
                           const { schema, dispatch } = view.state

                           const node = schema.nodes.prism.create({
                             language: 'plaintext',
                             content,
                           })

                           const transaction = view.state.tr.replaceSelectionWith(node)
                           dispatch(transaction)
                         }
                         reader.readAsText(prismFile)
                         return true
                     },
                   },
                 },
      }),
    ]
  },
})
