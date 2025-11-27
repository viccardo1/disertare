// packages/editor-ext-diagrams-adv/src/DiagramAdvNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import DiagramAdvNodeView from './DiagramAdvNodeView.vue'

/**
 * NodeView renderer principal para el nodo "diagram-adv-node".
 * Envuelve el componente Vue `DiagramAdvNodeView.vue` dentro de
 * la integración de TipTap.
 */
export const DiagramAdvNodeViewRenderer: NodeViewRenderer =
VueNodeViewRenderer(DiagramAdvNodeView)
