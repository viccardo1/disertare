/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  D  DISERTARE                                                    ║
 * ║  Plataforma avanzada de edición técnica, científica y            ║
 * ║  multidisciplinaria.                                             ║
 * ║                                                                  ║
 * ║  © 2025 Disertare Project — Licencia Privativa.                  ║
 * ║  Todos los derechos reservados.                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// packages/editor-ext-circuits/src/CircuitNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'

import CircuitNodeViewVue from './CircuitNodeView.vue'

/**
 * NodeView de circuitos basado en Vue.
 *
 * Se conecta con CircuitsExtension mediante:
 *   addNodeView(() => CircuitNodeView)
 */
export const CircuitNodeView: NodeViewRenderer = VueNodeViewRenderer(
  CircuitNodeViewVue,
)
