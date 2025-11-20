// packages/editor-ext-cad/src/CadNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CadNodeViewComponent from './CadNodeView.vue'

export const CadNodeView: NodeViewRenderer =
VueNodeViewRenderer(CadNodeViewComponent)
