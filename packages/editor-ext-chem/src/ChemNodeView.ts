// packages/editor-ext-chem/src/ChemNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'

import ChemNodeViewVue from './ChemNodeView.vue'

/**
 * NodeView de química basado en Vue.
 *
 * Se conecta con ChemExtension en:
 *   addNodeView(() => ChemNodeView)
 */
export const ChemNodeView: NodeViewRenderer = VueNodeViewRenderer(
  ChemNodeViewVue,
)
