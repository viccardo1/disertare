// packages/editor-citations/src/CitationInline.ts
import { Node, mergeAttributes } from '@tiptap/core'
import type {
  CitationFormatter,
  CitationLocation,
  CitationStyleId,
  Reference,
} from './types'
import { defaultCitationFormatter } from './formatter'

export interface CitationInlineOptions {
  getReferenceById: (id: string) => Reference | null | undefined
  getCurrentStyle: () => CitationStyleId
  formatter?: CitationFormatter
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citationInline: {
      /**
       * Inserta una cita inline para una referencia existente.
       */
      insertCitationInline: (attrs: {
        refId: string
        locator?: string
        prefix?: string
        suffix?: string
      }) => ReturnType
    }
  }
}

export const CitationInline = Node.create<CitationInlineOptions>({
  name: 'citationInline',

  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,

  addOptions() {
    return {
      getReferenceById: () => null,
                                                                 getCurrentStyle: () => 'apa' as CitationStyleId,
                                                                 formatter: defaultCitationFormatter,
    }
  },

  addAttributes() {
    return {
      refId: {
        default: null,
      },
      locator: {
        default: null,
      },
      prefix: {
        default: null,
      },
      suffix: {
        default: null,
      },
      citationNumber: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-citation-inline]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = mergeAttributes(HTMLAttributes, {
      'data-citation-inline': 'true',
      class: 'dsr-citation-inline',
    })

    const refId = node.attrs.refId as string | null
    const locator = (node.attrs.locator as string | null) ?? undefined
    const prefix = (node.attrs.prefix as string | null) ?? undefined
    const suffix = (node.attrs.suffix as string | null) ?? undefined
    const citationNumber = node.attrs.citationNumber as number | null

    const ref =
    (refId && this.options.getReferenceById(refId)) || (null as Reference | null)
    const style = this.options.getCurrentStyle()
    const formatter = this.options.formatter ?? defaultCitationFormatter

    let text = '(Referencia no encontrada)'

if (ref) {
  const location: CitationLocation = {
    locator,
    prefix,
    suffix,
  }
  if (citationNumber != null) {
    ref.citationNumber = citationNumber
  }
  text = formatter.formatInText(ref, location, style)
}

return ['span', attrs, text]
  },

  addCommands() {
    return {
      insertCitationInline:
      (attrs) =>
      ({ chain }) => {
        return chain()
        .insertContent({
          type: this.name,
          attrs,
        })
        .run()
      },
    }
  },
})
