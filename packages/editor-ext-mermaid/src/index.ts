import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { MermaidNodeView } from './MermaidNodeView'

export const Mermaid = Node.create({
  name: 'mermaid',
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
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-mermaid]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-mermaid': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setMermaid:
      attrs =>
      ({ chain }) => {
        return chain()
        .insertContent({
          type: this.name,
          attrs: {
            content: attrs.content || '',
          },
        })
        .run()
      },
    }
  },

  addNodeView() {
    return MermaidNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mermaidDropHandler'),
                 props: {
                   handleDOMEvents: {
                     drop(view, event) {
                       const files = Array.from(event.dataTransfer?.files || [])
                       const mermaidFile = files.find(f => f.name.toLowerCase().endsWith('.mmd'))
                       if (!mermaidFile) return false

                         event.preventDefault()
                         const reader = new FileReader()
                         reader.onload = () => {
                           const content = reader.result as string
                           const { schema, dispatch } = view.state

                           const node = schema.nodes.mermaid.create({
                             content,
                           })

                           const transaction = view.state.tr.replaceSelectionWith(node)
                           dispatch(transaction)
                         }
                         reader.readAsText(mermaidFile)
                         return true
                     },
                   },
                 },
      }),
    ]
  },
})
