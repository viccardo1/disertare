// packages/editor-ext-slides/src/index.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { SlidesNodeView } from './SlidesNodeView'
import type { SlideDto, SlidesThemeId } from './types'

export * from './types'

export interface SlidesOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    slides: {
      /**
       * Inserta una presentación editable tipo PowerPoint.
       */
      setSlides: (attrs?: {
        title?: string
        theme?: SlidesThemeId
        slides?: SlideDto[]
      }) => ReturnType
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
      /**
       * Título general del deck (no de la diapositiva actual).
       */
      title: {
        default: 'Presentación sin título',
          parseHTML: element => element.getAttribute('data-title'),
                                                 renderHTML: attrs =>
                                                 attrs.title
                                                 ? {
                                                   'data-title': attrs.title,
                                                 }
                                                 : {},
      },

      /**
       * Tema visual (plantilla de diseño ligera).
       */
      theme: {
        default: 'default' as SlidesThemeId,
          parseHTML: element =>
          (element.getAttribute('data-theme') as SlidesThemeId | null) ??
          'default',
          renderHTML: attrs =>
          attrs.theme && attrs.theme !== 'default'
? {
  'data-theme': attrs.theme,
}
: {},
      },

      /**
       * Representación JSON del deck (SlideDto[]).
       * Se usa para exportación PPTX / futura exportación PDF.
       */
      slides: {
        default: null as string | null,
          parseHTML: element => element.getAttribute('data-slides'),
                                                 renderHTML: attrs =>
                                                 attrs.slides
                                                 ? {
                                                   'data-slides': attrs.slides,
                                                 }
                                                 : {},
      },

      /**
       * Representación legacy en texto plano (F2.x):
       * Slide1\nBody1\n---\nSlide2\nBody2...
       * Se mantiene por compatibilidad y como fallback.
       */
      content: {
        default: '',
          parseHTML: element => element.getAttribute('data-content') ?? '',
                                                 renderHTML: attrs =>
                                                 attrs.content
                                                 ? {
                                                   'data-content': attrs.content,
                                                 }
                                                 : {},
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
        const slidesJson =
        attrs?.slides && attrs.slides.length
        ? JSON.stringify(attrs.slides)
        : null

        return chain()
        .insertContent({
          type: this.name,
          attrs: {
            title: attrs?.title || 'Presentación sin título',
            theme: attrs?.theme || 'default',
            slides: slidesJson,
            content: '',
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
                   // En F2.x no hay handler especial de pegado.
                   // Fases posteriores podrán enganchar aquí importaciones PPTX → Slides.
                 },
      }),
    ]
  },
})

export default Slides
