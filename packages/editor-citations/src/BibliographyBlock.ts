// packages/editor-citations/src/BibliographyBlock.ts
import { Node, mergeAttributes } from '@tiptap/core'
import type { CitationStyleId, Reference, PersonName } from './types'

export interface BibliographyOptions {
  getReferences?: () => Reference[]
  getCurrentStyle?: () => CitationStyleId
}

/**
 * Formatea un nombre de persona para bibliografía:
 * "Apellido, N. N."
 */
function formatPersonName(name: PersonName): string {
  if (name.family && name.given) {
    const initials = name.given
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => `${p[0]!.toUpperCase()}.`)
    .join(' ')
    return `${name.family}, ${initials}`
  }

  if (name.literal) {
    return name.literal
  }

  if (name.family) {
    return name.family
  }

  return name.given ?? 'Autor'
}

function formatAuthors(ref: Reference, style: CitationStyleId): string {
  const list = ref.author ?? []
  if (!list.length) return 'Autor desconocido'

    if (style === 'vancouver' || style === 'ieee') {
      // Estilos numéricos: "Apellido IN", "Apellido IN, Apellido IN"
      const parts = list.map((n) => {
        if (n.family && n.given) {
          const initials = n.given
          .split(/\s+/)
          .filter(Boolean)
          .map((p) => p[0]!.toUpperCase())
          .join('')
          return `${n.family} ${initials}`
        }
        if (n.literal) return n.literal
          return n.family ?? n.given ?? 'Autor'
      })

      if (parts.length <= 6) {
        return parts.join(', ')
      }
      return `${parts.slice(0, 6).join(', ')}, et al.`
    }

    // Resto: estilo tipo APA/Harvard "Apellido, N. N." con "&"/"et al."
    if (list.length === 1) {
      return formatPersonName(list[0]!)
    }

    if (list.length === 2) {
      return `${formatPersonName(list[0]!)} & ${formatPersonName(list[1]!)}`
    }

    const firstThree = list.slice(0, 3).map(formatPersonName)
    if (list.length <= 3) {
      return firstThree.join(', ')
    }
    return `${firstThree.join(', ')}, et al.`
}

function formatYear(ref: Reference): string {
  const year = ref.issued?.year
  if (typeof year === 'number') {
    return String(year)
  }
  return 's. f.'
}

/**
 * Formatea una entrada de bibliografía básica según el estilo.
 * Aquí mantenemos la lógica simple, pero corregimos la puntuación:
 * NO añadimos un punto extra después de `authors`.
 */
function formatBibliographyEntry(
  ref: Reference,
  style: CitationStyleId,
): string {
  const authors = formatAuthors(ref, style)
  const year = formatYear(ref)
  const title = ref.title ?? '[Sin título]'

  switch (style) {
    case 'mla':
      // Apellido, Nombre. Título. Año.
      // OJO: authors ya trae el punto de las iniciales, no añadimos otro.
      return `${authors} ${title}. ${year}.`

    case 'chicago':
      // Apellido, Nombre. Título. Año.
      return `${authors} ${title}. ${year}.`

    case 'vancouver':
    case 'ieee':
      // Autores. Título. Año.
      return `${authors} ${title}. ${year}.`

    case 'acs':
    case 'iso690':
    case 'turabian':
    case 'harvard':
    case 'apa':
    default:
      // Autor, N. N. (Año). Título.
      return `${authors} (${year}). ${title}.`
  }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bibliography: {
      /**
       * Inserta un bloque de bibliografía en la posición actual.
       */
      insertBibliography: (attrs?: {
        title?: string
        style?: CitationStyleId | null
      }) => ReturnType
    }
  }
}

export const Bibliography = Node.create<BibliographyOptions>({
  name: 'bibliography',

  group: 'block',
  content: '',
  defining: true,

  addOptions() {
    return {
      getReferences: () => [],
                                                             getCurrentStyle: () => 'apa' as CitationStyleId,
    }
  },

  addAttributes() {
    return {
      title: {
    default: 'Referencias',
      },
      style: {
    default: null,
      },
      /**
       * Atributo interno para poder forzar un re-render cuando
       * cambian las referencias o el estilo.
       */
      renderVersion: {
    default: 0,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-bibliography]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    // No necesitamos exponer renderVersion al HTML
    const { renderVersion, ...restAttrs } = HTMLAttributes as any

    const attrs = mergeAttributes(restAttrs, {
      'data-bibliography': 'true',
      class: 'dsr-bibliography',
    })

    const getRefs = this.options.getReferences
    const getStyle = this.options.getCurrentStyle

    const refs: Reference[] = getRefs ? getRefs() : []
    const style: CitationStyleId =
    (getStyle && getStyle()) ||
    (node.attrs.style as CitationStyleId | null) ||
    ('apa' as CitationStyleId)

    const titleText: string = node.attrs.title || 'Referencias'

const entries = refs.map((ref) => formatBibliographyEntry(ref, style))
const listItems = entries.map((entry) => ['li', {}, entry])

return [
  'section',
  attrs,
  ['div', { class: 'dsr-bibliography__title' }, titleText],
  ['ol', { class: 'dsr-bibliography__list' }, ...listItems],
]
  },

  addCommands() {
    return {
      insertBibliography:
      (attrs) =>
      ({ chain }) => {
        const title = attrs?.title ?? 'Referencias'
const style = attrs?.style ?? null

return chain()
.insertContent({
  type: this.name,
  attrs: {
    title,
    style,
  },
})
.run()
      },
    }
  },
})
