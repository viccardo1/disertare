// packages/editor-ext-images/src/ImageNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageNodeViewComponent from './ImageNodeView.vue'

export const ImageNodeView: NodeViewRenderer =
VueNodeViewRenderer(ImageNodeViewComponent)
