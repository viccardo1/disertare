// packages/editor-parts/src/types.ts

export type AcademicFormatId = 'thesis' | 'article' | 'report'

export type AcademicPartId =
| 'cover'
| 'dedication'
| 'acknowledgements'
| 'abstract'
| 'results'
| 'conclusions'
| 'references'
| 'appendices'
| 'ethics'
| 'executiveSummary'
| 'conclusionsRecommendations'

export interface AcademicPartLabel {
  es: string
  en: string
}

export interface AcademicPartDefinition {
  id: AcademicPartId
  label: AcademicPartLabel
  /**
   * Si la parte viene marcada por defecto cuando se selecciona el formato.
   */
  defaultSelected: boolean
    /**
     * Indica si esta parte debe aparecer en el índice académico.
     * (La portada normalmente se excluye).
     */
    includeInToc: boolean
}

export interface AcademicFormatDefinition {
  id: AcademicFormatId
  label: string
  description: string
  parts: AcademicPartDefinition[]
}
