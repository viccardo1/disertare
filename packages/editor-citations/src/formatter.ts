// packages/editor-citations/src/formatter.ts
import type {
  CitationFormatter,
  CitationLocation,
  CitationStyleId,
  DateParts,
  PersonName,
  Reference,
} from './types'

function primarySurname(authors?: PersonName[]): string | null {
  if (!authors || authors.length === 0) return null
    const a = authors[0]!
    if (a.family) return a.family
      if (a.literal) return a.literal
        if (a.given) return a.given
          return null
}

function formatYear(issued?: DateParts): string {
  if (!issued || issued.year == null) return 's. f.'
    return String(issued.year)
}

function initialsFromGiven(given?: string): string {
  if (!given) return ''
    const parts = given.split(/\s+/).filter(Boolean)
    return parts.map((p) => `${p[0]!.toUpperCase()}.`).join(' ')
}

function formatAuthorsAPA(authors?: PersonName[]): string {
  if (!authors || authors.length === 0) return ''

    if (authors.length === 1) {
      const a = authors[0]!
      const family = a.family ?? a.literal ?? a.given ?? ''
      const initials = initialsFromGiven(a.given)
      return initials ? `${family}, ${initials}` : family
    }

    if (authors.length === 2) {
      const [a1, a2] = authors
      const f1 = a1.family ?? a1.literal ?? a1.given ?? ''
      const f2 = a2.family ?? a2.literal ?? a2.given ?? ''
      return `${f1} & ${f2}`
    }

    const a1 = authors[0]!
    const f1 = a1.family ?? a1.literal ?? a1.given ?? ''
    return `${f1} et al.`
}

function formatAuthorsVancouver(authors?: PersonName[]): string {
  if (!authors || authors.length === 0) return ''
    const mapped = authors.slice(0, 6).map((a) => {
      const family = a.family ?? a.literal ?? a.given ?? ''
    const initials = initialsFromGiven(a.given).replace(/\./g, '')
    return initials ? `${family} ${initials}` : family
    })
    if (authors.length > 6) mapped.push('et al')
      return mapped.join(', ')
}

function formatUrlOrDoi(ref: Reference): string {
  if (ref.DOI) return `https://doi.org/${ref.DOI}`
    return ref.URL ?? ''
}

/**
 * Formateador por defecto para F2.x.
 * Cubre:
 *  - Citas en texto autor-año (APA/Harvard/Chicago-like)
 *  - Citas numéricas estilo Vancouver
 *  - Entradas de bibliografía básicas.
 */
export const defaultCitationFormatter: CitationFormatter = {
  formatInText(reference: Reference, loc: CitationLocation, style: CitationStyleId): string {
    const surname = primarySurname(reference.author) ?? 'Autor'
    const year = formatYear(reference.issued)

    if (style === 'vancouver' && reference.citationNumber != null) {
      // Estilo Vancouver numérico simple: [n] con localizador opcional.
      let text = `[${reference.citationNumber}]`
      if (loc.locator) {
        text = `${text} (${loc.locator})`
      }
      if (loc.prefix) {
        text = `${loc.prefix} ${text}`
      }
      if (loc.suffix) {
        text = `${text} ${loc.suffix}`
      }
      return text
    }

    // Estilos autor-fecha tipo APA / MLA / Chicago / etc.
    let core = `${surname}, ${year}`

    if (loc.locator) {
      // Si parece rango (141-146), usamos "pp.", si no "p."
      const pagesLabel = /[-–]/.test(loc.locator) ? 'pp.' : 'p.'
      core = `${core}, ${pagesLabel} ${loc.locator}`
    }

    let text = `(${core})`

    if (loc.prefix) {
      text = `${loc.prefix} ${text}`
    }
    if (loc.suffix) {
      text = `${text} ${loc.suffix}`
    }

    return text
  },

  formatBibliographyEntry(reference: Reference, style: CitationStyleId): string {
    const year = formatYear(reference.issued)
    const title = reference.title ?? '[Sin título]'
    const container = reference.containerTitle
    const volume = reference.volume
    const issue = reference.issue
    const pages = reference.page
    const urlOrDoi = formatUrlOrDoi(reference)

    if (style === 'vancouver') {
      const authors = formatAuthorsVancouver(reference.author)
      const parts: string[] = []

      if (authors) parts.push(authors)
        if (title) parts.push(title)

          let tail = ''
          if (container) {
            tail += container
          }
          if (year) {
            tail += tail ? `. ${year}` : year
          }
          if (volume) {
            tail += tail ? `;${volume}` : volume
          }
          if (issue) {
            tail += `(${issue})`
          }
          if (pages) {
            tail += `:${pages}`
          }
          if (tail) parts.push(tail)
            if (urlOrDoi) parts.push(urlOrDoi)

              return parts.join('. ') + '.'
    }

    // APA-like para el resto de estilos
    const authors = formatAuthorsAPA(reference.author)
    const parts: string[] = []

    if (authors) parts.push(`${authors}`)
      if (year) parts.push(`(${year}).`)
        if (title) parts.push(`${title}.`)

          if (container) {
            let journal = container
            if (volume) {
              journal += `, ${volume}`
              if (issue) {
                journal += `(${issue})`
              }
            }
            if (pages) {
              journal += `, ${pages}`
            }
            journal += '.'
            parts.push(journal)
          } else if (pages) {
            parts.push(`${pages}.`)
          }

          if (urlOrDoi) {
            parts.push(urlOrDoi)
          }

          return parts.join(' ')
  },
}
