// packages/editor-citations/src/types.ts

/**
 * Estilos de cita soportados en F2.3.
 *
 * Nota: los IDs son estables y alineados con el plan maestro:
 * APA, MLA, Chicago, Harvard, Vancouver, IEEE, ACS, ISO 690, Turabian.
 */
export type CitationStyleId =
| 'apa'
| 'mla'
| 'chicago'
| 'harvard'
| 'vancouver'
| 'ieee'
| 'acs'
| 'iso690'
| 'turabian'

/**
 * Tipos de referencia básicos, compatibles con CSL/BibTeX.
 * Esto se puede extender en la misma F2.3 sin romper contratos.
 */
export type ReferenceType =
| 'article-journal'
| 'book'
| 'chapter'
| 'thesis'
| 'report'
| 'webpage'
| 'conference-paper'
| 'dataset'
| 'other'

/**
 * Representación simplificada de un nombre de persona, compatible
 * con el modelo de CSL (given/family/literal).
 */
export interface PersonName {
  given?: string
  family?: string
  literal?: string
}

/**
 * Fecha simplificada compatible con CSL: año obligatorio, mes/día opcionales.
 */
export interface DateParts {
  year?: number
  month?: number
  day?: number
}

/**
 * Modelo mínimo de referencia bibliográfica para F2.3.
 * Está pensado para mapearse 1:1 a CSL-JSON / BibTeX en la misma fase.
 */
export interface Reference {
  id: string
  type: ReferenceType

  title?: string
  containerTitle?: string // revista / libro / actas
  author?: PersonName[]
  issued?: DateParts

  volume?: string
  issue?: string
  page?: string
  edition?: string

  publisher?: string
  publisherPlace?: string

  DOI?: string
  URL?: string

  accessed?: DateParts

  // Metadatos adicionales (tags, notas internas, etc.)
  tags?: string[]
  note?: string

  /**
   * Número de cita secuencial para estilos numéricos (p. ej. Vancouver).
   */
  citationNumber?: number
}

/**
 * Atributos que acompañan a una cita concreta en el texto.
 * Ejemplo: "cf. Smith (2010, p. 23)" → prefix, locator, suffix.
 */
export interface CitationLocation {
  prefix?: string | null
  suffix?: string | null
  locator?: string | null // p. ej. "23", "pp. 23-25", "cap. 2"
  position?: 'first' | 'subsequent' | 'ibid'
}

/**
 * Atributos del nodo inline de cita en el documento.
 */
export interface CitationNodeAttrs {
  refId: string
  locator?: string | null
  prefix?: string | null
  suffix?: string | null
}

/**
 * Atributos del nodo de bibliografía (bloque).
 */
export interface BibliographyNodeAttrs {
  style: CitationStyleId
  title?: string | null
}

/**
 * Contrato interno para un formateador de citas.
 */
export interface CitationFormatter {
  formatInText(
    reference: Reference,
    loc: CitationLocation,
    style: CitationStyleId,
  ): string

  formatBibliographyEntry(
    reference: Reference,
    style: CitationStyleId,
  ): string
}
