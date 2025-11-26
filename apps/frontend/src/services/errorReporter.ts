// apps/frontend/src/services/errorReporter.ts

export interface FrontendErrorContext {
  ruta?: string
  herramientaActiva?: string
  userRole?: string
}

export interface FrontendErrorEvent {
  id: string
  mensaje: string
  stackSimplificado?: string
  modulo: string
  componente?: string
  versionFrontend: string
  versionBackend?: string
  contexto?: FrontendErrorContext
  createdAt: string
}

export interface ReportFrontendErrorOptions {
  mensaje: string
  stackSimplificado?: string
  modulo: string
  componente?: string
  contexto?: FrontendErrorContext
}

/**
 * Versión del frontend, idealmente inyectada en build:
 * define VITE_APP_VERSION en tu vite.config o en .env
 */
const FRONTEND_VERSION =
(import.meta as any).env?.VITE_APP_VERSION ?? 'dev'

/**
 * Log local en memoria (solo navegador) para F2.x.
 * Más adelante lo podrás reemplazar por persistencia en backend.
 */
const localErrors: FrontendErrorEvent[] = []

/**
 * Reporta un error de frontend:
 *  - Lo guarda en memoria (para el panel de Mantenimiento)
 *  - Opcionalmente intenta enviarlo a un backend si existe
 */
export async function reportFrontendError(
  options: ReportFrontendErrorOptions,
): Promise<void> {
  const now = new Date().toISOString()

  const event: FrontendErrorEvent = {
    id: `err-${now}-${Math.random().toString(16).slice(2)}`,
    mensaje: options.mensaje,
    stackSimplificado: options.stackSimplificado,
    modulo: options.modulo,
    componente: options.componente,
    versionFrontend: FRONTEND_VERSION,
    versionBackend: undefined,
    contexto: options.contexto ?? {},
    createdAt: now,
  }

  // Guardar en memoria (para el panel)
  localErrors.unshift(event)
  if (localErrors.length > 200) {
    localErrors.length = 200
  }

  // Intento best-effort de enviar a un backend, si en el futuro existe.
  // Si falla, no rompemos nada.
  try {
    await fetch('/api/maintenance/log-frontend-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  } catch {
    // Silencioso; en F2.x no hay backend.
  }
}

/**
 * Provee los errores recientes desde memoria local.
 */
export function getRecentFrontendErrors(limit = 50): FrontendErrorEvent[] {
  return localErrors.slice(0, limit)
}
