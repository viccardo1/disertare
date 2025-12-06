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

import { describe, it, expect, vi, beforeEach } from "vitest"
import { useEditorShell } from "./useEditorShell"
import { createDisertareEditor } from "@disertare/editor-core"

vi.mock("@disertare/editor-core", () => ({
  createDisertareEditor: vi.fn().mockReturnValue({ id: "fake-editor" }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useEditorShell", () => {
  it("devuelve un objeto con la propiedad editor", () => {
    const { editor } = useEditorShell()
    expect(editor).toEqual({ id: "fake-editor" })
  })

  it("llama a createDisertareEditor con las opciones de accesibilidad esperadas", () => {
    useEditorShell()

    expect(createDisertareEditor).toHaveBeenCalledTimes(1)
    const args = (createDisertareEditor as unknown as vi.Mock).mock.calls[0][0]

    expect(args.autofocus).toBe(true)
    expect(args.editorProps?.attributes?.class).toBe("dsr-editor-area")
    expect(args.editorProps?.attributes?.role).toBe("textbox")
    expect(args.editorProps?.attributes?.["aria-multiline"]).toBe("true")
  })
})
