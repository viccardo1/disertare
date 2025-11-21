// apps/frontend/src/editor/composables/usePagedPreview.ts
import { ref } from 'vue'

/**
 * Página resultante del algoritmo de paginación F2.2/F2.3.R.
 */
export type Page = {
  index: number
  html: string
}

// Altura “útil” de página (contenido sin footer), igual que en F2.2
const DEFAULT_PAGE_HEIGHT_PX = 1100

/**
 * Divide un <pre> muy largo en varios bloques más pequeños,
 * respetando el contenido pero mejorando el ajuste de altura.
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

    // Copiamos atributos del <pre> original
    for (const attr of Array.from(el.attributes)) {
      wrapper.setAttribute(attr.name, attr.value)
    }

    chunks.push(wrapper.outerHTML)
  }

  return chunks
}

/**
 * Convierte el HTML plano del documento en una lista de bloques
 * “paginables” (párrafos, encabezados, listas, tablas, etc.).
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
        // Cualquier otro elemento se trata también como bloque
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
 * Algoritmo de paginación 1:1 (F2.2) extraído a función pura.
 * Usa un nodo host (pageMeasure) para medir la altura de los bloques.
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

    // Cerramos página actual
    host.innerHTML = currentBlocks.join('')
    const pageHtml = host.innerHTML

    // Evitar páginas vacías sólo con tags
    if (pageHtml.replace(/<[^>]+>/g, '').trim().length > 0) {
      result.push({ index: pageIndex++, html: pageHtml })
    }

    // Empezamos nueva página con el bloque actual
    currentBlocks = [block]
    host.innerHTML = block
  }

  // Última página (si queda contenido)
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
 * Composable F2.2/F2.3.R para manejar la vista paginada 1:1.
 *
 * Editor.vue se limita a:
 *  - activar/desactivar `isPagedPreview`
 *  - llamar a `recomputePages()` cuando corresponda
 *  - pasar `pageMeasure` al contenedor oculto de medición
 *  - iterar `pages` en la vista paginada.
 */
export function usePagedPreview(options: {
  /**
   * Función que devuelve el HTML actual del documento.
   * En Editor.vue será típicamente: () => editor?.getHTML() ?? ''
   */
  getHtml: () => string
  /**
   * Altura máxima útil de página. Si no se indica, usa DEFAULT_PAGE_HEIGHT_PX.
   */
  pageHeightPx?: number
}) {
  const isPagedPreview = ref(false)
  const pages = ref<Page[]>([])
  const pageMeasure = ref<HTMLElement | null>(null)

  function recomputePages(): void {
    // Si la vista paginada está desactivada, vaciamos páginas
    if (!isPagedPreview.value) {
      pages.value = []
      return
    }

    const html = options.getHtml ? options.getHtml() : ''
    const trimmed = html.trim()

    if (!trimmed) {
      pages.value = [{ index: 0, html: '' }]
      return
    }

    const host = pageMeasure.value

    // Si aún no tenemos host (ref sin montar), devolvemos 1 página directa
    if (!host) {
      pages.value = [{ index: 0, html: trimmed }]
      return
    }

    const maxHeight = options.pageHeightPx ?? DEFAULT_PAGE_HEIGHT_PX
    pages.value = paginateHtml(trimmed, host, maxHeight)
  }

  return {
    isPagedPreview,
    pages,
    pageMeasure,
    recomputePages,
  }
}
