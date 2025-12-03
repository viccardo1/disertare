/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  D  DISERTARE                                                    ║
 * ║  Plataforma avanzada de edición técnica, científica y            ║
 * ║  multidisciplinaria.                                             ║
 * ║                                                                  ║
 * ║  © 2025 Disertare Project — Licencia Privativa.                  ║
 * ║  Todos los derechos reservados.                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { Extension } from '@tiptap/core'
import type {
  PageHeaderFooterTemplate,
  PageSectionBreak,
  PageSectionConfig,
  PageSectionState,
  SectionLayoutConfig,
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

      /**
       * Fija o actualiza el número de columnas lógicas de una sección (F2.19).
       *
       * Si `columns` es null/undefined se interpreta como 1 columna
       * y se normaliza a `null` en el storage para mantener simple
       * la compatibilidad hacia atrás.
       */
      setSectionColumns: (sectionId: string, columns: number | null | undefined) => ReturnType

      /**
       * Fija o actualiza los contenedores de texto asociados a una sección (F2.19).
       *
       * No realiza validaciones geométricas: solo persiste los metadatos.
       * El motor de layout y la exportación decidirán cómo usarlos.
       */
      setSectionLayoutContainers: (
        sectionId: string,
        containers: SectionLayoutConfig['containers'],
      ) => ReturnType
    }
  }
}

/**
 * Extensión ligera que modela secciones de página y su
 * configuración de encabezados/pies y layout (F2.19).
 *
 * No modifica el contenido del documento ni añade nodos visibles;
 * solo mantiene metadatos que luego usará F2.5/F2.19 en la vista paginada
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
            layout: sectionConfig?.layout,
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

        if (!section)
          return false

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

      setSectionColumns:
      (sectionId: string, columns: number | null | undefined) =>
      () => {
        const storage = this.storage as PageSectionState
        const section = storage.sections.find(s => s.id === sectionId)

        if (!section)
          return false

          const normalizedColumns =
          columns == null || columns <= 1
          ? null
          : columns

          if (!section.layout) {
            section.layout = {
              columns: normalizedColumns,
              containers: null,
            }
          } else {
            section.layout.columns = normalizedColumns
          }

          return true
      },

      setSectionLayoutContainers:
      (sectionId: string, containers: SectionLayoutConfig['containers']) =>
      () => {
        const storage = this.storage as PageSectionState
        const section = storage.sections.find(s => s.id === sectionId)

        if (!section)
          return false

          if (!section.layout) {
            section.layout = {
              columns: null,
              containers: containers ?? null,
            }
          } else {
            section.layout.containers = containers ?? null
          }

          return true
      },
    }
  },
})

export default PageSectionExtension
