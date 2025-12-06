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

import { createI18n } from "vue-i18n"

const messages = {
  es: {
    app: {
      brand: {
        name: "Disertare",
        infrastructureBadge: "Infraestructura · A2 Editor Core",
      },
      nav: {
        editor: "Editor",
        maintenance: "Mantenimiento",
      },
      footer: {
        title: "Disertare · Plataforma científica",
        legal: "© 2025 Disertare Project — Todos los derechos reservados.",
        icx: "ICX activo · Integración y continuidad",
        shell: "AppShell · Núcleo de interfaz",
      },
    },
  },
  en: {
    app: {
      brand: {
        name: "Disertare",
        infrastructureBadge: "Infrastructure · A2 Editor Core",
      },
      nav: {
        editor: "Editor",
        maintenance: "Maintenance",
      },
      footer: {
        title: "Disertare · Scientific platform",
        legal: "© 2025 Disertare Project — All rights reserved.",
        icx: "ICX enabled · Integration & continuity",
        shell: "AppShell · Interface core",
      },
    },
  },
}

export const i18n = createI18n({
  legacy: false,
  locale: "es",
  fallbackLocale: "en",
  messages,
})
