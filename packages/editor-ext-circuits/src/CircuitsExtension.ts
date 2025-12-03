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

// packages/editor-ext-circuits/src/CircuitsExtension.ts
import { Node } from '@tiptap/core'
import type { CircuitNodeAttributes } from './types'
import { CircuitNodeView } from './CircuitNodeView'

/**
 * Extensión de dominio F2.9 — Circuitos.
 *
 * Define un nodo de bloque genérico `circuitDiagram` que representa
 * un circuito IEC/ANSI a nivel de documento, sin imponer todavía
 * ningún motor de simulación.
 */
export const CircuitsExtension = Node.create({
  name: 'circuitDiagram',

  group: 'block',

  atom: true,

  addAttributes() {
    const defaults: CircuitNodeAttributes = {
      id: undefined,
      label: 'Circuito sin título',
      notation: '',
      notes: '',
    }

    return {
      id: {
        default: defaults.id,
      },
      label: {
        default: defaults.label,
      },
      notation: {
        default: defaults.notation,
      },
      notes: {
        default: defaults.notes,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'circuit-diagram' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['circuit-diagram', HTMLAttributes]
  },

  addNodeView() {
    return CircuitNodeView
  },
})
