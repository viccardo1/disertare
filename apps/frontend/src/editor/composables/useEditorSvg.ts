// apps/frontend/src/editor/composables/useEditorSvg.ts
import type { Ref } from 'vue'
import type { Editor } from '@tiptap/core'

function withEditor(editor: Ref<Editor | null>, fn: (editor: Editor) => void) {
  return () => {
    const ed = editor.value
    if (!ed) {
      console.warn('[useEditorSvg] Editor no inicializado')
      return
    }
    fn(ed)
  }
}

export function useEditorSvg(editor: Ref<Editor | null>) {
  const insertEmptySvg = withEditor(editor, (ed) => {
    ;(ed.chain().focus() as any)
      .setSvgAdv({
        svgMarkup: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"></svg>',
        layers: [],
        activeLayerId: null,
        selection: { type: null, ids: [] },
        view: {
          zoom: 1,
          panX: 0,
          panY: 0,
          showGrid: true,
          showGuides: true,
          snapToGrid: true,
          snapToGuides: true,
        },
      })
      .run()
  })

  const insertSvgMarkup = (svgMarkup: string) => {
    const ed = editor.value
    if (!ed) {
      console.warn('[useEditorSvg] Editor no inicializado')
      return
    }

    ;(ed.chain().focus() as any)
      .setSvgAdv({
        svgMarkup,
        layers: [],
        activeLayerId: null,
        selection: { type: null, ids: [] },
        view: {
          zoom: 1,
          panX: 0,
          panY: 0,
          showGrid: true,
          showGuides: true,
          snapToGrid: true,
          snapToGuides: true,
        },
      })
      .run()
  }

  const updateSelectedSvgFromMarkup = (svgMarkup: string) => {
    const ed = editor.value
    if (!ed) return

    ;(ed.chain().focus() as any)
      .updateSvgMarkup(svgMarkup)
  }

  return {
    insertEmptySvg,
    insertSvgMarkup,
    updateSelectedSvgFromMarkup,
  }
}
