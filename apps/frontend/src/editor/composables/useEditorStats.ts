// apps/frontend/src/editor/composables/useEditorStats.ts
import { reactive } from 'vue'
import type { Editor } from '@tiptap/core'

export interface EditorStats {
  words: number
  paragraphs: number
  wordsInCurrentParagraph: number
  linesInCurrentParagraph: number
}

/**
 * F2 / F2.2 / F2.3.R
 * Cálculo de estadísticas del editor (palabras, párrafos, etc.).
 */
export function useEditorStats(getEditor: () => Editor | null) {
  const stats = reactive<EditorStats>({
    words: 0,
    paragraphs: 0,
    wordsInCurrentParagraph: 0,
    linesInCurrentParagraph: 0,
  })

  function updateStats(): void {
    const editor = getEditor()
    if (!editor) return

      const json = editor.getJSON()
      let totalWords = 0
      let paragraphs = 0

      const cursorPos = editor.state.selection.from
      let wordsInCurrentParagraph = 0
      let linesInCurrentParagraph = 0

      function countWords(text: string): number {
        const cleaned = text
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
        if (!cleaned) return 0
          return cleaned.split(/\s+/).length
      }

      function traverse(node: any, fromPos: { value: number }) {
        if (!node) return

          if (node.type === 'paragraph') {
            paragraphs += 1

            const text = (node.content || [])
            .filter((child: any) => child.type === 'text')
            .map((child: any) => child.text || '')
            .join('')

            const wordCount = countWords(text)
            totalWords += wordCount

            const startPos = fromPos.value
            const endPos = startPos + text.length

            if (cursorPos >= startPos && cursorPos <= endPos) {
              wordsInCurrentParagraph = wordCount
              linesInCurrentParagraph = Math.max(1, Math.ceil(text.length / 80))
            }

            fromPos.value = endPos + 1
          } else if (Array.isArray(node.content)) {
            for (const child of node.content) {
              traverse(child, fromPos)
            }
          }
      }

      traverse(json, { value: 0 })

      stats.words = totalWords
      stats.paragraphs = paragraphs
      stats.wordsInCurrentParagraph = wordsInCurrentParagraph
      stats.linesInCurrentParagraph = linesInCurrentParagraph
  }

  return {
    stats,
    updateStats,
  }
}
