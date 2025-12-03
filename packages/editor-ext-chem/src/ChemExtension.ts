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

// packages/editor-ext-chem/src/ChemExtension.ts
import { Node } from '@tiptap/core'
import { ChemNodeView } from './ChemNodeView'

export const ChemExtension = Node.create({
  name: 'chemStructure',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      format: { default: 'smiles' },
        value: { default: '' },

        /**
         * Atributos heredados / de compatibilidad:
         *  - layout2D: reservado para guardar coordenadas 2D en fases posteriores.
         *  - metadata: información adicional de la molécula (JSON serializable).
         */
        layout2D: { default: null },
        metadata: { default: {} },

        /**
         * Atributos añadidos en F2.7 para el NodeView:
         *  - title: texto descriptivo mostrado en el header de la tarjeta.
         *  - viewMode: '2d' | '3d' para recordar el modo de visualización.
         *  - smiles: duplicado semántico de value, para compatibilidad explícita.
         */
        title: { default: null },
        viewMode: { default: '2d' },
        smiles: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'chem-structure' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['chem-structure', HTMLAttributes]
  },

  addNodeView() {
    return ChemNodeView
  },
})
