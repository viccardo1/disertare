// packages/editor-ext-tables/src/TableNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TableNodeViewComponent from './TableNodeView.vue'

export const TableNodeView: NodeViewRenderer =
VueNodeViewRenderer(TableNodeViewComponent)
