// /home/vicente/Disertare/apps/frontend/src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { reportFrontendError } from './services/errorReporter'

const app = createApp(App)

/**
 * Handler global de errores de Vue 3
 * §21 bis — Centro de errores y diagnóstico
 */
app.config.errorHandler = (err, instance, info) => {
  const mensaje =
  err instanceof Error ? err.message : String(err)

  const stackSimplificado =
  err instanceof Error && err.stack
  ? err.stack.split('\n').slice(0, 5).join('\n')
  : undefined

  const componente =
  (instance && (instance as any).$options &&
  ((instance as any).$options.name ||
  (instance as any).$options.__file)) ||
  'desconocido'

  const modulo = 'frontend'

  void reportFrontendError({
    mensaje,
    stackSimplificado,
    modulo,
    componente,
    contexto: {
      ruta: window.location?.pathname,
      // herramientaActiva: aquí puedes inyectar algo de un store global en el futuro
    },
  })

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('[Vue errorHandler]', err, info)
  }
}

/**
 * Errores no capturados del navegador (JS runtime)
 */
window.addEventListener('error', (event) => {
  if (!event.error) return

    const err = event.error
    const mensaje =
    err instanceof Error ? err.message : String(err)
    const stackSimplificado =
    err instanceof Error && err.stack
    ? err.stack.split('\n').slice(0, 5).join('\n')
    : undefined

    void reportFrontendError({
      mensaje,
      stackSimplificado,
      modulo: 'window',
      componente: 'global',
      contexto: {
        ruta: window.location?.pathname,
      },
    })

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[window.error]', event)
    }
})

/**
 * Promesas no manejadas (unhandledrejection)
 */
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const mensaje =
  reason instanceof Error ? reason.message : String(reason)
  const stackSimplificado =
  reason instanceof Error && reason.stack
  ? reason.stack.split('\n').slice(0, 5).join('\n')
  : undefined

  void reportFrontendError({
    mensaje,
    stackSimplificado,
    modulo: 'unhandledrejection',
    componente: 'global',
    contexto: {
      ruta: window.location?.pathname,
    },
  })

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('[unhandledrejection]', event)
  }
})

app.mount('#app')
