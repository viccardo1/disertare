import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { SlidesNodeView } from './SlidesNodeView'

export interface SlidesOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    slides: {
      /**
       * Inserta una presentación editable tipo PowerPoint
       */
      setSlides: (attrs?: { title?: string; slideCount?: number }) => ReturnType
    }
  }
}

export const Slides = Node.create<SlidesOptions>({
  name: 'slides',
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
      title: {
        default: 'Presentación sin título',
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => {
          return { 'data-title': attributes.title }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-slides]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-slides': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setSlides:
        attrs =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                title: attrs?.title || 'Presentación sin título',
              },
            })
            .run()
        },
    }
  },

  addNodeView() {
    return SlidesNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('slidesHandler'),
        props: {
          // No paste handler en F2 (solo en F2.12 con PPTX)
        },
      }),
    ]
  },
})
