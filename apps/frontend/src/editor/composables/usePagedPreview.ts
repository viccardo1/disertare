// apps/frontend/src/editor/composables/usePagedPreview.ts
import { ref } from 'vue'
import { resolveLayoutForSection } from './usePageSections'
import type {
  PageSectionConfig,
  TextContainerRegion,
} from './usePageSections'

/**
 * Página resultante del algoritmo de paginación F2.2/F2.3.R.
 * F2.19 añade metadata de layout:
 *  - layoutColumns: nº de columnas efectivas
 *  - layoutContainers: zonas de texto (overlays MVP)
 */
export type Page = {
  index: number
  html: string

  /** F2.19: columnas efectivas para la página */
  layoutColumns?: number

  /** F2.19.R3: contenedores de texto asociados a la sección */
  layoutContainers?: TextContainerRegion[]
}

// Altura “útil” de página (contenido sin footer), igual que en F2.2
const DEFAULT_PAGE_HEIGHT_PX = 1100

/**
 * Divide un <pre> muy largo en varios bloques más pequeños.
 */
function splitLongPreElement(el: HTMLElement): string[] {
  const codeEl = el.querySelector('code')
  const text = codeEl?.textContent ?? el.textContent ?? ''
  const lines = text.split('\n')

  if (lines.length <= 10) {
    return [el.outerHTML]
  }

  const chunks: string[] = []
  const chunkSize = 10

  for (let i = 0; i < lines.length; i += chunkSize) {
    const slice = lines.slice(i, i + chunkSize).join('\n')
    const wrapper = document.createElement('pre')
    const code = document.createElement('code')

    code.textContent = slice
    wrapper.appendChild(code)

    for (const attr of Array.from(el.attributes)) {
      wrapper.setAttribute(attr.name, attr.value)
    }

    chunks.push(wrapper.outerHTML)
  }

  return chunks
}

/**
 * Convierte HTML plano del documento en bloques paginables.
 */
function splitHtmlIntoBlocks(html: string): string[] {
  if (!html.trim()) return []

    const container = document.createElement('div')
    container.innerHTML = html

    const blocks: string[] = []
    const blockSelectors = [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'pre',
      'table',
      'blockquote',
      'hr',
      'div',
      'section',
      'figure',
    ]

    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement

        if (el.matches('pre')) {
          const chunks = splitLongPreElement(el)
          blocks.push(...chunks)
        } else if (blockSelectors.some((sel) => el.matches(sel))) {
          blocks.push(el.outerHTML)
        } else {
          blocks.push(el.outerHTML)
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const trimmed = (node.textContent ?? '').trim()
        if (trimmed) {
          const p = document.createElement('p')
          p.textContent = trimmed
          blocks.push(p.outerHTML)
        }
      }
    })

    return blocks
}

/**
 * Algoritmo de paginación F2.2/F2.3.R (sin layout todavía).
 */
function paginateHtml(html: string, host: HTMLElement, maxHeight: number): Page[] {
  const trimmed = html.trim()
  if (!trimmed) {
    return [{ index: 0, html: '' }]
  }

  const blocks = splitHtmlIntoBlocks(trimmed)
  const result: Page[] = []

  let currentBlocks: string[] = []
  let pageIndex = 0

  for (const block of blocks) {
    host.innerHTML = currentBlocks.join('') + block
    const h = host.offsetHeight

    if (h <= maxHeight || currentBlocks.length === 0) {
      currentBlocks.push(block)
      continue
    }

    host.innerHTML = currentBlocks.join('')
    const pageHtml = host.innerHTML

    if (pageHtml.replace(/<[^>]+>/g, '').trim().length > 0) {
      result.push({ index: pageIndex++, html: pageHtml })
    }

    currentBlocks = [block]
    host.innerHTML = block
  }

  if (currentBlocks.length) {
    host.innerHTML = currentBlocks.join('')
    const pageHtml = host.innerHTML
    if (pageHtml.replace(/<[^>]+>/g, '').trim().length > 0) {
      result.push({ index: pageIndex, html: pageHtml })
    }
  }

  return result
}

/**
 * Composable F2.2/F2.3.R + F2.19 (columnas + contenedores).
 */
export function usePagedPreview(options: {
  getHtml: () => string
  pageHeightPx?: number
  /** F2.19: sección actual para aplicar layout */
  currentSection?: PageSectionConfig | null
}) {
  const isPagedPreview = ref(false)
  const pages = ref<Page[]>([])
  const pageMeasure = ref<HTMLElement | null>(null)

  function recomputePages(): void {
    if (!isPagedPreview.value) {
      pages.value = []
      return
    }

    const html = options.getHtml?.() ?? ''
    const trimmed = html.trim()

    if (!trimmed) {
      pages.value = [{ index: 0, html: '' }]
      return
    }

    const host = pageMeasure.value
    if (!host) {
      pages.value = [{ index: 0, html: trimmed }]
      return
    }

    const maxHeight = options.pageHeightPx ?? DEFAULT_PAGE_HEIGHT_PX

    // Paginación base
    const rawPages = paginateHtml(trimmed, host, maxHeight)

    // 🔥 F2.19: aplicar layout (columnas + contenedores) de la sección actual
    const layout = resolveLayoutForSection(options.currentSection)

    const containers: TextContainerRegion[] = layout.containers ?? []

    pages.value = rawPages.map((p) => ({
      ...p,
      layoutColumns: layout.columns,
      layoutContainers: containers,
    }))
  }

  return {
    isPagedPreview,
    pages,
    pageMeasure,
    recomputePages,
  }
}
