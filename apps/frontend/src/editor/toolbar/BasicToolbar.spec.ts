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
import { mount } from "@vue/test-utils"
import BasicToolbar from "./BasicToolbar.vue"

function createEditorMock() {
  const chain = {
    focus: vi.fn().mockReturnThis(),
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleHeading: vi.fn().mockReturnThis(),
    run: vi.fn(),
  }

  return {
    chain: () => chain,
    _chain: chain, // para inspección en los asserts
  }
}

describe("BasicToolbar.vue", () => {
  it("ejecuta toggleBold al hacer click en el botón B", async () => {
    const editor = createEditorMock()
    const wrapper = mount(BasicToolbar, {
      props: { editor },
    })

    const buttons = wrapper.findAll("button")
    await buttons[0].trigger("click")

    expect(editor._chain.toggleBold).toHaveBeenCalled()
    expect(editor._chain.run).toHaveBeenCalled()
  })

  it("ejecuta toggleItalic al hacer click en el botón I", async () => {
    const editor = createEditorMock()
    const wrapper = mount(BasicToolbar, {
      props: { editor },
    })

    const buttons = wrapper.findAll("button")
    await buttons[1].trigger("click")

    expect(editor._chain.toggleItalic).toHaveBeenCalled()
    expect(editor._chain.run).toHaveBeenCalled()
  })

  it("ejecuta toggleHeading nivel 2 al hacer click en H2", async () => {
    const editor = createEditorMock()
    const wrapper = mount(BasicToolbar, {
      props: { editor },
    })

    const buttons = wrapper.findAll("button")
    await buttons[2].trigger("click")

    expect(editor._chain.toggleHeading).toHaveBeenCalledWith({ level: 2 })
    expect(editor._chain.run).toHaveBeenCalled()
  })
})
