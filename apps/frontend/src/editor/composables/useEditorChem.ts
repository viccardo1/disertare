// apps/frontend/src/editor/composables/useEditorChem.ts
import { computed } from 'vue'
import type { Editor } from '@tiptap/core'

/**
 * F2.7 — Integración mínima de química con el editor.
 *
 * NOTA IMPORTANTE (post F2.3R):
 * - No crea una nueva instancia de Editor.
 * - Por defecto utiliza window.editor (expuesto en useDisertareEditor).
 * - Opcionalmente puede recibir un getEditor() para desacoplarse de window.
 */
export function useEditorChem(getEditor?: () => Editor | null) {
  /**
   * Resuelve la instancia actual de Editor sin crear una nueva.
   */
  const resolveEditor = (): Editor | null => {
    if (getEditor) {
      return getEditor() ?? null
    }

    // Fallback: usar window.editor (debug / integración actual F2.x)
    if (typeof window !== 'undefined' && (window as any).editor) {
      return (window as any).editor as Editor
    }

    return null
  }

  const canInsertChem = computed(() => !!resolveEditor())

  /**
   * Inserta un nodo de estructura química (chemStructure) usando SMILES.
   * - defaultSmiles: cadena SMILES inicial (puede ser vacía).
   */
  function insertChemStructure(defaultSmiles = ''): void {
    const editor = resolveEditor()
    if (!editor) {
      console.warn('[useEditorChem] Editor no disponible para insertar química')
      return
    }

    editor
    .chain()
    .focus()
    .insertContent({
      type: 'chemStructure',
      attrs: {
        id: crypto.randomUUID(),
                   format: 'smiles',
                     value: defaultSmiles,
      },
    })
    .run()
  }

  return {
    canInsertChem,
    insertChemStructure,
  }
}
