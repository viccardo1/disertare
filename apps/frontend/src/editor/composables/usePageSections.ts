// apps/frontend/src/editor/composables/usePageSections.ts
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

export interface PageSectionConfig {
  /**
   * Nombre de la sección (solo informativo por ahora).
   */
  name: string
  header: HeaderFooterTemplates
  footer: HeaderFooterTemplates
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

// Por ahora manejamos un solo conjunto global de encabezado/pie.
const state = reactive<PageSectionConfig>({
  name: 'Sección 1',
  header: {
    default: '',
  },
  footer: {
    default: '',
  },
})

export function usePageSections() {
  function setHeaderTemplate(kind: keyof HeaderFooterTemplates, value: string): void {
    state.header[kind] = value || ''
  }

  function setFooterTemplate(kind: keyof HeaderFooterTemplates, value: string): void {
    state.footer[kind] = value || ''
  }

  return {
    section: state,
    setHeaderTemplate,
    setFooterTemplate,
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
