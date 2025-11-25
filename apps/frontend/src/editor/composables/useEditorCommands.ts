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
      console.warn('[useEditorCommands] Editor no inicializado')
      return
    }
    fn(ed)
  }
}

/**
 * Comandos de inserción usados por la toolbar primaria.
 * Cada comando inserta el nodo correspondiente al paquete editor-ext-*.
 */
export function useEditorCommands(editor: Ref<Editor | null>) {
  // ----------------------------
  // KaTeX
  // ----------------------------
  const insertKatex = withEditor(editor, (ed) => {
    ed.chain()
    .focus()
    .insertContent({
      type: 'katex',
      attrs: {
        content: '\\sqrt{a^2 + b^2}',
      },
    })
    .run()
  })

  // ----------------------------
  // Mermaid (F2.x)
  // ----------------------------
  const insertMermaid = withEditor(editor, (ed) => {
    ed.chain()
    .focus()
    .insertContent({
      type: 'mermaid',
      attrs: {
        // Importante: NO usar \\n, Mermaid espera texto sin doble escape
        content: 'graph TD;\n  A[Start] --> B[End];',
      },
    })
    .run()
  })

  // ----------------------------
  // Código (Prism)
  // ----------------------------
  const insertCodeBlock = withEditor(editor, (ed) => {
    ed.chain()
    .focus()
    .insertContent({
      type: 'prism',
      attrs: {
        language: 'plaintext',
        content: '',
      },
    })
    .run()
  })

  // ----------------------------
  // Imagen
  // ----------------------------
  const insertImage = withEditor(editor, (ed) => {
    ed.chain()
    .focus()
    .insertContent({
      type: 'image',
      attrs: {
        // src vacío = nodo válido; la extensión maneja carga posterior
        src: '',
        alt: '',
        title: '',
      },
    })
    .run()
  })

  // ----------------------------
  // Tabla
  // ----------------------------
  const insertTable = withEditor(editor, (ed) => {
    // TipTap table: insertTable({ rows, cols, withHeaderRow })
    // TipTap typings no incluyen correctamente el comando → ignoramos TS
    // @ts-expect-error
    ed.chain()
    .focus()
    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
    .run()
  })

  // ----------------------------
  // Gantt
  // ----------------------------
  const insertGantt = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'gantt', attrs: {} }).run()
  })

  // ----------------------------
  // CAD
  // ----------------------------
  const insertCad = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'cad', attrs: {} }).run()
  })

  // ----------------------------
  // DICOM
  // ----------------------------
  const insertDicom = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'dicom', attrs: {} }).run()
  })

  // ----------------------------
  // Geo (GeoJSON / TopoJSON)
  // ----------------------------
  const insertGeo = withEditor(editor, (ed) => {
    ed.chain()
    .focus()
    .insertContent({
      type: 'geospatial',
      attrs: {},
    })
    .run()
  })

  // ----------------------------
  // Química (F2.7)
  // ----------------------------
  const insertChem = withEditor(editor, (ed) => {
    ed.chain()
    .focus()
    .insertContent({
      type: 'chemStructure',
      attrs: {
        id: crypto.randomUUID(), // requerido por la extensión
                   format: 'smiles',        // formato inicial
                     value: '',               // cadena vacía => molécula vacía válida
      },
    })
    .run()
  })

  // ----------------------------
  // Slides (tipo PowerPoint)
  // ----------------------------
  const insertSlides = withEditor(editor, (ed) => {
    ed.chain().focus().insertContent({ type: 'slides', attrs: {} }).run()
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
    insertSlides,
  }
}
