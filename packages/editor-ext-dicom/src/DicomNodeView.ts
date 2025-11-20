// packages/editor-ext-dicom/src/DicomNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import DicomNodeViewComponent from './DicomNodeView.vue'

export const DicomNodeView: NodeViewRenderer =
VueNodeViewRenderer(DicomNodeViewComponent)
