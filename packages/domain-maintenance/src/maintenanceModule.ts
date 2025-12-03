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

// packages/domain-maintenance/src/maintenanceModule.ts
import {
  ConfigSet,
  ConfigSetType,
  FrontendErrorEvent,
  FeatureFlag,
  FeatureFlagState,
  FeatureFlagRule,
  ChangelogEntry,
} from './types'

/**
 * NOTA IMPORTANTE:
 * En esta fase usamos ALMACENAMIENTO EN MEMORIA para que puedas
 * probar el módulo sin base de datos. En producción debes reemplazar
 * estas estructuras por acceso a tu DB / servicio de logging.
 */

const inMemoryErrors: FrontendErrorEvent[] = []
const inMemoryFeatureFlags: FeatureFlag[] = []
const inMemoryChangelog: ChangelogEntry[] = []
const inMemoryConfigSets: ConfigSet[] = []

/**
 * §21 bis.3 — Gestor de configuración versionada
 */

export interface CreateConfigSetInput {
  tipo: ConfigSetType
  payload: unknown
  version: string
  createdBy: string
}

export interface ActivateConfigSetInput {
  id: string
  activatedBy: string
}

/**
 * Crea un nuevo config_set en estado "borrador".
 */
export async function createConfigSetDraft(
  input: CreateConfigSetInput,
): Promise<ConfigSet> {
  const now = new Date().toISOString()

  const configSet: ConfigSet = {
    id: `cfg-${input.tipo}-${now}`,
    tipo: input.tipo,
    version: input.version,
    estado: 'borrador',
    payload: input.payload,
    createdAt: now,
    createdBy: input.createdBy,
  }

  inMemoryConfigSets.push(configSet)
  return configSet
}

/**
 * Activa un config_set (marca como "activa" y depreca versiones previas).
 */
export async function activateConfigSet(
  input: ActivateConfigSetInput,
): Promise<void> {
  const now = new Date().toISOString()

  const target = inMemoryConfigSets.find((c) => c.id === input.id)
  if (!target) return

    // desactivar otros del mismo tipo
    for (const cfg of inMemoryConfigSets) {
      if (cfg.tipo === target.tipo && cfg.id !== target.id && cfg.estado === 'activa') {
        cfg.estado = 'deprecated'
      }
    }

    target.estado = 'activa'
    target.activatedAt = now
    target.activatedBy = input.activatedBy
}

/**
 * Devuelve el config_set activo para un tipo dado.
 */
export async function getActiveConfigSet(
  tipo: ConfigSetType,
): Promise<ConfigSet | null> {
  const active = inMemoryConfigSets.find(
    (c) => c.tipo === tipo && c.estado === 'activa',
  )
  return active ?? null
}

/**
 * §21 bis.2 — Centro de errores y diagnóstico
 */

export interface LogErrorInput {
  mensaje: string
  stackSimplificado?: string
  modulo: string
  componente?: string
  versionFrontend: string
  versionBackend?: string
  contexto?: FrontendErrorEvent['contexto']
}

/**
 * Registra un error de frontend normalizado.
 */
export async function logFrontendError(input: LogErrorInput): Promise<FrontendErrorEvent> {
  const now = new Date().toISOString()

  const event: FrontendErrorEvent = {
    id: `err-${now}-${Math.random().toString(16).slice(2)}`,
    mensaje: input.mensaje,
    stackSimplificado: input.stackSimplificado,
    modulo: input.modulo,
    componente: input.componente,
    versionFrontend: input.versionFrontend,
    versionBackend: input.versionBackend,
    contexto: input.contexto,
    createdAt: now,
  }

  inMemoryErrors.unshift(event) // más reciente al inicio
  // limitamos tamaño para no crecer infinito en dev
  if (inMemoryErrors.length > 500) {
    inMemoryErrors.length = 500
  }

  return event
}

/**
 * Devuelve últimos N errores para mostrarlos en el panel.
 */
export async function getRecentFrontendErrors(limit = 50): Promise<FrontendErrorEvent[]> {
  return inMemoryErrors.slice(0, limit)
}

/**
 * §21 bis.2 — Gestor de feature flags
 */

export interface FeatureFlagContext {
  role?: string
  tenantId?: string
}

/**
 * Devuelve el valor efectivo de un feature flag para un contexto dado.
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  context: FeatureFlagContext = {},
): boolean {
  if (flag.estado === 'off') return false
    if (flag.estado === 'on') return true

      // estado 'gradual'
      // 1) porTenant explícito
      if (flag.reglas?.length) {
        for (const rule of flag.reglas) {
          if (context.tenantId && rule.porTenant?.[context.tenantId]) {
            const state = rule.porTenant[context.tenantId]
            if (state === 'on') return true
              if (state === 'off') return false
          }
        }
      }

      // 2) porcentaje por rol (si aplica)
      const randomValue = Math.random() * 100

      const effectivePercent = computeEffectivePercentage(flag.reglas ?? [], context.role)
      return randomValue < effectivePercent
}

function computeEffectivePercentage(rules: FeatureFlagRule[], role?: string): number {
  let percent = 0
  for (const rule of rules) {
    if (role && rule.porRol?.[role] != null) {
      percent = Math.max(percent, rule.porRol[role]!)
    } else if (rule.porcentajes?.default != null) {
      percent = Math.max(percent, rule.porcentajes.default)
    }
  }
  return percent
}

/**
 * Crea o actualiza un feature flag (memoria en esta fase).
 */
export async function upsertFeatureFlag(
  flag: FeatureFlag,
): Promise<void> {
  const existingIdx = inMemoryFeatureFlags.findIndex((f) => f.key === flag.key)
  if (existingIdx >= 0) {
    inMemoryFeatureFlags[existingIdx] = flag
  } else {
    inMemoryFeatureFlags.push(flag)
  }
}

/**
 * Obtiene todos los feature flags (para el panel).
 */
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  return inMemoryFeatureFlags.slice()
}

/**
 * §21 bis.2 — Changelog interno
 */

export interface RecordChangelogInput {
  tipo: ChangelogEntry['tipo']
  referenciaId: string
  titulo: string
  descripcion: string
  creadoPor: string
}

/**
 * Registra una entrada de changelog interno.
 */
export async function recordChangelogEntry(
  input: RecordChangelogInput,
): Promise<ChangelogEntry> {
  const now = new Date().toISOString()
  const entry: ChangelogEntry = {
    id: `chg-${now}-${Math.random().toString(16).slice(2)}`,
    tipo: input.tipo,
    referenciaId: input.referenciaId,
    titulo: input.titulo,
    descripcion: input.descripcion,
    creadoPor: input.creadoPor,
    creadoEn: now,
  }

  inMemoryChangelog.unshift(entry)
  if (inMemoryChangelog.length > 200) {
    inMemoryChangelog.length = 200
  }

  return entry
}

export async function getChangelogEntries(limit = 50): Promise<ChangelogEntry[]> {
  return inMemoryChangelog.slice(0, limit)
}
