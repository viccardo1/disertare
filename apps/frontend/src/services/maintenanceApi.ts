// apps/frontend/src/services/maintenanceApi.ts

export interface FrontendErrorEvent {
  id: string
  mensaje: string
  stackSimplificado?: string
  modulo: string
  componente?: string
  versionFrontend: string
  versionBackend?: string
  contexto?: {
    ruta?: string
    herramientaActiva?: string
    userRole?: string
  }
  createdAt: string
}

export interface FeatureFlag {
  key: string
  descripcion?: string
  estado: 'on' | 'off' | 'gradual'
  reglas?: any[]
  createdAt: string
  updatedAt?: string
}

export interface ChangelogEntry {
  id: string
  tipo: 'app_version' | 'config_set' | 'feature_flag' | 'formato_academico'
  referenciaId: string
  titulo: string
  descripcion: string
  creadoPor: string
  creadoEn: string
}

export async function fetchRecentErrors(limit = 20): Promise<FrontendErrorEvent[]> {
  const res = await fetch(`/api/maintenance/errors?limit=${limit}`)
  if (!res.ok) throw new Error('No se pudieron obtener los errores')
  const data = await res.json()
  return data.items ?? []
}

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const res = await fetch('/api/maintenance/feature-flags')
  if (!res.ok) throw new Error('No se pudieron obtener los feature flags')
  const data = await res.json()
  return data.items ?? []
}

export async function fetchChangelog(limit = 20): Promise<ChangelogEntry[]> {
  const res = await fetch(`/api/maintenance/changelog?limit=${limit}`)
  if (!res.ok) throw new Error('No se pudo obtener el changelog')
  const data = await res.json()
  return data.items ?? []
}
