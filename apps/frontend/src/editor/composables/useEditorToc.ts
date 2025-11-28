// apps/frontend/src/editor/composables/useEditorToc.ts
import { ref } from 'vue'
import type { Editor } from '@tiptap/core'
import { computeToc, type TocEntry } from '@disertare/editor-toc'

export function useEditorToc(getEditor: () => Editor | null) {
  const minLevel = ref(1)
  const maxLevel = ref(3)
  const tocEntries = ref<TocEntry[]>([])

  function recomputeToc() {
    const editor = getEditor()
    if (!editor) {
      tocEntries.value = []
      return
    }

    const json = editor.getJSON()
    const raw = computeToc(json, {
      minLevel: minLevel.value,
      maxLevel: maxLevel.value,
    })

    // Mapeo Parts → TOC: excluimos portada.
    const EXCLUDED_PART_IDS = new Set(['cover'])
    const EXCLUDED_TITLES = ['portada', 'cover']

    tocEntries.value = raw.filter((entry) => {
      if (entry.partId && EXCLUDED_PART_IDS.has(entry.partId)) return false
        const normalized = entry.text.trim().toLowerCase()
        return !EXCLUDED_TITLES.includes(normalized)
    })
  }

  function insertTocIntoDocument() {
    const editor = getEditor()
    if (!editor || !tocEntries.value.length) return

      const items = tocEntries.value.map((entry) => ({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: entry.text,
              },
            ],
          },
        ],
      }))

      editor
      .chain()
      .focus()
      .insertContent({
        type: 'bulletList',
        content: items,
      })
      .run()
  }

  return {
    minLevel,
    maxLevel,
    tocEntries,
    recomputeToc,
    insertTocIntoDocument,
  }
}
