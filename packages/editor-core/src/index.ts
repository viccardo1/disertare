import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

export const createDisertareEditor = (content: string = ''): Editor => {
  return new Editor({
    extensions: [StarterKit],
    content,
    enableInputRules: true,
    enablePasteRules: true,
    autofocus: false,
    injectCSS: true,
    editorProps: {
      attributes: {
        class: 'disertare-editor-content',
      },
    },
  })
}

export type { Editor } from '@tiptap/core'
