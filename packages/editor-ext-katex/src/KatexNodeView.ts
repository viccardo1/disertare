// packages/editor-ext-katex/src/KatexNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import KatexNodeViewComponent from './KatexNodeView.vue'

export const KatexNodeView: NodeViewRenderer =
VueNodeViewRenderer(KatexNodeViewComponent)
