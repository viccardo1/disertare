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
  // ----------------------------
  // KaTeX
  // ----------------------------
  const insertKatex = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertContent({ type: 'katex' })
    .run()
  })

  // ----------------------------
  // Mermaid
  // ----------------------------
  const insertMermaid = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertContent({
      type: 'mermaid',
    })
    .run()
  })

  // ----------------------------
  // Bloque de código (Prism)
  // ----------------------------
  const insertCodeBlock = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertContent({
      type: 'prism',
      attrs: {
        language: 'plaintext',
      },
    })
    .run()
  })

  // ----------------------------
  // Imagen (vía URL, F2.x)
  // ----------------------------
  const insertImage = withEditor(editor, (ed) => {
    const url = window.prompt('URL de la imagen (http/https):')
    if (!url) {
      return
    }

    // Usamos el comando oficial de la extensión Image (basado en TipTap)
    // en lugar de insertar un nodo vacío que marca error.
    ;(ed.chain().focus() as any).setImage({ src: url }).run()
  })

  // ----------------------------
  // Tabla
  // ----------------------------
  const insertTable = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertTable({
      rows: 3,
      cols: 3,
      withHeaderRow: true,
    })
    .run()
  })

  // ----------------------------
  // Gantt
  // ----------------------------
  const insertGantt = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertContent({
      type: 'gantt',
    })
    .run()
  })

  // ----------------------------
  // CAD
  // ----------------------------
  const insertCad = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertContent({
      type: 'cad',
    })
    .run()
  })

  // ----------------------------
  // DICOM
  // ----------------------------
  const insertDicom = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertContent({
      type: 'dicom',
    })
    .run()
  })

  // ----------------------------
  // Geo
  // ----------------------------
  const insertGeo = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertContent({
      type: 'geo',
    })
    .run()
  })

  // ----------------------------
  // Química
  // ----------------------------
  const insertChem = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertContent({
      type: 'chem',
    })
    .run()
  })

  // ----------------------------
  // Bio (atajo desde toolbar)
  // ----------------------------
  const insertBioSequence = withEditor(editor, (ed) => {
    const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? (crypto as any).randomUUID()
    : String(Date.now())

    ed
    .chain()
    .focus()
    .insertContent({
      type: 'bioSequence',
      attrs: {
        id,
        kind: 'dna',
        label: 'Secuencia sin título',
        sequence: 'ATGC',
      },
    })
    .run()
  })

  // ----------------------------
  // Circuitos (atajo desde toolbar)
  // ----------------------------
  const insertCircuit = withEditor(editor, (ed) => {
    const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? (crypto as any).randomUUID()
    : String(Date.now())

    ed
    .chain()
    .focus()
    .insertContent({
      type: 'circuitDiagram',
      attrs: {
        id,
        label: 'Circuito sin título',
        notation: '',
        notes: '',
      },
    })
    .run()
  })

  // ----------------------------
  // Neumática/Hidráulica (atajo desde toolbar, F2.10)
  // ----------------------------
  const insertPneumaticBlock = withEditor(editor, (ed) => {
    const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? (crypto as any).randomUUID()
    : String(Date.now())

    ed
    .chain()
    .focus()
    .insertContent({
      type: 'circuitDiagram',
      attrs: {
        id,
        label: 'Bloque neumática/hidráulica sin título',
        notation: '',
        notes: '',
      },
    })
    .run()
  })

  // ----------------------------
  // Slides
  // ----------------------------
  const insertSlides = withEditor(editor, (ed) => {
    ed
    .chain()
    .focus()
    .insertContent({
      type: 'slides',
    })
    .run()
  })

  return {
    insertKatex,
    insertMermaid,
    insertCodeBlock,
    insertImage,
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
