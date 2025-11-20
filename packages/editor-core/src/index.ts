import { Editor, type EditorOptions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

// Registry tipado para extensiones externas
// Cada extensión puede registrar una función de inicialización (post-create)
export const extensionRegistry: Set<(editor: Editor) => void> = new Set()

/**
 * Registra una función de inicialización de extensión.
 * Se ejecutará tras la creación del editor.
 * Útil para extensiones que necesitan acceso al `editor` (ej. registrar comandos personalizados, listeners, etc.).
 */
export const registerExtension = (fn: (editor: Editor) => void): void => {
  extensionRegistry.add(fn)
}

/**
 * Crea una instancia del editor Disertare con soporte para extensiones registradas.
 *
 * @param content - Contenido inicial del editor (HTML o texto plano)
 * @param options - Opciones adicionales de TipTap (`extensions`, `editorProps`, etc.)
 * @returns Instancia de `Editor` lista para usar
 */
export const createDisertareEditor = (
  content: string = '',
  options: Partial<EditorOptions> = {}
): Editor => {
  const editor = new Editor({
    ...options,
    content,
    extensions: [...(options.extensions || []), StarterKit],
                            enableInputRules: true,
                            enablePasteRules: true,
                            autofocus: false,
                            injectCSS: true,
                            editorProps: {
                              attributes: {
                                class: 'disertare-editor-content',
                                ...(options.editorProps?.attributes || {}),
                              },
                              ...options.editorProps,
                            },
  })

  // Ejecutar todas las funciones de extensión registradas
  // Estas funciones pueden, por ejemplo, registrar comandos adicionales o plugins
  for (const registerFn of extensionRegistry) {
    registerFn(editor)
  }

  return editor
}

// Re-exportación explícita de tipos y clases para consumo externo
export type { Editor, EditorOptions }
export { Editor as TipTapEditor }
