// apps/frontend/src/editor/composables/useEditorCommands.ts
import type { Editor } from '@tiptap/core'

/**
 * F2 / F2.1 / F2.2 / F2.3
 * Comandos de la barra de herramientas que actúan sobre el editor:
 *  - KaTeX, Mermaid, código, tabla, imagen.
 *  - Gantt, CAD, DICOM, GeoSpatial, Slides.
 *
 * Recibe getEditor() para no acoplarse al ciclo de vida.
 */
export function useEditorCommands(getEditor: () => Editor | null) {
  const insertKatex = (): void => {
    const editor = getEditor()
    if (!editor) return

    editor
      .chain()
      .focus()
      .setKatex({ content: 'E = mc^2', inline: false })
      .run()
  }

  const insertMermaid = (): void => {
    const editor = getEditor()
    if (!editor) return

    const diagram = `graph TD
  A[Inicio] --> B{Decision}
  B -->|Sí| C[Camino 1]
  B -->|No| D[Camino 2]
`

    editor
      .chain()
      .focus()
      .setMermaid({
        code: diagram,
      })
      .run()
  }

  const insertCodeBlock = (): void => {
    const editor = getEditor()
    if (!editor) return

    editor.chain().focus().setCodeBlock().run()
  }

  const insertTable = (): void => {
    const editor = getEditor()
    if (!editor) return

    const anyEditor = editor as any
    const hasInsertTable = !!anyEditor.commands?.insertTable
    const hasSetTable = !!anyEditor.commands?.setTable

    if (hasInsertTable) {
      anyEditor.commands.insertTable({
        rows: 3,
        cols: 3,
        withHeaderRow: true,
      })
    } else if (hasSetTable) {
      anyEditor.commands.setTable({
        rows: 3,
        cols: 3,
        hasHeader: true,
      })
    } else {
      console.warn(
        '[F2] No se encontró ningún comando de tabla (insertTable ni setTable) en editor.commands.',
      )
    }
  }

  const insertImage = (): void => {
    const editor = getEditor()
    if (!editor) return

    editor
      .chain()
      .focus()
      .setImage({
        src: 'https://placehold.co/600x400?text=Disertare+Image',
        alt: 'Imagen de prueba Disertare',
        title: 'Imagen de prueba',
      })
      .run()
  }

  const insertGantt = (): void => {
    const editor = getEditor()
    if (!editor) return

    editor
      .chain()
      .focus()
      .setGantt({
        tasks: [
          { id: '1', name: 'Tarea 1', start: '2025-01-01', end: '2025-01-07' },
          { id: '2', name: 'Tarea 2', start: '2025-01-08', end: '2025-01-15' },
        ],
      })
      .run()
  }

  const insertCad = (): void => {
    const editor = getEditor()
    if (!editor) return

    editor
      .chain()
      .focus()
      .setCad({
        src: 'https://example.com/archivo.dwg',
        title: 'Modelo CAD de ejemplo',
      })
      .run()
  }

  const insertDicom = (): void => {
    const editor = getEditor()
    if (!editor) return

    editor
      .chain()
      .focus()
      .setDicom({
        src: 'https://example.com/estudio.dcm',
        title: 'Estudio DICOM de ejemplo',
      })
      .run()
  }

  const insertGeoSpatial = (): void => {
    const editor = getEditor()
    if (!editor) return

    editor
      .chain()
      .focus()
      .setGeoSpatial({
        geojson: {
          type: 'FeatureCollection',
          features: [],
        },
        title: 'Capa geoespacial de ejemplo',
      })
      .run()
  }

  const insertSlides = (): void => {
    const editor = getEditor()
    if (!editor) return

    editor
      .chain()
      .focus()
      .setSlides({
        content: 'Slide 1\n---\nSlide 2\n---\nSlide 3',
        title: 'Presentación de ejemplo',
        width: '600px',
        height: '400px',
      })
      .run()
  }

  return {
    insertKatex,
    insertMermaid,
    insertCodeBlock,
    insertTable,
    insertImage,
    insertGantt,
    insertCad,
    insertDicom,
    insertGeoSpatial,
    insertSlides,
  }
}
