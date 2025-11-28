// apps/frontend/src/editor/composables/useEditorCommands.ts
import type { Ref } from 'vue'
import type { Editor } from '@tiptap/core'

/**
 * Ejecuta una función solo si el editor está inicializado.
 */
function withEditor(editor: Ref<Editor | null>, fn: (editor: Editor) => void) {
  return () => {
    const ed = editor.value
    if (!ed) {
      // eslint-disable-next-line no-console
      console.warn('[useEditorCommands] Editor no inicializado')
      return
    }
    fn(ed)
  }
}

export function useEditorCommands(editor: Ref<Editor | null>) {
  // ------------------------------------
  // KaTeX
  // ------------------------------------
  const insertKatex = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'katex' }).run()
  })

  // ------------------------------------
  // Mermaid
  // ------------------------------------
  const insertMermaid = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'mermaid' }).run()
  })

  // ------------------------------------
  // Código / Prism
  // ------------------------------------
  const insertCodeBlock = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertContent({
      type: 'prism',
      attrs: { language: 'plaintext' },
    })
    .run()
  })

  // ------------------------------------
  // Imagen por URL (simple)
  // ------------------------------------
  const insertImage = withEditor(editor, (ed) => {
    const url = window.prompt('URL de la imagen (http/https):')
    if (!url) return

      ;(ed.chain().focus() as any).setImage({ src: url }).run()
  })

  // ------------------------------------
  // Imagen avanzada por URL (F2.15)
  // ------------------------------------
  const insertAdvancedImage = withEditor(editor, (ed) => {
    const url = window.prompt(
      'URL de la imagen avanzada (http/https o data URL):',
    )
    if (!url) return

      // OJO: el comando se llama setImagesAdv (con "s")
      ;(ed.chain().focus() as any).setImagesAdv({
        src: url,
      }).run()
  })

  // ------------------------------------
  // Imagen desde archivo local (simple)
  // ------------------------------------
  const insertImageFromLocal = withEditor(editor, (ed) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result !== 'string') return

          ;(ed.chain().focus() as any)
          .setImage({ src: result })
          .run()
      }
      reader.readAsDataURL(file)
  }

  input.click()
  })

  // ------------------------------------
  // Imagen avanzada desde archivo local (F2.15)
  // ------------------------------------
  const insertAdvancedImageFromLocal = withEditor(editor, (ed) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result !== 'string') return

          ;(ed.chain().focus() as any)
          .setImagesAdv({ src: result })
          .run()
      }
      reader.readAsDataURL(file)
  }

  input.click()
  })

  // ------------------------------------
  // Tabla
  // ------------------------------------
  const insertTable = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
    .run()
  })

  // ------------------------------------
  // Gantt
  // ------------------------------------
  const insertGantt = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'gantt' }).run()
  })

  // ------------------------------------
  // CAD
  // ------------------------------------
  const insertCad = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'cad' }).run()
  })

  // ------------------------------------
  // DICOM
  // ------------------------------------
  const insertDicom = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'dicom' }).run()
  })

  // ------------------------------------
  // Geoespacial
  // ------------------------------------
  const insertGeo = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'geospatial' }).run()
  })

  // ------------------------------------
  // Química (F2.7)
  // ------------------------------------
  const insertChem = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'chem' }).run()
  })

  // ------------------------------------
  // Bio (F2.8)
  // ------------------------------------
  const insertBioSequence = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'bioSequence' }).run()
  })

  // ------------------------------------
  // Circuitos (F2.9)
  // ------------------------------------
  const insertCircuit = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'circuit' }).run()
  })

  // ------------------------------------
  // Neumática / Hidráulica (F2.10)
  // ------------------------------------
  const insertPneumaticBlock = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'pneumaticBlock' }).run()
  })

  // ------------------------------------
  // Slides (F2.12)
  // ------------------------------------
  const insertSlides = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'slidesDeck' }).run()
  })

  return {
    insertKatex,
    insertMermaid,
    insertCodeBlock,
    insertImage,
    insertAdvancedImage,
    insertImageFromLocal,
    insertAdvancedImageFromLocal,
    insertTable,
    insertGantt,
    insertCad,
    insertDicom,
    insertGeo,
    insertChem,
    insertBioSequence,
    insertCircuit,
    insertPneumaticBlock,
    insertSlides,
  }
}
