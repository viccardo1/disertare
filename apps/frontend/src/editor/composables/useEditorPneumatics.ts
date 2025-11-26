// apps/frontend/src/editor/composables/useEditorPneumatics.ts
import { ref } from 'vue'
import type { Editor } from '@tiptap/core'

type GetEditor = () => Editor | null

/**
 * F2.10 — Neumática/Hidráulica.
 *
 * Composable ligero para el panel de Neumática/Hidráulica:
 *  - Mantiene el estado local del formulario (label, notation, notes).
 *  - Inserta un nodo `circuitDiagram` en el editor TipTap.
 *
 * Sigue el mismo patrón general que useEditorChem / useEditorBio / useEditorCircuits:
 *  - No crea el editor, sólo lo consume.
 *  - Si no se pasa getEditor, intenta usar window.editor.
 */
export function useEditorPneumatics(getEditor?: GetEditor) {
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

  function insertPneumaticBlock() {
    const ed = resolveEditor()
    if (!ed) {
      // eslint-disable-next-line no-console
      console.warn('[useEditorPneumatics] Editor no disponible')
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
          label: label.value || 'Bloque neumática/hidráulica sin título',
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
    insertPneumaticBlock,
    resetForm,
  }
}
