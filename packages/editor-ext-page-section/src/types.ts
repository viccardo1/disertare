// packages/editor-ext-page-section/src/types.ts

/**
 * Plantilla de encabezado/pie que puede usarse en varias secciones.
 * No hace nada "mágico": son simplemente strings con placeholders
 * como {PAGE}, {PAGES}, {TITLE}, {DATE}, {AUTHOR}, {SECTION}.
 *
 * La resolución de esos placeholders la hará el frontend (F2.5)
 * usando los metadatos del documento y la información de paginado.
 */
export interface PageHeaderFooterTemplate {
  id: string
  name: string
  header?: string
  footer?: string
}

/**
 * Configuración de una sección de página.
 * Permite modelar:
 *  - Primera página diferente (firstPageDifferent)
 *  - Encabezados/pies distintos para páginas impares/pares (oddEvenDifferent)
 */
export interface PageSectionConfig {
  id: string
  name?: string

  /**
   * Referencia a una plantilla base opcional.
   * Útil para cuando en el futuro existan plantillas globales por formato.
   */
  templateId?: string

  /**
   * Si true, la primera página de la sección puede tener
   * encabezado/pie específicos.
   */
  firstPageDifferent?: boolean

  /**
   * Si true, se pueden definir encabezados/pies distintos
   * para páginas impares y pares dentro de la sección.
   */
  oddEvenDifferent?: boolean

  // Overrides opcionales de encabezado/pie

  firstPageHeader?: string
  firstPageFooter?: string

  oddHeader?: string
  oddFooter?: string

  evenHeader?: string
  evenFooter?: string

  /**
   * Header/footer "general" (si no aplica first/odd/even
   * o si no se quieren distinguir).
   */
  header?: string
  footer?: string
}

/**
 * Punto de ruptura de sección: a partir de `pos` (posición en el doc TipTap)
 * comienza la sección indicada por `sectionId`.
 */
export interface PageSectionBreak {
  pos: number
  sectionId: string
}

/**
 * Estado completo gestionado por la extensión.
 * Se guarda en `editor.storage.pageSection` y se puede leer
 * desde los composables del frontend.
 */
export interface PageSectionState {
  sections: PageSectionConfig[]
  breaks: PageSectionBreak[]
}
