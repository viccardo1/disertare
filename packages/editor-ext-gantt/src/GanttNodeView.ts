// packages/editor-ext-gantt/src/GanttNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import GanttNodeViewComponent from './GanttNodeView.vue'

export const GanttNodeView: NodeViewRenderer =
VueNodeViewRenderer(GanttNodeViewComponent)
