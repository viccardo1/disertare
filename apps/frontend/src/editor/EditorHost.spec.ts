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
import * as shell from "./useEditorShell"

// Mock de EditorContent de @tiptap/vue-3 para no ejecutar lógica real
vi.mock("@tiptap/vue-3", () => ({
  EditorContent: {
    name: "EditorContent",
    props: ["editor"],
    template: `<div class="mock-editor-content"></div>`,
  },
}))

import EditorHost from "./EditorHost.vue"

describe("EditorHost.vue", () => {
  it("monta el editor host y la toolbar básica", () => {
    const fakeEditor = { id: "fake-editor" }

    vi.spyOn(shell, "useEditorShell").mockReturnValue({ editor: fakeEditor })

    const wrapper = mount(EditorHost)

    expect(wrapper.find(".dsr-editor-host").exists()).toBe(true)
    expect(wrapper.find(".dsr-toolbar").exists()).toBe(true)
    expect(wrapper.find(".mock-editor-content").exists()).toBe(true)
  })
})
