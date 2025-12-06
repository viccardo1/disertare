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

import { describe, it, expect, vi } from "vitest"
import { Editor } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import {
  extensionRegistry,
  registerExtension,
  createDisertareEditor,
} from "./index"

// Mock de Editor como "clase" para poder usar `new Editor(...)`
vi.mock("@tiptap/core", () => {
  const EditorMock = vi.fn(function Editor(this: any, options: any) {
    this.options = options
  })

  return {
    Editor: EditorMock,
  }
})

// Mock simple de StarterKit
vi.mock("@tiptap/starter-kit", () => ({
  default: {},
}))

describe("editor-core", () => {
  it("registra funciones en extensionRegistry con registerExtension", () => {
    const fn = vi.fn()
    extensionRegistry.clear()

    registerExtension(fn)

    expect(extensionRegistry.has(fn)).toBe(true)
  })

  it("createDisertareEditor crea un Editor con StarterKit por defecto", () => {
    extensionRegistry.clear()

    const editor = createDisertareEditor()

    const EditorMock = Editor as unknown as vi.Mock
    expect(EditorMock).toHaveBeenCalledTimes(1)

    const callOptions = (EditorMock.mock.instances[0] as any).options

    // StarterKit debe estar dentro del array de extensiones
    expect(callOptions.extensions).toContain(StarterKit)
    expect(editor).toBeTypeOf("object")
  })

  it("ejecuta todas las funciones registradas en extensionRegistry al crear el editor", () => {
    extensionRegistry.clear()

    const fn1 = vi.fn()
    const fn2 = vi.fn()

    registerExtension(fn1)
    registerExtension(fn2)

    const editor = createDisertareEditor()

    expect(fn1).toHaveBeenCalledWith(editor)
    expect(fn2).toHaveBeenCalledWith(editor)
  })
})
