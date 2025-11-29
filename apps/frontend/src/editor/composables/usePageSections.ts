import { reactive } from 'vue'

export interface HeaderFooterTemplates {
  /**
   * Plantilla para la primera página de la sección.
   */
  first?: string
  /**
   * Plantilla por defecto (páginas impares).
   */
  default?: string
    /**
     * Plantilla específica para páginas pares.
     */
    even?: string
}

/**
 * Forma geométrica de un contenedor de texto.
 * Coordenadas normalizadas (0–1) relativas al recurso
 * (imagen raster o SVG) al que pertenece.
 */
export interface TextContainerShape {
  kind: 'rect' | 'polygon'
  points: { x: number; y: number }[]
}

/**
 * Región de texto asociada a un recurso gráfico.
 * Aquí solo se almacenan metadatos; la interpretación
 * visual se hará en el motor de layout / exportación.
 */
export interface TextContainerRegion {
  id: string
  resourceId: string
  shape: TextContainerShape
}

/**
 * Configuración de layout de la sección:
 *  - columnas lógicas
 *  - contenedores de texto
 *
 * Es opcional para mantener compatibilidad con documentos
 * anteriores a F2.19.
 */
export interface SectionLayoutConfig {
  /**
   * Número de columnas lógicas. Si es null/undefined,
   * se interpreta como 1 columna.
   */
  columns?: number | null

  /**
   * Contenedores de texto asociados a recursos gráficos.
   * F2.19 solo define la estructura.
   */
  containers?: TextContainerRegion[] | null
}

/**
 * Configuración de la sección actual (modelo simplificado
 * en el frontend: una sola sección global).
 *
 * El dominio de extensiones gestiona múltiples secciones,
 * pero este composable expone un estado usable por la UI
 * de encabezados/pies y layout.
 */
export interface PageSectionConfig {
  /**
   * Nombre de la sección (solo informativo por ahora).
   */
  name: string
  header: HeaderFooterTemplates
  footer: HeaderFooterTemplates

  /**
   * Configuración de layout de la sección (F2.19).
   */
  layout: SectionLayoutConfig
}

export interface DocumentMeta {
  title?: string
  author?: string
  date?: string
  sectionName?: string
}

export interface ResolveContext {
  page: number
  pages: number
  isFirstPageOfSection: boolean
  isEvenPage: boolean
  meta: DocumentMeta
}

/**
 * Resultado ya resuelto de layout para consumo
 * directo por la vista paginada.
 */
export interface ResolvedSectionLayout {
  /**
   * Número efectivo de columnas (normalizado a >= 1).
   */
  columns: number

  /**
   * Contenedores activos para la sección.
   */
  containers: TextContainerRegion[]
}

// Por ahora manejamos un solo conjunto global de encabezado/pie y layout.
const state = reactive<PageSectionConfig>({
  name: 'Sección 1',
  header: {
    default: '',
  },
  footer: {
    default: '',
  },
  layout: {
    columns: null,
    containers: null,
  },
})

export function usePageSections() {
  function setHeaderTemplate(kind: keyof HeaderFooterTemplates, value: string): void {
    state.header[kind] = value || ''
  }

  function setFooterTemplate(kind: keyof HeaderFooterTemplates, value: string): void {
    state.footer[kind] = value || ''
  }

  /**
   * Fija el número de columnas lógicas para la sección actual.
   * columns <= 1 o null/undefined se normalizan a "sin layout",
   * que se interpretará como 1 columna.
   */
  function setLayoutColumns(columns: number | null | undefined): void {
    const normalized =
    columns == null || columns <= 1
    ? null
    : columns

    state.layout.columns = normalized
  }

  /**
   * Fija los contenedores de texto para la sección actual.
   * En F2.19 se limita a persistir los metadatos.
   */
  function setLayoutContainers(containers: TextContainerRegion[] | null | undefined): void {
    state.layout.containers = containers ?? null
  }

  return {
    section: state,
    setHeaderTemplate,
    setFooterTemplate,
    setLayoutColumns,
    setLayoutContainers,
  }
}

function applyTemplate(template: string | undefined, ctx: ResolveContext): string {
  if (!template) return ''

    return template
    .replace(/{PAGE}/g, String(ctx.page))
    .replace(/{PAGES}/g, String(ctx.pages))
    .replace(/{TITLE}/g, ctx.meta.title ?? '')
    .replace(/{AUTHOR}/g, ctx.meta.author ?? '')
    .replace(/{DATE}/g, ctx.meta.date ?? '')
    .replace(/{SECTION}/g, ctx.meta.sectionName ?? '')
}

/**
 * Resuelve header/footer de una sección con base en las reglas:
 *  - si es primera página de sección y hay plantilla first -> usa esa;
 *  - si es página par y hay plantilla even -> usa esa;
 *  - en otro caso -> usa default.
 */
export function resolveHeaderFooterForSection(
  section: PageSectionConfig,
  ctx: ResolveContext,
): { header: string; footer: string } {
  const headerTemplate =
  (ctx.isFirstPageOfSection && section.header.first) ||
  (ctx.isEvenPage && section.header.even) ||
  section.header.default ||
  ''

  const footerTemplate =
  (ctx.isFirstPageOfSection && section.footer.first) ||
  (ctx.isEvenPage && section.footer.even) ||
  section.footer.default ||
  ''

  return {
    header: applyTemplate(headerTemplate, ctx),
    footer: applyTemplate(footerTemplate, ctx),
  }
}

/**
 * Devuelve el layout efectivo para una sección:
 *  - columns: siempre >= 1
 *  - containers: array (vacío si no hay)
 *
 * Pensado para ser consumido por la vista paginada y el motor
 * de layout de F2.19.
 */
export function resolveLayoutForSection(
  section: PageSectionConfig | null | undefined,
): ResolvedSectionLayout {
  const rawColumns = section?.layout?.columns ?? null
  const columns =
  rawColumns == null || rawColumns <= 1
  ? 1
  : rawColumns

  const containers = section?.layout?.containers ?? null

  return {
    columns,
    containers: containers ?? [],
  }
}
