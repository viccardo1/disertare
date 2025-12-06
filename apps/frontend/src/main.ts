// /home/vicente/Disertare/apps/frontend/src/main.ts
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

import { createApp, type App as VueApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'

/**
 * F0 — Infraestructura (AppShell, Editor Core, Runtime)
 *
 * Este archivo implementa las interfaces expuestas indicadas en:
 * ICX — Integración completa F0–F52, bloque F0:
 *
 *  - Editor.mount()
 *  - Editor.unmount()
 *  - ModuleLoader.load(id)
 *  - Runtime.Events
 *
 * No introduce nuevas fases ni capacidades; solo organiza la infraestructura
 * de arranque según el ICX.
 */

type EventHandler = (...args: any[]) => void

/**
 * Tipo mínimo para representar una instancia de editor montada.
 * Es un detalle interno de implementación de F0.
 */
export interface EditorInstance {
  vueApp: VueApp<Element>
  root: string | Element
}

/**
 * Runtime.Events — bus de eventos globales del runtime.
 * Implementación mínima con una pequeña clase interna.
 */
class RuntimeEvents {
  private listeners = new Map<string, Set<EventHandler>>()

  on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }

  off(event: string, handler: EventHandler) {
    const set = this.listeners.get(event)
    if (!set) return
      set.delete(handler)
      if (set.size === 0) {
        this.listeners.delete(event)
      }
  }

  emit(event: string, payload?: unknown) {
    const set = this.listeners.get(event)
    if (!set) return
      for (const handler of set) {
        try {
          handler(payload)
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[Disertare][F0][Runtime.Events] Handler error:', err)
        }
      }
  }
}

const runtimeEvents = new RuntimeEvents()

export const Runtime = {
  Events: {
    on: (event: string, handler: EventHandler) =>
    runtimeEvents.on(event, handler),
    off: (event: string, handler: EventHandler) =>
    runtimeEvents.off(event, handler),
    emit: (event: string, payload?: unknown) =>
    runtimeEvents.emit(event, payload),
  },
} as const

/**
 * ModuleLoader.load(id)
 *
 * Implementación mínima de F0:
 * - La interfaz existe porque ICX la exige.
 * - El comportamiento real se definirá en fases posteriores.
 */
export const ModuleLoader = {
  async load(id: string): Promise<never> {
    throw new Error(
      `[F0] ModuleLoader.load(${id}) no está implementado todavía. ` +
      'La interfaz existe según ICX, pero el loader real se activará en fases posteriores.',
    )
  },
} as const

/**
 * Editor.mount() / Editor.unmount()
 *
 * Para F0, el "editor" es la aplicación Vue principal
 * (AppShell + núcleos que se vayan activando por fase).
 */
export const Editor = {
  mount(root: string | Element = '#app'): EditorInstance {
    const container =
    typeof root === 'string'
    ? document.querySelector<HTMLElement>(root)
    : (root as HTMLElement)

    if (!container) {
      throw new Error(
        `[F0] No se encontró el contenedor raíz "${String(root)}" para Editor.mount().`,
      )
    }

    const vueApp = createApp(App)

    // i18n base de F0
    vueApp.use(i18n)

    /**
     * Handler global de errores de Vue 3
     * (versión previa, conservada tal cual para F0).
     */
    vueApp.config.errorHandler = (err, _instance, info) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[Vue errorHandler]', err, info)
      }
      // En fases posteriores se podría emitir en Runtime.Events
      // Runtime.Events.emit('runtime:error', { err, info })
    }

    /**
     * Errores no capturados del navegador (JS runtime)
     * y promesas no manejadas.
     */
    window.addEventListener('error', (event) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[window.error]', event)
      }
    })

    window.addEventListener('unhandledrejection', (event) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[unhandledrejection]', event)
      }
    })

    vueApp.mount(container)

    return {
      vueApp,
      root,
    }
  },

  unmount(instance: EditorInstance): void {
    instance.vueApp.unmount()
  },
} as const

/**
 * Manifest ICX del core-runtime para esta fase.
 * Representa el bloque ICX.Register descrito en el documento ICX F0.
 */
export const ICXCoreRuntimeManifest = {
  extensionId: 'core-runtime',
  version: '1.0',
  createdInPhase: 'F0',
  provides: ['EditorCore', 'ModuleLoader'],
  consumes: [] as string[],
  uemIntegration: false,
  legalFingerprint: 'auto',
} as const

/**
 * Arranque inmediato del editor para la aplicación standalone.
 * Fases posteriores podrán controlar el montaje de forma diferente.
 */
const instance = Editor.mount('#app')

// Exposición en window solo para diagnóstico en desarrollo.
if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__DISERTARE_F0__ = {
    Editor,
    ModuleLoader,
    Runtime,
    ICXCoreRuntimeManifest,
    instance,
  }
}
