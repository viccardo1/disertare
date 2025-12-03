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
 * Forma geométrica de un contenedor de texto.
 * Se usan coordenadas normalizadas (0–1) relativas al ancho/alto
 * del recurso asociado (imagen raster o SVG).
 *
 * Esto permite que F3.x pueda reutilizar la misma definición
 * en distintos tamaños de página / resolución.
 */
export interface TextContainerShape {
  /**
   * Tipo de figura utilizada para el contenedor.
   * En F2.19 se soportan rectángulos y polígonos generales.
   */
  kind: 'rect' | 'polygon'

  /**
   * Lista de puntos que definen la figura.
   * Para 'rect' se esperarán 2 o 4 puntos (según la implementación
   * futura del motor); para 'polygon', 3 o más puntos.
   *
   * Las coordenadas están normalizadas:
   *  - x en [0, 1] relativo al ancho del recurso
   *  - y en [0, 1] relativo al alto del recurso
   */
  points: { x: number; y: number }[]
}

/**
 * Región de contenedor de texto asociada a un recurso gráfico
 * (imagen raster o SVG).
 *
 * No impone cómo se resuelve el recurso: solo guarda
 * un identificador estable (`resourceId`) que deberá
 * ser resuelto por el dominio de imágenes/SVG.
 */
export interface TextContainerRegion {
  /**
   * Identificador único de la región dentro de la sección.
   */
  id: string

  /**
   * Identificador del recurso gráfico al que está anclada
   * esta región (por ejemplo, un nodo de imagen o SVG).
   */
  resourceId: string

  /**
   * Figura geométrica que define el área de texto.
   */
  shape: TextContainerShape
}

/**
 * Configuración de layout asociada a una sección.
 *
 * En F2.19 se modelan:
 *  - número de columnas lógicas para el flujo de texto
 *  - contenedores de texto ligados a recursos gráficos
 *
 * El motor de paginado (F2.5/F2.19) y la exportación se apoyarán
 * en estos metadatos sin duplicar contenido lógico.
 */
export interface SectionLayoutConfig {
  /**
   * Número de columnas lógicas de la sección.
   * Si es null/undefined, se asume 1 columna.
   */
  columns?: number | null

  /**
   * Conjunto opcional de contenedores de texto asociados
   * a la sección.
   *
   * F2.19 solo define la estructura; la lógica completa
   * de distribución de texto puede evolucionar en F3.x.
   */
  containers?: TextContainerRegion[] | null
}

/**
 * Configuración de una sección de página.
 * Permite modelar:
 *  - Primera página diferente (firstPageDifferent)
 *  - Encabezados/pies distintos para páginas impares/pares (oddEvenDifferent)
 *  - Layout de columnas y contenedores de texto (F2.19)
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

  /**
   * Configuración de layout de la sección (F2.19).
   * Es opcional para mantener compatibilidad con documentos
   * anteriores a F2.19.
   */
  layout?: SectionLayoutConfig
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
