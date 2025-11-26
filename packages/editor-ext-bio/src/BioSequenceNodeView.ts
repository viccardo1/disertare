// packages/editor-ext-bio/src/BioSequenceNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import BioSequenceNodeView from './BioSequenceNodeView.vue'

export const BioSequenceNodeViewRenderer: NodeViewRenderer =
VueNodeViewRenderer(BioSequenceNodeView)
