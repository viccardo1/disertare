// apps/frontend/src/editor/composables/useDisertareEditor.ts
import { onMounted, onUnmounted, markRaw, type Ref } from 'vue'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

import { Katex } from '@disertare/editor-ext-katex'
import { Prism } from '@disertare/editor-ext-prism'
import { Mermaid } from '@disertare/editor-ext-mermaid'
import { Image } from '@disertare/editor-ext-images'
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from '@disertare/editor-ext-tables'
import { Gantt } from '@disertare/editor-ext-gantt'
import { Cad } from '@disertare/editor-ext-cad'
import { Dicom } from '@disertare/editor-ext-dicom'
import { GeoSpatial } from '@disertare/editor-ext-geospatial'
import { Slides } from '@disertare/editor-ext-slides'
import {
  CitationInline,
  Bibliography,
  defaultCitationFormatter,
} from '@disertare/editor-citations'
import type { CitationStyleId } from '@disertare/editor-citations'
import { OcrExtension as Ocr } from '@disertare/editor-ext-ocr'

export interface UseDisertareEditorOptions {
  editor: Ref<Editor | null>
  citationManager: {
    getReference: (id: string) => any
    listReferences: () => any[]
  }
  getCitationStyle: () => CitationStyleId
  onUpdate?: () => void
  onSelectionUpdate?: () => void
}

/**
 * F2 / F2.2 / F2.3.R / F2.4
 * Instancia y configura el editor TipTap de Disertare.
 * Encapsula:
 *  - Extensiones base (StarterKit, tablas, código, etc.).
 *  - Extensiones avanzadas (Gantt, CAD, DICOM, Geo, Slides, OCR).
 *  - Citas y bibliografía (CitationInline + Bibliography).
 */
export function useDisertareEditor(options: UseDisertareEditorOptions) {
  onMounted(() => {
    try {
      const instance = new Editor({
        extensions: [
          StarterKit,
          Katex,
          Prism,
          Mermaid,
          Image,
          Table.configure({
            resizable: true,
            HTMLAttributes: { class: 'disertare-table' },
          }),
          TableRow,
          TableHeader,
          TableCell,
          Gantt,
          Cad,
          Dicom,
          GeoSpatial,
          Slides,
          // F2.4: extensión OCR (on-device, motor definido en @disertare/editor-ext-ocr)
          Ocr.configure({
            defaultLang: 'es',
          }),
          CitationInline.configure({
            getReferenceById: (id: string) =>
            options.citationManager.getReference(id),
                                   getCurrentStyle: () => options.getCitationStyle(),
                                   formatter: defaultCitationFormatter,
          }),
          Bibliography.configure({
            getReferences: () => options.citationManager.listReferences(),
                                 getCurrentStyle: () => options.getCitationStyle(),
                                 formatter: defaultCitationFormatter,
          }),
        ],
        content:
        '<p>Prueba F2: inserta KaTeX, código, Mermaid, tabla, ..., CAD, DICOM, GeoSpatial o Slides desde la barra inferior.</p>',
      })

      options.editor.value = markRaw(instance)

      // Dev helper: inspección desde consola
      ;(window as any).editor = instance

      if (options.onUpdate) {
        instance.on('update', options.onUpdate)
      }

      if (options.onSelectionUpdate) {
        instance.on('selectionUpdate', options.onSelectionUpdate)
      }
    } catch (error) {
      console.error('[F2] Error al inicializar el editor:', error)
    }
  })

  onUnmounted(() => {
    const instance = options.editor.value
    if (instance) {
      instance.destroy()
      options.editor.value = null
      ;(window as any).editor = null
    }
  })

  return {
    editor: options.editor,
  }
}
