// apps/frontend/src/editor/composables/useEditorParts.ts
import { computed, ref, watch } from 'vue'
import type { Editor } from '@tiptap/core'
import {
  defaultAcademicFormats,
  type AcademicFormatId,
  type AcademicPartId,
  type AcademicFormatDefinition,
} from '@disertare/editor-parts'

export function useEditorParts(getEditor: () => Editor | null) {
  const formats = defaultAcademicFormats

  const selectedFormatId = ref<AcademicFormatId>('thesis')
  const selectedPartIds = ref<Set<AcademicPartId>>(new Set())

  const currentFormat = computed<AcademicFormatDefinition | null>(() => {
    return formats.find((f) => f.id === selectedFormatId.value) ?? null
  })

  // Cuando cambia el formato, restablecemos selección por defecto
  watch(
    currentFormat,
    (format) => {
      const next = new Set<AcademicPartId>()
      if (format) {
        for (const part of format.parts) {
          if (part.defaultSelected) {
            next.add(part.id)
          }
        }
      }
      selectedPartIds.value = next
    },
    { immediate: true },
  )

  function isPartSelected(id: AcademicPartId): boolean {
    return selectedPartIds.value.has(id)
  }

  function togglePart(id: AcademicPartId) {
    const set = new Set(selectedPartIds.value)
    if (set.has(id)) set.delete(id)
      else set.add(id)
        selectedPartIds.value = set
  }

  function collectExistingParts(editor: Editor): Set<AcademicPartId> {
    const existing = new Set<AcademicPartId>()
    const json = editor.getJSON()

    function walk(node: any) {
      if (!node || typeof node !== 'object') return

        if (node.type === 'heading') {
          const partId = node.attrs?.['data-part-id'] as AcademicPartId | undefined
          if (partId) existing.add(partId)
        }

        const content = (node as any).content
        if (Array.isArray(content)) {
          content.forEach(walk)
        }
    }

    walk(json)
    return existing
  }

  function insertStructureIntoDocument() {
    const editor = getEditor()
    const format = currentFormat.value

    if (!editor || !format) return

      const selectedParts = format.parts.filter((part) =>
      selectedPartIds.value.has(part.id),
      )

      if (!selectedParts.length) return

        const existingIds = collectExistingParts(editor)
        const partsToInsert = selectedParts.filter(
          (part) => !existingIds.has(part.id),
        )

        if (!partsToInsert.length) {
          window.alert(
            'Todas las partes seleccionadas ya existen en el documento. Puedes renombrarlas o reorganizarlas directamente.',
          )
          return
        }

        const nodes = partsToInsert.map((part) => ({
          type: 'heading',
          attrs: {
            level: 1,
            'data-part-id': part.id,
          },
          content: [
            {
              type: 'text',
              // Texto inicial en español; el usuario podrá renombrarlo.
              text: part.label.es,
            },
          ],
        }))

        editor.chain().focus().insertContent(nodes).run()
  }

  return {
    formats,
      selectedFormatId,
      currentFormat,
      selectedPartIds,
      isPartSelected,
      togglePart,
      insertStructureIntoDocument,
  }
}
