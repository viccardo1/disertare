// packages/editor-citations/src/bibtex.ts
import type { Reference, ReferenceType, PersonName } from './types'

function mapBibType(raw: string): ReferenceType {
  const t = raw.toLowerCase()
  if (t === 'article') return 'article-journal'
  if (t === 'inproceedings' || t === 'conference') return 'conference-paper'
  if (t === 'book') return 'book'
  if (t === 'inbook' || t === 'incollection') return 'chapter'
  if (t === 'phdthesis' || t === 'mastersthesis' || t === 'thesis') return 'thesis'
  if (t === 'techreport') return 'report'
  if (t === 'misc' || t === 'unpublished' || t === 'manual') return 'other'
  return 'other'
}

function parseAuthorsField(value?: string): PersonName[] | undefined {
  if (!value) return undefined
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (!cleaned) return undefined

  const parts = cleaned.split(/\s+and\s+/i).map((s) => s.trim()).filter(Boolean)

  return parts.map<PersonName>((p) => {
    const withComma = p.split(',').map((s) => s.trim())
    if (withComma.length === 2) {
      const [family, given] = withComma
      return { family, given }
    }

    const tokens = p.split(/\s+/)
    if (tokens.length === 1) {
      return { family: tokens[0] }
    }
    const family = tokens[tokens.length - 1]
    const given = tokens.slice(0, -1).join(' ')
    return { family, given }
  })
}

function unquote(value: string): string {
  let v = value.trim()
  if (
    (v.startsWith('{') && v.endsWith('}')) ||
    (v.startsWith('"') && v.endsWith('"'))
  ) {
    v = v.slice(1, -1)
  }
  return v.trim()
}

/**
 * Parser BibTeX muy básico para F2.3.
 * No cubre todos los edge cases de BibTeX, pero funciona para entradas típicas
 * de artículos/libros (author, title, journal, year, etc.).
 */
export function parseBibTeX(input: string): Reference[] {
  const text = input.replace(/^\s*%.*$/gm, '') // quita comentarios

  const entries: Reference[] = []
  const entryRegex = /@(\w+)\s*\{\s*([^,]+)\s*,([\s\S]*?)\}\s*(?=@|$)/g
  let match: RegExpExecArray | null

  while ((match = entryRegex.exec(text))) {
    const [, rawType, key, body] = match
    const type = mapBibType(rawType)

    const fields: Record<string, string> = {}
    const fieldRegex =
      /(\w+)\s*=\s*(\{[^}]*\}|"[^"]*"|[^,\n]+)\s*(?:,|$)/g

    let f: RegExpExecArray | null
    while ((f = fieldRegex.exec(body))) {
      const name = f[1].toLowerCase()
      const value = unquote(f[2] ?? '')
      fields[name] = value
    }

    const author = parseAuthorsField(fields['author'])
    const yearStr = fields['year']
    const yearNum = yearStr ? parseInt(yearStr, 10) : NaN

    const ref: Reference = {
      id: key.trim(),
      type,
      title: fields['title'],
      containerTitle: fields['journal'] ?? fields['booktitle'],
      author: author && author.length ? author : undefined,
      issued:
        Number.isFinite(yearNum) && !Number.isNaN(yearNum)
          ? { year: yearNum }
          : undefined,
      volume: fields['volume'],
      issue: fields['number'],
      page: fields['pages'],
      publisher: fields['publisher'],
      publisherPlace: fields['address'],
      DOI: fields['doi'],
      URL: fields['url'],
    }

    entries.push(ref)
  }

  return entries
}

function personToBib(a: PersonName): string {
  if (a.family && a.given) {
    return `${a.family}, ${a.given}`
  }
  if (a.literal) return a.literal
  if (a.family) return a.family
  if (a.given) return a.given
  return ''
}

function formatAuthorsBib(authors?: PersonName[]): string | undefined {
  if (!authors || !authors.length) return undefined
  const parts = authors
    .map(personToBib)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!parts.length) return undefined
  return parts.join(' and ')
}

function escapeBib(value?: string): string | undefined {
  if (!value) return undefined
  return value.replace(/[\n\r]/g, ' ').trim()
}

/**
 * Serializador simple de referencias a BibTeX.
 * Genera @article, @book, @inproceedings o @misc según el tipo.
 */
export function formatBibTeX(refs: Reference[]): string {
  const chunks: string[] = []

  for (const ref of refs) {
    let bibType = 'misc'
    if (ref.type === 'article-journal') bibType = 'article'
    else if (ref.type === 'book') bibType = 'book'
    else if (ref.type === 'conference-paper') bibType = 'inproceedings'
    else if (ref.type === 'chapter') bibType = 'incollection'
    else if (ref.type === 'thesis') bibType = 'phdthesis'
    else if (ref.type === 'report') bibType = 'techreport'

    const id = ref.id || 'ref'

    const fields: Record<string, string | undefined> = {}

    const authorsBib = formatAuthorsBib(ref.author)
    if (authorsBib) fields['author'] = authorsBib
    fields['title'] = escapeBib(ref.title)
    fields['journal'] = escapeBib(ref.containerTitle)
    if (ref.issued?.year != null) {
      fields['year'] = String(ref.issued.year)
    }
    fields['volume'] = escapeBib(ref.volume)
    fields['number'] = escapeBib(ref.issue)
    fields['pages'] = escapeBib(ref.page)
    fields['publisher'] = escapeBib(ref.publisher)
    fields['address'] = escapeBib(ref.publisherPlace)
    fields['doi'] = escapeBib(ref.DOI)
    fields['url'] = escapeBib(ref.URL)

    const fieldLines = Object.entries(fields)
      .filter(([, v]) => v && v.length)
      .map(([k, v]) => `  ${k} = {${v}}`)

    const entry = `@${bibType}{${id},\n${fieldLines.join(',\n')}\n}`
    chunks.push(entry)
  }

  return chunks.join('\n\n')
}
