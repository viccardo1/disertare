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
import { ChemExtension } from '@disertare/editor-ext-chem'
import { BioExtension } from '@disertare/editor-ext-bio' // F2.8 Bio
import { CircuitsExtension } from '@disertare/editor-ext-circuits' // F2.9 Circuitos
import { Slides } from '@disertare/editor-ext-slides'
import { StatsChartNode } from '@disertare/editor-ext-stats'
import {
  CitationInline,
  Bibliography,
  defaultCitationFormatter,
  type CitationStyleId,
  type CitationFormatter,
} from '@disertare/editor-citations'
import { OcrExtension as Ocr } from '@disertare/editor-ext-ocr'

// F2.5: secciones de página (encabezados/pies 1:1 DOCX/PDF)
import { PageSectionExtension } from '@disertare/editor-ext-page-section'

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
 * Wrapper alrededor del formateador por defecto de citas
 * para corregir detalles de puntuación (p. ej. "V..", ".. 2023").
 *
 * NO cambia la lógica de estilos; solo limpia la salida final.
 */
const safeCitationFormatter: CitationFormatter = {
  formatInText(reference, loc, style) {
    return defaultCitationFormatter.formatInText(reference, loc, style)
  },

  formatBibliographyEntry(reference, style) {
    let raw = defaultCitationFormatter.formatBibliographyEntry(reference, style)

    // Colapsar puntos duplicados: "V.." -> "V."
    raw = raw.replace(/\.{2,}/g, '.')

    // Limpiar pequeños artefactos de espacios
    raw = raw.replace(/\s+\./g, '. ')
    raw = raw.replace(/\. \)/g, '.)')

    return raw.trim()
  },
}

/**
 * Hook central que inicializa el Editor de Disertare y registra:
 *
 *  - Extensiones base (StarterKit).
 *  - Extensiones de dominio F2.x (KaTeX, Prism, Mermaid, Imágenes, Tablas,
 *    Gantt, CAD, DICOM, Geo, Chem, Bio, Slides, Stats).
 *  - F2.5: PageSectionExtension para encabezados/pies 1:1.
 *  - F2.4: OCR on-device.
 *  - F2.3: Citas/Bibliografía.
 *  - F2.7/F2.8: Química y Bio.
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
          ChemExtension,
          BioExtension, // F2.8 Bio integrado
          CircuitsExtension,
          Slides,
          StatsChartNode,

          // F2.5: metadatos de secciones/encabezados/pies por sección
          PageSectionExtension.configure({
            defaultTemplate: {
              id: 'default',
              name: 'General',
              header: '{TITLE}',
              footer: '{PAGE} / {PAGES}',
            },
          }),

          // F2.4: extensión OCR (on-device, motor definido en @disertare/editor-ext-ocr)
          Ocr.configure({
            defaultLang: 'es',
          }),

          // F2.3: citas inline
          CitationInline.configure({
            getReferenceById: (id: string) =>
            options.citationManager.getReference(id),
                                   getCurrentStyle: () => options.getCitationStyle(),
                                   formatter: safeCitationFormatter,
          }),

          // F2.3: bloque de bibliografía
          Bibliography.configure({
            getReferences: () => options.citationManager.listReferences(),
                                 getCurrentStyle: () => options.getCitationStyle(),
                                 formatter: safeCitationFormatter,
          }),
        ],
        onUpdate: () => {
          if (options.onUpdate) {
            options.onUpdate()
          }
        },
        onSelectionUpdate: () => {
          if (options.onSelectionUpdate) {
            options.onSelectionUpdate()
          }
        },
      })

      options.editor.value = markRaw(instance)
      ;(window as any).editor = options.editor.value
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Editor] Error inicializando TipTap:', error)
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
