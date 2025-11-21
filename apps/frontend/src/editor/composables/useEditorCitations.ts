// apps/frontend/src/editor/composables/useEditorCitations.ts
import { ref, watch } from 'vue'
import type { Editor } from '@tiptap/core'
import {
  createCitationManager,
} from '@disertare/editor-citations'
import type { CitationStyleId } from '@disertare/editor-citations'

/**
 * F2.3 / F2.3.R
 * Gestión de citas y bibliografía:
 *  - citationManager (fuente de verdad en memoria).
 *  - estilo actual de cita.
 *  - comandos de inserción de cita / bibliografía.
 *  - forzar re-render de citas + bibliografía.
 */
export function useEditorCitations(getEditor: () => Editor | null) {
  const citationManager = createCitationManager()
  const currentCitationStyle = ref<CitationStyleId>('apa')
  const citationStyles: CitationStyleId[] = [
    'apa',
    'mla',
    'chicago',
    'harvard',
    'vancouver',
    'ieee',
    'acs',
    'iso690',
    'turabian',
  ]

  function bumpCitationAndBibliographyRenderVersion(): void {
    const editor = getEditor()
    if (!editor) return

    const { state, view } = editor
    let tr = state.tr
    let changed = false

    state.doc.descendants((node, pos) => {
      if (node.type.name === 'citationInline' || node.type.name === 'bibliography') {
        const current =
          (node.attrs as any).renderVersion != null
            ? Number((node.attrs as any).renderVersion)
            : 0

        const newAttrs = {
          ...node.attrs,
          renderVersion: current + 1,
        }

        tr = tr.setNodeMarkup(pos, node.type, newAttrs)
        changed = true
      }
    })

    if (changed) {
      view.dispatch(tr)
    }
  }

  // cambio de estilo → actualizar en citationManager + re-render
  watch(currentCitationStyle, (style) => {
    citationManager.setStyle(style)
    bumpCitationAndBibliographyRenderVersion()
  })

  function insertCitation(): void {
    const editor = getEditor()
    if (!editor) return

    const currentRefs = citationManager.listReferences()
    if (currentRefs.length === 0) {
      // sin refs: el shell abrirá el panel de citas
      return
    }

    const refId = currentRefs[0].id

    editor
      .chain()
      .focus()
      .insertCitation({
        refId,
        locator: null,
        prefix: null,
        suffix: null,
      })
      .run()
  }

  function insertCitationFor(refId: string): void {
    const editor = getEditor()
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertCitation({
        refId,
        locator: null,
        prefix: null,
        suffix: null,
      })
      .run()
  }

  function insertBibliographyBlock(): void {
    const editor = getEditor()
    if (!editor) return

    const { state } = editor
    const type = state.schema.nodes['bibliography']

    if (!type) {
      console.warn('[F2.3] Nodo bibliography no encontrado en el schema.')
      return
    }

    let foundPos: number | null = null

    state.doc.descendants((node, pos) => {
      if (node.type === type && foundPos === null) {
        foundPos = pos
        return false
      }
      return true
    })

    if (foundPos != null) {
      // Ya hay bibliografía: seleccionamos el nodo de bloque
      editor
        .chain()
        .focus()
        .setNodeSelection(foundPos)
        .run()
      return
    }

    // No hay bibliografía: insertamos una nueva
    editor
      .chain()
      .focus()
      .insertBibliography({
        style: currentCitationStyle.value,
        title: 'Referencias',
      })
      .run()
  }

  function forceRerenderCitationsAndBibliography(): void {
    bumpCitationAndBibliographyRenderVersion()
  }

  return {
    citationManager,
    currentCitationStyle,
    citationStyles,
    insertCitation,
    insertCitationFor,
    insertBibliographyBlock,
    forceRerenderCitationsAndBibliography,
  }
}
