// apps/frontend/src/editor/composables/useEditorCircuits.ts
import { ref } from 'vue'
import type { Editor } from '@tiptap/core'

type GetEditor = () => Editor | null

/**
 * F2.9 — Circuitos.
 *
 * Composable ligero para el panel de Circuitos:
 *  - Mantiene el estado local del formulario (label, notation, notes).
 *  - Inserta un nodo `circuitDiagram` en el editor TipTap.
 *
 * Sigue el mismo patrón general que useEditorChem / useEditorBio:
 *  - No crea el editor, sólo lo consume.
 *  - Si no se pasa getEditor, intenta usar window.editor.
 */
export function useEditorCircuits(getEditor?: GetEditor) {
  const label = ref<string>('')
  const notation = ref<string>('')
  const notes = ref<string>('')

  function resolveEditor(): Editor | null {
    if (getEditor) {
      const ed = getEditor()
      if (ed) return ed
    }

    if (typeof window !== 'undefined' && (window as any).editor) {
      return (window as any).editor as Editor
    }

    return null
  }

  function insertCircuitBlock() {
    const ed = resolveEditor()
    if (!ed) {
      // eslint-disable-next-line no-console
      console.warn('[useEditorCircuits] Editor no disponible')
      return
    }

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
          label: label.value || 'Circuito sin título',
          notation: notation.value,
          notes: notes.value,
        },
      })
      .run()
  }

  function resetForm() {
    label.value = ''
    notation.value = ''
    notes.value = ''
  }

  return {
    label,
    notation,
    notes,
    insertCircuitBlock,
    resetForm,
  }
}
