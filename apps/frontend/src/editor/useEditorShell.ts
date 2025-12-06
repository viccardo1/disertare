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

import { createDisertareEditor } from '@disertare/editor-core'

export function useEditorShell() {
  const editor = createDisertareEditor({
    autofocus: true,
    editorProps: {
      attributes: {
        class: 'dsr-editor-area',
        role: 'textbox',
        'aria-multiline': 'true'
      }
    }
  })

  return { editor }
}
