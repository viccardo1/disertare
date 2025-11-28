// packages/editor-toc/src/index.ts
import type { TocEntry, ComputeTocOptions } from './types'

export type { TocEntry, ComputeTocOptions } from './types'

function extractText(node: any): string {
  if (!node || typeof node !== 'object') return ''
    if (node.type === 'text' && typeof node.text === 'string') return node.text
      if (Array.isArray(node.content)) {
        return node.content.map(extractText).join('')
      }
      return ''
}

export function computeToc(
  doc: any,
  options: ComputeTocOptions = {},
): TocEntry[] {
  const minLevel = options.minLevel ?? 1
  const maxLevel = options.maxLevel ?? 6
  const entries: TocEntry[] = []

  function walk(node: any) {
    if (!node || typeof node !== 'object') return

      if (node.type === 'heading') {
        const level = node.attrs?.level ?? 1

        if (level >= minLevel && level <= maxLevel) {
          const text = extractText(node).trim()
          if (text.length) {
            const partId = node.attrs?.['data-part-id'] as string | undefined
            const id =
            (node.attrs && (node.attrs.id as string | undefined)) ||
            `h-${entries.length}`

            entries.push({
              id,
              text,
              level,
              position: entries.length,
              ...(partId ? { partId } : {}),
            })
          }
        }
      }

      const content = (node as any).content
      if (Array.isArray(content)) {
        content.forEach(walk)
      }
  }

  walk(doc)
  return entries
}
