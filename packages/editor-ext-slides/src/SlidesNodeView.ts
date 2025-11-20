// packages/editor-ext-slides/src/SlidesNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import SlidesNodeViewComponent from './SlidesNodeView.vue'

export const SlidesNodeView: NodeViewRenderer =
VueNodeViewRenderer(SlidesNodeViewComponent)
