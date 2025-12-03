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
import { ImageNodeView } from './ImageNodeView'

export interface ImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /**
       * Inserta una imagen con URL, archivo o base64
       */
      setImage: (attrs: { src: string; alt?: string; title?: string }) => ReturnType
    }
  }
}

export const Image = Node.create<ImageOptions>({
  name: 'image',
  selectable: true,
  draggable: true,
  allowGapCursor: true,
  atom: true,

  addOptions() {
    return {
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? 'inline' : 'block'
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          return { src: attributes.src }
        },
      },
      alt: {
        default: '',
        parseHTML: element => element.getAttribute('alt'),
        renderHTML: attributes => {
          return { alt: attributes.alt }
        },
      },
      title: {
        default: '',
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => {
          return { title: attributes.title }
        },
      },
      width: {
        default: 'auto',
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          return { width: attributes.width }
        },
      },
      height: {
        default: 'auto',
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          return { height: attributes.height }
        },
      },
      rotation: {
        default: 0,
        parseHTML: element => element.getAttribute('data-rotation') || '0',
        renderHTML: attributes => {
          return { 'data-rotation': attributes.rotation }
        },
      },
      flipX: {
        default: false,
        parseHTML: element => element.hasAttribute('data-flip-x'),
        renderHTML: attributes => {
          return { 'data-flip-x': attributes.flipX ? '' : null }
        },
      },
      flipY: {
        default: false,
        parseHTML: element => element.hasAttribute('data-flip-y'),
        renderHTML: attributes => {
          return { 'data-flip-y': attributes.flipY ? '' : null }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setImage:
        attrs =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
    }
  },

  addNodeView() {
    return ImageNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('imagePasteHandler'),
        props: {
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items || [])
            const imageItem = items.find(item => item.type.startsWith('image/'))
            if (!imageItem) return false

            const file = imageItem.getAsFile()
            if (!file) return false

            const reader = new FileReader()
            reader.onload = () => {
              const { schema, dispatch } = view.state
              const node = schema.nodes.image.create({
                src: reader.result as string,
                alt: file.name,
              })
              const transaction = view.state.tr.replaceSelectionWith(node)
              dispatch(transaction)
              event.preventDefault()
            }
            reader.readAsDataURL(file)
            return true
          },
        },
      }),
    ]
  },
})
