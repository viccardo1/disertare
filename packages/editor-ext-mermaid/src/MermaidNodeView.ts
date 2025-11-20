// packages/editor-ext-mermaid/src/MermaidNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import MermaidNodeViewComponent from './MermaidNodeView.vue'

export const MermaidNodeView: NodeViewRenderer =
VueNodeViewRenderer(MermaidNodeViewComponent)
