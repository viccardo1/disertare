// /home/vicente/Disertare/apps/frontend/src/main.ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

/**
 * Handler global de errores de Vue 3
 * F2.8 (simplificado para dev): solo loguea en consola,
 * sin enviar al backend para evitar bucles de errores.
 */
app.config.errorHandler = (err, instance, info) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('[Vue errorHandler]', err, info)
  }
}

/**
 * Errores no capturados del navegador (JS runtime)
 */
window.addEventListener('error', (event) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('[window.error]', event)
  }
})

/**
 * Promesas no manejadas (unhandledrejection)
 */
window.addEventListener('unhandledrejection', (event) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('[unhandledrejection]', event)
  }
})

app.mount('#app')
