// packages/editor-ext-bio/src/BioExtension.ts
import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewRenderer } from '@tiptap/core'
import { BioSequenceNodeViewRenderer } from './BioSequenceNodeView'
import type { BioSequenceAttrs, BioSequenceKind } from './types'

const DEFAULT_LABEL = 'Secuencia sin título'

export interface BioSequenceOptions {
  /**
   * Atributos HTML extra para el wrapper.
   */
  HTMLAttributes: Record<string, any>
}

/**
 * F2.8 — Nodo de dominio para secuencias biológicas.
 *
 * - Representa un bloque atómico (`atom`) para DNA/RNA/proteína.
 * - Se edita a través del panel Bio + NodeView Vue.
 * - Puede almacenar metadatos de análisis (analysis, annotations) generados
 *   en el panel Bio para evitar recalcular en el cliente.
 */
export const BioExtension = Node.create<BioSequenceOptions, BioSequenceAttrs>({
  name: 'bioSequence',

  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      id: {
        default: null,
      },
      kind: {
        default: 'dna' as BioSequenceKind,
      },
      label: {
        default: DEFAULT_LABEL,
      },
      sequence: {
        default: '',
      },
      /**
       * Resultado del análisis realizado en el panel Bio.
       * Se deja como `any` en el tipo de attrs para permitir evolución
       * sin romper documentos previos.
       */
      analysis: {
        default: null,
      },
      /**
       * Espacio para anotaciones futuras (features, regiones, etc.).
       * En F2.8 se deja como arreglo libre, pero se mantiene estructurado
       * para F2.x+ donde se pueda integrar con stats/datos.
       */
      annotations: {
        default: [],
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="bio-sequence"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'bio-sequence',
      }),
      0,
    ]
  },

  addNodeView(): NodeViewRenderer {
    return BioSequenceNodeViewRenderer
  },
})
