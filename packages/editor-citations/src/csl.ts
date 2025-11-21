// packages/editor-citations/src/csl.ts
import type { Reference, PersonName, DateParts } from './types'

type CslName = {
  given?: string
  family?: string
  literal?: string
}

type CslDate = {
  'date-parts'?: (number | null | undefined)[][]
}

type CslItem = {
  id?: string
  type?: string
  title?: string
  'container-title'?: string
  author?: CslName[]
  issued?: CslDate
  volume?: string
  issue?: string
  page?: string
  publisher?: string
  'publisher-place'?: string
  DOI?: string
  URL?: string
}

/**
 * Convierte referencias internas a CSL-JSON (forma estándar).
 */
export function toCslJson(refs: Reference[]): CslItem[] {
  const items: CslItem[] = []

  for (const ref of refs) {
    const issued: CslDate | undefined = ref.issued?.year
      ? {
          'date-parts': [
            [
              ref.issued.year,
              ref.issued.month ?? null,
              ref.issued.day ?? null,
            ],
          ],
        }
      : undefined

    const author: CslName[] | undefined = ref.author
      ? ref.author.map((a) => ({
          given: a.given,
          family: a.family,
          literal: a.literal,
        }))
      : undefined

    items.push({
      id: ref.id,
      type: ref.type,
      title: ref.title,
      'container-title': ref.containerTitle,
      author,
      issued,
      volume: ref.volume,
      issue: ref.issue,
      page: ref.page,
      publisher: ref.publisher,
      'publisher-place': ref.publisherPlace,
      DOI: ref.DOI,
      URL: ref.URL,
    })
  }

  return items
}

function mapCslType(raw?: string): string | undefined {
  if (!raw) return undefined
  return raw // usamos los mismos IDs que Reference.type
}

function parseCslDate(d?: CslDate): DateParts | undefined {
  if (!d || !d['date-parts'] || !d['date-parts'].length) return undefined
  const first = d['date-parts'][0] || []
  const [year, month, day] = first
  if (typeof year !== 'number') return undefined
  const result: DateParts = { year }
  if (typeof month === 'number') result.month = month
  if (typeof day === 'number') result.day = day
  return result
}

function parseCslAuthors(authors?: CslName[]): PersonName[] | undefined {
  if (!authors || !authors.length) return undefined
  const result: PersonName[] = authors.map((a) => ({
    given: a.given,
    family: a.family,
    literal: a.literal,
  }))
  return result.length ? result : undefined
}

/**
 * Convierte CSL-JSON a referencias internas.
 * No valida esquemas exhaustivamente; toma campos principales.
 */
export function fromCslJson(items: CslItem[]): Reference[] {
  const refs: Reference[] = []

  for (const item of items) {
    const id = (item.id || `ref-${Math.random().toString(36).slice(2, 10)}`).trim()

    const ref: Reference = {
      id,
      type: (mapCslType(item.type) as any) || 'article-journal',
      title: item.title,
      containerTitle: item['container-title'],
      author: parseCslAuthors(item.author),
      issued: parseCslDate(item.issued),
      volume: item.volume,
      issue: item.issue,
      page: item.page,
      publisher: item.publisher,
      publisherPlace: item['publisher-place'],
      DOI: item.DOI,
      URL: item.URL,
    }

    refs.push(ref)
  }

  return refs
}
