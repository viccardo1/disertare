// packages/editor-ext-page-section/src/PageSectionExtension.ts

import { Extension } from '@tiptap/core'
import type {
  PageHeaderFooterTemplate,
  PageSectionBreak,
  PageSectionConfig,
  PageSectionState,
} from './types'

/**
 * Opciones de la extensión. En F2.5 solo necesitamos
 * una plantilla por defecto opcional.
 *
 * Los metadatos reales del documento (TITLE, AUTHOR, DATE, SECTION)
 * se resolverán desde el frontend usando composables,
 * no desde esta extensión.
 */
export interface PageSectionExtensionOptions {
  defaultTemplate?: PageHeaderFooterTemplate
}

// Declaración de comandos TipTap para esta extensión.
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageSection: {
      /**
       * Inserta o actualiza un corte de sección en la posición actual
       * de la selección. Si no se pasa `sectionConfig.id`, se genera
       * uno del tipo `section-1`, `section-2`, etc.
       */
      setPageSectionBreak: (sectionConfig?: Partial<PageSectionConfig>) => ReturnType

      /**
       * Actualiza la configuración de una sección existente.
       */
      updatePageSection: (
        sectionId: string,
        patch: Partial<PageSectionConfig>,
      ) => ReturnType

      /**
       * Elimina una sección y todos sus cortes asociados.
       */
      removePageSection: (sectionId: string) => ReturnType

      /**
       * Limpia todas las secciones y cortes.
       * Útil para pruebas o para resetear el documento.
       */
      clearPageSections: () => ReturnType
    }
  }
}

/**
 * Extensión ligera que modela secciones de página y su
 * configuración de encabezados/pies.
 *
 * No modifica el contenido del documento ni añade nodos visibles;
 * solo mantiene metadatos que luego usará F2.5 en la vista paginada
 * y en la exportación DOCX/PDF.
 */
export const PageSectionExtension = Extension.create<PageSectionExtensionOptions>({
  name: 'pageSection',

  addOptions() {
    return {
      defaultTemplate: undefined,
    }
  },

  /**
   * Storage por extensión.
   * Se expone en `editor.storage.pageSection`.
   */
  addStorage() {
    const initialState: PageSectionState = {
      sections: [],
      breaks: [],
    }

    return initialState
  },

  addCommands() {
    return {
      setPageSectionBreak:
        (sectionConfig?: Partial<PageSectionConfig>) =>
        ({ state }) => {
          const storage = this.storage as PageSectionState

          const { from } = state.selection

          // Generar o reutilizar id de sección
          const id =
            sectionConfig?.id ??
            `section-${storage.sections.length + 1}`

          let section = storage.sections.find(s => s.id === id)

          if (!section) {
            section = {
              id,
              name: sectionConfig?.name,
              templateId: sectionConfig?.templateId,
              firstPageDifferent: sectionConfig?.firstPageDifferent,
              oddEvenDifferent: sectionConfig?.oddEvenDifferent,
              firstPageHeader: sectionConfig?.firstPageHeader,
              firstPageFooter: sectionConfig?.firstPageFooter,
              oddHeader: sectionConfig?.oddHeader,
              oddFooter: sectionConfig?.oddFooter,
              evenHeader: sectionConfig?.evenHeader,
              evenFooter: sectionConfig?.evenFooter,
              header: sectionConfig?.header,
              footer: sectionConfig?.footer,
            }

            storage.sections.push(section)
          } else if (sectionConfig) {
            Object.assign(section, sectionConfig)
          }

          // Registrar corte de sección en la posición actual
          const existingBreak = storage.breaks.find(b => b.pos === from)

          if (existingBreak) {
            existingBreak.sectionId = id
          } else {
            const newBreak: PageSectionBreak = {
              pos: from,
              sectionId: id,
            }

            storage.breaks.push(newBreak)
            storage.breaks.sort((a, b) => a.pos - b.pos)
          }

          // No modifica el documento, solo storage -> devolver true
          return true
        },

      updatePageSection:
        (sectionId: string, patch: Partial<PageSectionConfig>) =>
        () => {
          const storage = this.storage as PageSectionState
          const section = storage.sections.find(s => s.id === sectionId)

          if (!section) return false

          Object.assign(section, patch)
          return true
        },

      removePageSection:
        (sectionId: string) =>
        () => {
          const storage = this.storage as PageSectionState

          storage.sections = storage.sections.filter(s => s.id !== sectionId)
          storage.breaks = storage.breaks.filter(b => b.sectionId !== sectionId)

          return true
        },

      clearPageSections:
        () =>
        () => {
          const storage = this.storage as PageSectionState

          storage.sections = []
          storage.breaks = []

          return true
        },
    }
  },
})

export default PageSectionExtension
