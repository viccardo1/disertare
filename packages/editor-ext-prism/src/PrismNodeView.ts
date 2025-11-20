// packages/editor-ext-prism/src/PrismNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import PrismNodeViewComponent from './PrismNodeView.vue'

export const PrismNodeView: NodeViewRenderer =
VueNodeViewRenderer(PrismNodeViewComponent)
