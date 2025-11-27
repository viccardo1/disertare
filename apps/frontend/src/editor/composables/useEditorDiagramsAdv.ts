// apps/frontend/src/editor/composables/useEditorDiagramsAdv.ts
import { computed, ref } from 'vue'
import type { Editor } from '@tiptap/core'
import type {
  DiagramKind,
  DiagramAdvAttrs,
} from '@disertare/editor-ext-diagrams-adv'
import { DIAGRAM_TEMPLATES } from '@disertare/editor-ext-diagrams-adv'

/**
 * F2.11 — Integración de diagramas avanzados con el editor.
 *
 * No crea nuevas instancias de Editor:
 *  - Por defecto usa window.editor (inyectado en useDisertareEditor).
 *  - Opcionalmente recibe un getEditor() para desacoplarse de window.
 */
export function useEditorDiagramsAdv(getEditor?: () => Editor | null) {
  function resolveEditor(): Editor | null {
    if (getEditor) return getEditor()

      if (typeof window !== 'undefined' && (window as any).editor) {
        return (window as any).editor as Editor
      }

      return null
  }

  // ------------------------------------------------------
  // Estado del panel
  // ------------------------------------------------------
  const selectedKind = ref<DiagramKind>('ishikawa')
  const selectedTemplateId = ref<string | null>('ishikawa-6m')

  const title = ref<string>('')
  const description = ref<string>('')

  const availableTemplates = computed(() =>
  DIAGRAM_TEMPLATES.filter((t) => t.kind === selectedKind.value),
  )

  const canInsertDiagram = computed<boolean>(() => !!resolveEditor())

  // ------------------------------------------------------
  // Helpers internos
  // ------------------------------------------------------
  function buildAttrsFromState(): Partial<DiagramAdvAttrs> {
    const template = availableTemplates.value.find(
      (t) => t.id === selectedTemplateId.value,
    )

    return {
      kind: selectedKind.value,
      title: title.value.trim() || null,
      description: description.value.trim() || null,
      config: template?.config ?? null,
    }
  }

  function findSelectedDiagram(editor: Editor) {
    const { state } = editor
    const { from, to } = state.selection

    let found: { node: any; pos: number } | null = null

    state.doc.nodesBetween(from, to, (node, pos) => {
      if (found) return false
        if (node.type.name === 'diagramAdv') {
          found = { node, pos }
        }
        return undefined
    })

    return found
  }

  // ------------------------------------------------------
  // 1) Inserción desde el panel
  // ------------------------------------------------------
  function insertDiagramFromPanel() {
    const editor = resolveEditor()
    if (!editor) return

      const attrs = buildAttrsFromState()

      // Si existe el comando dedicado, úsalo
      if ((editor.commands as any).insertDiagramAdv) {
        ;(editor.commands as any).insertDiagramAdv(attrs)
        return
      }

      // Fallback debug F2.11.
      editor
      .chain()
      .focus()
      .insertContent({
        type: 'diagramAdv',
        attrs: {
          id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? (crypto as any).randomUUID()
          : `diagram-${Math.random().toString(36).slice(2)}`,
                     kind: attrs.kind ?? 'ishikawa',
                     title: attrs.title ?? null,
                     description: attrs.description ?? null,
                     // datasetRef reservado para futuras integraciones
                     datasetRef: (attrs as any).datasetRef ?? null,
                     config: attrs.config ?? null,
        },
      })
      .run()
  }

  // ------------------------------------------------------
  // 2) Cargar datos desde el diagrama seleccionado
  // ------------------------------------------------------
  function loadFromSelection() {
    const editor = resolveEditor()
    if (!editor) return

      const selected = findSelectedDiagram(editor)
      if (!selected) {
        // eslint-disable-next-line no-console
        console.warn(
          '[useEditorDiagramsAdv] No se encontró un diagrama avanzado en la selección actual',
        )
        return
      }

      const attrs = (selected.node.attrs || {}) as any

      // Tipo de diagrama
      const kind = (attrs.kind as DiagramKind) || 'ishikawa'
      selectedKind.value = kind

      // Título / descripción
      title.value = attrs.title ?? ''
      description.value = attrs.description ?? ''

      // Intentar deducir plantilla a partir del config
      const templatesForKind = DIAGRAM_TEMPLATES.filter((t) => t.kind === kind)
      let templateId: string | null = null

      if (attrs.config) {
        const configJson = JSON.stringify(attrs.config)
        const match = templatesForKind.find(
          (t) => JSON.stringify(t.config) === configJson,
        )
        if (match) {
          templateId = match.id
        }
      }

      if (!templateId && templatesForKind.length > 0) {
        templateId = templatesForKind[0].id
      }

      selectedTemplateId.value = templateId
  }

  // ------------------------------------------------------
  // 3) Actualizar el diagrama seleccionado
  // ------------------------------------------------------
  function updateSelectedDiagram() {
    const editor = resolveEditor()
    if (!editor) return

      const attrs = buildAttrsFromState()

      // Actualiza el nodo diagramAdv donde está el cursor
      editor
      .chain()
      .focus()
      .updateAttributes('diagramAdv', {
        kind: attrs.kind,
        title: attrs.title ?? null,
        description: attrs.description ?? null,
        config: attrs.config ?? null,
      })
      .run()
  }

  // ------------------------------------------------------
  // Reset del panel
  // ------------------------------------------------------
  function resetPanel() {
    selectedKind.value = 'ishikawa'
    selectedTemplateId.value = 'ishikawa-6m'
    title.value = ''
    description.value = ''
  }

  return {
    // estado
    selectedKind,
    selectedTemplateId,
    availableTemplates,
    title,
    description,

    // capacidades
    canInsertDiagram,

    // acciones
    insertDiagramFromPanel,
    loadFromSelection,
    updateSelectedDiagram,
    // Alias que usa el panel
    updateDiagramFromPanel: updateSelectedDiagram,
    resetPanel,
  }
}
