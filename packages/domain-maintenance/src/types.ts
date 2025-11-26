// packages/domain-maintenance/src/types.ts

export type ConfigSetType =
  | 'formatos_academicos'
  | 'ui_textos'
  | 'validaciones_basicas'
  | string

export type ConfigSetState = 'borrador' | 'activa' | 'deprecated'

/**
 * §21 bis.3 — Entidad lógica `config_set`
 */
export interface ConfigSet {
  id: string
  tipo: ConfigSetType
  version: string
  estado: ConfigSetState
  payload: unknown // JSON estructurado, validado externamente
  createdAt: string // ISO
  createdBy: string
  activatedAt?: string
  activatedBy?: string
}

/**
 * Identificador lógico de formato académico (tesis, artículo, etc.)
 */
export type FormatoAcademicoId =
  | 'tesis_licenciatura'
  | 'tesis_maestria'
  | 'tesis_doctorado'
  | 'articulo_cientifico'
  | 'reporte_tecnico'
  | string

export interface FormatoCampo {
  id: string
  etiqueta: string
  tipo: 'texto' | 'numero' | 'fecha' | 'selector' | 'textarea'
  obligatorio: boolean
  ayuda?: string
  opciones?: string[] // para selectores
  orden: number
  // se pueden añadir más propiedades específicas en el futuro
}

export interface FormatoSeccion {
  id: string
  nombre: string
  descripcion?: string
  orden: number
  campos: FormatoCampo[]
}

/**
 * Payload específico para `config_set` de tipo `formatos_academicos`
 * (se guarda dentro de ConfigSet.payload)
 */
export interface FormatosAcademicosConfigPayload {
  formatos: Array<{
    id: FormatoAcademicoId
    nombre: string
    version: string
    idioma: string // ej. es, en
    secciones: FormatoSeccion[]
    metadatos?: Record<string, unknown>
  }>
}

/**
 * §8.1 — Propuestas de cambio de formato (borradores de actualización)
 */
export type FormatoCambioEstado =
  | 'pendiente'
  | 'en_revision'
  | 'aprobada'
  | 'rechazada'

export interface FormatoCampoDiff {
  campoId: string
  cambio: 'agregado' | 'eliminado' | 'modificado'
  antes?: Partial<FormatoCampo>
  despues?: Partial<FormatoCampo>
}

export interface FormatoSeccionDiff {
  seccionId: string
  cambio: 'agregada' | 'eliminada' | 'modificada'
  camposDiff?: FormatoCampoDiff[]
  antes?: Partial<FormatoSeccion>
  despues?: Partial<FormatoSeccion>
}

/**
 * Diff alto nivel entre versión actual de un formato y la propuesta
 */
export interface FormatoCambioDiff {
  formatoId: FormatoAcademicoId
  desdeVersion: string
  hastaVersionPropuesta: string
  seccionesDiff: FormatoSeccionDiff[]
}

/**
 * Borrador de actualización de formato académico
 * (resultado del job mensual, antes de aprobación)
 */
export interface FormatoCambioDraft {
  id: string
  formatoId: FormatoAcademicoId
  estado: FormatoCambioEstado
  diff: FormatoCambioDiff
  motivo?: string
  createdAt: string
  createdBy: string // normalmente, sistema (job)
  updatedAt?: string
  updatedBy?: string
  efectivaDesde?: string // fecha de entrada en vigor sugerida
}

/**
 * §21 bis.2 — Centro de errores y diagnóstico
 */
export interface FrontendErrorEvent {
  id: string
  mensaje: string
  stackSimplificado?: string
  modulo: string // ej. editor, editor-ext-bio, mermaid-node-view
  componente?: string
  versionFrontend: string
  versionBackend?: string
  contexto?: {
    ruta?: string
    herramientaActiva?: string // tablas, citas, bio, chem, etc.
    userRole?: string
  }
  createdAt: string
}

/**
 * §21 bis.2 — Feature flags
 */
export type FeatureFlagState = 'on' | 'off' | 'gradual'

export interface FeatureFlagRule {
  id: string
  descripcion?: string
  porcentajes?: {
    default?: number // 0-100
    porRol?: Record<string, number>
  }
  porTenant?: Record<string, FeatureFlagState>
}

export interface FeatureFlag {
  key: string
  descripcion?: string
  estado: FeatureFlagState
  reglas?: FeatureFlagRule[]
  createdAt: string
  updatedAt?: string
}

/**
 * §21 bis.2 — Changelog interno
 */
export interface ChangelogEntry {
  id: string
  tipo: 'app_version' | 'config_set' | 'feature_flag' | 'formato_academico'
  referenciaId: string // ej. versión, id de config_set, etc.
  titulo: string
  descripcion: string
  creadoPor: string
  creadoEn: string
}
