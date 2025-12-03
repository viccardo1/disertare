<!--
╔══════════════════════════════════════════════════════════════════╗
║  D  DISERTARE                                                    ║
║  Plataforma avanzada de edición técnica, científica y            ║
║  multidisciplinaria.                                             ║
║                                                                  ║
║  © 2025 Disertare Project — Licencia Privativa.                  ║
║  Todos los derechos reservados.                                  ║
╚══════════════════════════════════════════════════════════════════╝
-->

# Disertare – Dump de paquetes del editor

> Generado automáticamente por `disertare-md-dump.sh`
> Fecha: 2025-12-02T00:24:54-06:00

---


## Paquete `domain-maintenance`


### `packages/domain-maintenance/src/maintenanceModule.ts`

```ts
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
```


### `packages/domain-maintenance/src/monthlyFormatsProcess.ts`

```ts
// packages/domain-maintenance/src/monthlyFormatsProcess.ts

import {
  ConfigSet,
  FormatosAcademicosConfigPayload,
  FormatoCambioDraft,
  FormatoCambioDiff,
  FormatoAcademicoId,
  FormatoSeccion,
  FormatoSeccionDiff,
  FormatoCampo,
  FormatoCampoDiff,
} from './types'

/**
 * Punto de entrada del job mensual.
 * §8.1 — "Programación automática (backend)"
 */
export async function runMonthlyFormatReview(): Promise<FormatoCambioDraft[]> {
  // 1) Cargar configuración vigente de formatos académicos
  const activeConfigSet = await loadActiveFormatosConfigSet()

  // 2) Cargar "fuente de verdad" normativa (se define fuera de este módulo)
  const normativeSource = await loadNormativeSourceForFormats()

  // 3) Calcular diffs / propuestas de cambio
  const drafts = generateFormatChangeDrafts(activeConfigSet, normativeSource)

  // 4) Guardar borradores de actualización para la bandeja de revisión
  if (drafts.length > 0) {
    await persistFormatChangeDrafts(drafts)
  }

  // 5) (Opcional) notificar a administradores que hay nuevas propuestas
  await notifyAdminsAboutNewDrafts(drafts)

  return drafts
}

/**
 * Carga el config_set ACTIVO para formatos académicos.
 * Aquí debes conectar con tu capa de persistencia (DB, S3, etc.).
 */
async function loadActiveFormatosConfigSet(): Promise<ConfigSet & {
  payload: FormatosAcademicosConfigPayload
}> {
  // TODO: reemplazar por tu implementación real
  // Ejemplo: leer de tu tabla `config_sets` donde tipo='formatos_academicos' y estado='activa'
  throw new Error('loadActiveFormatosConfigSet() no implementado')
}

/**
 * Carga la "fuente de verdad" de normas para formatos académicos.
 * En esta fase NO conectamos automáticamente a sitios externos:
 * se asume una fuente curada/configurada por el equipo (JSON, tabla, etc.).
 */
async function loadNormativeSourceForFormats(): Promise<FormatosAcademicosConfigPayload> {
  // TODO: podría leer de un `config_set` especial, un archivo versionado o servicio interno
  throw new Error('loadNormativeSourceForFormats() no implementado')
}

/**
 * Compara la configuración activa con la fuente normativa y
 * genera borradores de cambio (sin aplicarlos aún).
 */
export function generateFormatChangeDrafts(
  activeConfigSet: ConfigSet & { payload: FormatosAcademicosConfigPayload },
  normative: FormatosAcademicosConfigPayload,
): FormatoCambioDraft[] {
  const drafts: FormatoCambioDraft[] = []
  const nowIso = new Date().toISOString()

  const activeById = new Map<FormatoAcademicoId, (typeof activeConfigSet.payload.formatos)[number]>()
  for (const f of activeConfigSet.payload.formatos) {
    activeById.set(f.id, f)
  }

  for (const nf of normative.formatos) {
    const current = activeById.get(nf.id)
    if (!current) {
      // Formato nuevo en la normativa → proponer alta
      const diff: FormatoCambioDiff = {
        formatoId: nf.id,
        desdeVersion: '0.0.0',
        hastaVersionPropuesta: nf.version,
        seccionesDiff: nf.secciones.map<FormatoSeccionDiff>((s) => ({
          seccionId: s.id,
          cambio: 'agregada',
          despues: s,
        })),
      }

      drafts.push({
        id: `fmt-draft-${nf.id}-${nowIso}`,
        formatoId: nf.id,
        estado: 'pendiente',
        diff,
        motivo: 'Nuevo formato detectado en la fuente normativa.',
        createdAt: nowIso,
        createdBy: 'system:monthly-format-job',
      })
      continue
    }

    // Mismo formato → comparar versiones y estructura
    if (current.version === nf.version) {
      // Mismo número de versión: se asume sin cambios normativos relevantes
      // (puedes añadir aquí detección extra si quieres forzar revisión)
      continue
    }

    const seccionesDiff = diffSecciones(current.secciones, nf.secciones)
    if (seccionesDiff.length === 0) {
      // Cambio de versión pero sin diferencias estructurales detectables
      continue
    }

    const diff: FormatoCambioDiff = {
      formatoId: nf.id,
      desdeVersion: current.version,
      hastaVersionPropuesta: nf.version,
      seccionesDiff,
    }

    drafts.push({
      id: `fmt-draft-${nf.id}-${nowIso}`,
      formatoId: nf.id,
      estado: 'pendiente',
      diff,
      motivo: `Actualización normativa propuesta: ${current.version} → ${nf.version}`,
      createdAt: nowIso,
      createdBy: 'system:monthly-format-job',
    })
  }

  return drafts
}

/**
 * Calcula el diff de secciones y campos para un formato concreto.
 */
function diffSecciones(
  actuales: FormatoSeccion[],
  nuevas: FormatoSeccion[],
): FormatoSeccionDiff[] {
  const diffs: FormatoSeccionDiff[] = []
  const mapaActual = new Map<string, FormatoSeccion>()
  const mapaNueva = new Map<string, FormatoSeccion>()

  for (const s of actuales) mapaActual.set(s.id, s)
  for (const s of nuevas) mapaNueva.set(s.id, s)

  // Secciones eliminadas o modificadas
  for (const [id, act] of mapaActual.entries()) {
    const neu = mapaNueva.get(id)
    if (!neu) {
      diffs.push({
        seccionId: id,
        cambio: 'eliminada',
        antes: act,
      })
      continue
    }

    const camposDiff = diffCampos(act.campos, neu.campos)
    if (
      act.nombre !== neu.nombre ||
      act.descripcion !== neu.descripcion ||
      act.orden !== neu.orden ||
      camposDiff.length > 0
    ) {
      diffs.push({
        seccionId: id,
        cambio: 'modificada',
        antes: act,
        despues: neu,
        camposDiff,
      })
    }
  }

  // Secciones agregadas
  for (const [id, neu] of mapaNueva.entries()) {
    if (!mapaActual.has(id)) {
      diffs.push({
        seccionId: id,
        cambio: 'agregada',
        despues: neu,
      })
    }
  }

  return diffs
}

function diffCampos(
  actuales: FormatoCampo[],
  nuevos: FormatoCampo[],
): FormatoCampoDiff[] {
  const diffs: FormatoCampoDiff[] = []
  const mapaActual = new Map<string, FormatoCampo>()
  const mapaNuevo = new Map<string, FormatoCampo>()

  for (const c of actuales) mapaActual.set(c.id, c)
  for (const c of nuevos) mapaNuevo.set(c.id, c)

  // Campos eliminados o modificados
  for (const [id, act] of mapaActual.entries()) {
    const neu = mapaNuevo.get(id)
    if (!neu) {
      diffs.push({
        campoId: id,
        cambio: 'eliminado',
        antes: act,
      })
      continue
    }

    if (
      act.etiqueta !== neu.etiqueta ||
      act.tipo !== neu.tipo ||
      act.obligatorio !== neu.obligatorio ||
      act.ayuda !== neu.ayuda ||
      act.orden !== neu.orden ||
      JSON.stringify(act.opciones ?? []) !== JSON.stringify(neu.opciones ?? [])
    ) {
      diffs.push({
        campoId: id,
        cambio: 'modificado',
        antes: act,
        despues: neu,
      })
    }
  }

  // Campos agregados
  for (const [id, neu] of mapaNuevo.entries()) {
    if (!mapaActual.has(id)) {
      diffs.push({
        campoId: id,
        cambio: 'agregado',
        despues: neu,
      })
    }
  }

  return diffs
}

/**
 * Persiste los borradores para que aparezcan en la bandeja de revisión (§8.1, paso 2).
 */
async function persistFormatChangeDrafts(drafts: FormatoCambioDraft[]): Promise<void> {
  // TODO: insertar en la tabla `formato_cambio_drafts` o equivalente
  void drafts
  throw new Error('persistFormatChangeDrafts() no implementado')
}

/**
 * Notificación opcional a administradores (correo, notificación in-app, etc.).
 */
async function notifyAdminsAboutNewDrafts(drafts: FormatoCambioDraft[]): Promise<void> {
  if (!drafts.length) return
  // TODO: integrar con tu sistema de notificaciones
  void drafts
}
```


### `packages/domain-maintenance/src/types.ts`

```ts
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
```


## Paquete `editor-citations`


### `packages/editor-citations/package.json`

```json
{
  "name": "@disertare/editor-citations",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  }
}
```


### `packages/editor-citations/src/BibliographyBlock.ts`

```ts
// packages/editor-citations/src/BibliographyBlock.ts
import { Node, mergeAttributes } from '@tiptap/core'
import type { CitationStyleId, Reference, PersonName } from './types'

export interface BibliographyOptions {
  getReferences?: () => Reference[]
  getCurrentStyle?: () => CitationStyleId
}

/**
 * Formatea un nombre de persona para bibliografía:
 * "Apellido, N. N."
 */
function formatPersonName(name: PersonName): string {
  if (name.family && name.given) {
    const initials = name.given
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => `${p[0]!.toUpperCase()}.`)
    .join(' ')
    return `${name.family}, ${initials}`
  }

  if (name.literal) {
    return name.literal
  }

  if (name.family) {
    return name.family
  }

  return name.given ?? 'Autor'
}

function formatAuthors(ref: Reference, style: CitationStyleId): string {
  const list = ref.author ?? []
  if (!list.length) return 'Autor desconocido'

    if (style === 'vancouver' || style === 'ieee') {
      // Estilos numéricos: "Apellido IN", "Apellido IN, Apellido IN"
      const parts = list.map((n) => {
        if (n.family && n.given) {
          const initials = n.given
          .split(/\s+/)
          .filter(Boolean)
          .map((p) => p[0]!.toUpperCase())
          .join('')
          return `${n.family} ${initials}`
        }
        if (n.literal) return n.literal
          return n.family ?? n.given ?? 'Autor'
      })

      if (parts.length <= 6) {
        return parts.join(', ')
      }
      return `${parts.slice(0, 6).join(', ')}, et al.`
    }

    // Resto: estilo tipo APA/Harvard "Apellido, N. N." con "&"/"et al."
    if (list.length === 1) {
      return formatPersonName(list[0]!)
    }

    if (list.length === 2) {
      return `${formatPersonName(list[0]!)} & ${formatPersonName(list[1]!)}`
    }

    const firstThree = list.slice(0, 3).map(formatPersonName)
    if (list.length <= 3) {
      return firstThree.join(', ')
    }
    return `${firstThree.join(', ')}, et al.`
}

function formatYear(ref: Reference): string {
  const year = ref.issued?.year
  if (typeof year === 'number') {
    return String(year)
  }
  return 's. f.'
}

/**
 * Formatea una entrada de bibliografía básica según el estilo.
 * Aquí mantenemos la lógica simple, pero corregimos la puntuación:
 * NO añadimos un punto extra después de `authors`.
 */
function formatBibliographyEntry(
  ref: Reference,
  style: CitationStyleId,
): string {
  const authors = formatAuthors(ref, style)
  const year = formatYear(ref)
  const title = ref.title ?? '[Sin título]'

  switch (style) {
    case 'mla':
      // Apellido, Nombre. Título. Año.
      // OJO: authors ya trae el punto de las iniciales, no añadimos otro.
      return `${authors} ${title}. ${year}.`

    case 'chicago':
      // Apellido, Nombre. Título. Año.
      return `${authors} ${title}. ${year}.`

    case 'vancouver':
    case 'ieee':
      // Autores. Título. Año.
      return `${authors} ${title}. ${year}.`

    case 'acs':
    case 'iso690':
    case 'turabian':
    case 'harvard':
    case 'apa':
    default:
      // Autor, N. N. (Año). Título.
      return `${authors} (${year}). ${title}.`
  }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bibliography: {
      /**
       * Inserta un bloque de bibliografía en la posición actual.
       */
      insertBibliography: (attrs?: {
        title?: string
        style?: CitationStyleId | null
      }) => ReturnType
    }
  }
}

export const Bibliography = Node.create<BibliographyOptions>({
  name: 'bibliography',

  group: 'block',
  content: '',
  defining: true,

  addOptions() {
    return {
      getReferences: () => [],
                                                             getCurrentStyle: () => 'apa' as CitationStyleId,
    }
  },

  addAttributes() {
    return {
      title: {
    default: 'Referencias',
      },
      style: {
    default: null,
      },
      /**
       * Atributo interno para poder forzar un re-render cuando
       * cambian las referencias o el estilo.
       */
      renderVersion: {
    default: 0,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-bibliography]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    // No necesitamos exponer renderVersion al HTML
    const { renderVersion, ...restAttrs } = HTMLAttributes as any

    const attrs = mergeAttributes(restAttrs, {
      'data-bibliography': 'true',
      class: 'dsr-bibliography',
    })

    const getRefs = this.options.getReferences
    const getStyle = this.options.getCurrentStyle

    const refs: Reference[] = getRefs ? getRefs() : []
    const style: CitationStyleId =
    (getStyle && getStyle()) ||
    (node.attrs.style as CitationStyleId | null) ||
    ('apa' as CitationStyleId)

    const titleText: string = node.attrs.title || 'Referencias'

const entries = refs.map((ref) => formatBibliographyEntry(ref, style))
const listItems = entries.map((entry) => ['li', {}, entry])

return [
  'section',
  attrs,
  ['div', { class: 'dsr-bibliography__title' }, titleText],
  ['ol', { class: 'dsr-bibliography__list' }, ...listItems],
]
  },

  addCommands() {
    return {
      insertBibliography:
      (attrs) =>
      ({ chain }) => {
        const title = attrs?.title ?? 'Referencias'
const style = attrs?.style ?? null

return chain()
.insertContent({
  type: this.name,
  attrs: {
    title,
    style,
  },
})
.run()
      },
    }
  },
})
```


### `packages/editor-citations/src/bibtex.ts`

```ts
// packages/editor-citations/src/bibtex.ts
import type { Reference, ReferenceType, PersonName } from './types'

function mapBibType(raw: string): ReferenceType {
  const t = raw.toLowerCase()
  if (t === 'article') return 'article-journal'
  if (t === 'inproceedings' || t === 'conference') return 'conference-paper'
  if (t === 'book') return 'book'
  if (t === 'inbook' || t === 'incollection') return 'chapter'
  if (t === 'phdthesis' || t === 'mastersthesis' || t === 'thesis') return 'thesis'
  if (t === 'techreport') return 'report'
  if (t === 'misc' || t === 'unpublished' || t === 'manual') return 'other'
  return 'other'
}

function parseAuthorsField(value?: string): PersonName[] | undefined {
  if (!value) return undefined
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (!cleaned) return undefined

  const parts = cleaned.split(/\s+and\s+/i).map((s) => s.trim()).filter(Boolean)

  return parts.map<PersonName>((p) => {
    const withComma = p.split(',').map((s) => s.trim())
    if (withComma.length === 2) {
      const [family, given] = withComma
      return { family, given }
    }

    const tokens = p.split(/\s+/)
    if (tokens.length === 1) {
      return { family: tokens[0] }
    }
    const family = tokens[tokens.length - 1]
    const given = tokens.slice(0, -1).join(' ')
    return { family, given }
  })
}

function unquote(value: string): string {
  let v = value.trim()
  if (
    (v.startsWith('{') && v.endsWith('}')) ||
    (v.startsWith('"') && v.endsWith('"'))
  ) {
    v = v.slice(1, -1)
  }
  return v.trim()
}

/**
 * Parser BibTeX muy básico para F2.3.
 * No cubre todos los edge cases de BibTeX, pero funciona para entradas típicas
 * de artículos/libros (author, title, journal, year, etc.).
 */
export function parseBibTeX(input: string): Reference[] {
  const text = input.replace(/^\s*%.*$/gm, '') // quita comentarios

  const entries: Reference[] = []
  const entryRegex = /@(\w+)\s*\{\s*([^,]+)\s*,([\s\S]*?)\}\s*(?=@|$)/g
  let match: RegExpExecArray | null

  while ((match = entryRegex.exec(text))) {
    const [, rawType, key, body] = match
    const type = mapBibType(rawType)

    const fields: Record<string, string> = {}
    const fieldRegex =
      /(\w+)\s*=\s*(\{[^}]*\}|"[^"]*"|[^,\n]+)\s*(?:,|$)/g

    let f: RegExpExecArray | null
    while ((f = fieldRegex.exec(body))) {
      const name = f[1].toLowerCase()
      const value = unquote(f[2] ?? '')
      fields[name] = value
    }

    const author = parseAuthorsField(fields['author'])
    const yearStr = fields['year']
    const yearNum = yearStr ? parseInt(yearStr, 10) : NaN

    const ref: Reference = {
      id: key.trim(),
      type,
      title: fields['title'],
      containerTitle: fields['journal'] ?? fields['booktitle'],
      author: author && author.length ? author : undefined,
      issued:
        Number.isFinite(yearNum) && !Number.isNaN(yearNum)
          ? { year: yearNum }
          : undefined,
      volume: fields['volume'],
      issue: fields['number'],
      page: fields['pages'],
      publisher: fields['publisher'],
      publisherPlace: fields['address'],
      DOI: fields['doi'],
      URL: fields['url'],
    }

    entries.push(ref)
  }

  return entries
}

function personToBib(a: PersonName): string {
  if (a.family && a.given) {
    return `${a.family}, ${a.given}`
  }
  if (a.literal) return a.literal
  if (a.family) return a.family
  if (a.given) return a.given
  return ''
}

function formatAuthorsBib(authors?: PersonName[]): string | undefined {
  if (!authors || !authors.length) return undefined
  const parts = authors
    .map(personToBib)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!parts.length) return undefined
  return parts.join(' and ')
}

function escapeBib(value?: string): string | undefined {
  if (!value) return undefined
  return value.replace(/[\n\r]/g, ' ').trim()
}

/**
 * Serializador simple de referencias a BibTeX.
 * Genera @article, @book, @inproceedings o @misc según el tipo.
 */
export function formatBibTeX(refs: Reference[]): string {
  const chunks: string[] = []

  for (const ref of refs) {
    let bibType = 'misc'
    if (ref.type === 'article-journal') bibType = 'article'
    else if (ref.type === 'book') bibType = 'book'
    else if (ref.type === 'conference-paper') bibType = 'inproceedings'
    else if (ref.type === 'chapter') bibType = 'incollection'
    else if (ref.type === 'thesis') bibType = 'phdthesis'
    else if (ref.type === 'report') bibType = 'techreport'

    const id = ref.id || 'ref'

    const fields: Record<string, string | undefined> = {}

    const authorsBib = formatAuthorsBib(ref.author)
    if (authorsBib) fields['author'] = authorsBib
    fields['title'] = escapeBib(ref.title)
    fields['journal'] = escapeBib(ref.containerTitle)
    if (ref.issued?.year != null) {
      fields['year'] = String(ref.issued.year)
    }
    fields['volume'] = escapeBib(ref.volume)
    fields['number'] = escapeBib(ref.issue)
    fields['pages'] = escapeBib(ref.page)
    fields['publisher'] = escapeBib(ref.publisher)
    fields['address'] = escapeBib(ref.publisherPlace)
    fields['doi'] = escapeBib(ref.DOI)
    fields['url'] = escapeBib(ref.URL)

    const fieldLines = Object.entries(fields)
      .filter(([, v]) => v && v.length)
      .map(([k, v]) => `  ${k} = {${v}}`)

    const entry = `@${bibType}{${id},\n${fieldLines.join(',\n')}\n}`
    chunks.push(entry)
  }

  return chunks.join('\n\n')
}
```


### `packages/editor-citations/src/CitationInline.ts`

```ts
// packages/editor-citations/src/CitationInline.ts
import { Node, mergeAttributes } from '@tiptap/core'
import type {
  CitationFormatter,
  CitationLocation,
  CitationStyleId,
  Reference,
} from './types'
import { defaultCitationFormatter } from './formatter'

export interface CitationInlineOptions {
  getReferenceById: (id: string) => Reference | null | undefined
  getCurrentStyle: () => CitationStyleId
  formatter?: CitationFormatter
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citationInline: {
      /**
       * Inserta una cita inline para una referencia existente.
       */
      insertCitationInline: (attrs: {
        refId: string
        locator?: string
        prefix?: string
        suffix?: string
      }) => ReturnType
    }
  }
}

export const CitationInline = Node.create<CitationInlineOptions>({
  name: 'citationInline',

  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,

  addOptions() {
    return {
      getReferenceById: () => null,
                                                                 getCurrentStyle: () => 'apa' as CitationStyleId,
                                                                 formatter: defaultCitationFormatter,
    }
  },

  addAttributes() {
    return {
      refId: {
        default: null,
      },
      locator: {
        default: null,
      },
      prefix: {
        default: null,
      },
      suffix: {
        default: null,
      },
      citationNumber: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-citation-inline]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = mergeAttributes(HTMLAttributes, {
      'data-citation-inline': 'true',
      class: 'dsr-citation-inline',
    })

    const refId = node.attrs.refId as string | null
    const locator = (node.attrs.locator as string | null) ?? undefined
    const prefix = (node.attrs.prefix as string | null) ?? undefined
    const suffix = (node.attrs.suffix as string | null) ?? undefined
    const citationNumber = node.attrs.citationNumber as number | null

    const ref =
    (refId && this.options.getReferenceById(refId)) || (null as Reference | null)
    const style = this.options.getCurrentStyle()
    const formatter = this.options.formatter ?? defaultCitationFormatter

    let text = '(Referencia no encontrada)'

if (ref) {
  const location: CitationLocation = {
    locator,
    prefix,
    suffix,
  }
  if (citationNumber != null) {
    ref.citationNumber = citationNumber
  }
  text = formatter.formatInText(ref, location, style)
}

return ['span', attrs, text]
  },

  addCommands() {
    return {
      insertCitationInline:
      (attrs) =>
      ({ chain }) => {
        return chain()
        .insertContent({
          type: this.name,
          attrs,
        })
        .run()
      },
    }
  },
})
```


### `packages/editor-citations/src/csl.ts`

```ts
// packages/editor-citations/src/csl.ts
import type { Reference, PersonName, DateParts } from './types'

type CslName = {
  given?: string
  family?: string
  literal?: string
}

type CslDate = {
  'date-parts'?: (number | null | undefined)[][]
}

type CslItem = {
  id?: string
  type?: string
  title?: string
  'container-title'?: string
  author?: CslName[]
  issued?: CslDate
  volume?: string
  issue?: string
  page?: string
  publisher?: string
  'publisher-place'?: string
  DOI?: string
  URL?: string
}

/**
 * Convierte referencias internas a CSL-JSON (forma estándar).
 */
export function toCslJson(refs: Reference[]): CslItem[] {
  const items: CslItem[] = []

  for (const ref of refs) {
    const issued: CslDate | undefined = ref.issued?.year
      ? {
          'date-parts': [
            [
              ref.issued.year,
              ref.issued.month ?? null,
              ref.issued.day ?? null,
            ],
          ],
        }
      : undefined

    const author: CslName[] | undefined = ref.author
      ? ref.author.map((a) => ({
          given: a.given,
          family: a.family,
          literal: a.literal,
        }))
      : undefined

    items.push({
      id: ref.id,
      type: ref.type,
      title: ref.title,
      'container-title': ref.containerTitle,
      author,
      issued,
      volume: ref.volume,
      issue: ref.issue,
      page: ref.page,
      publisher: ref.publisher,
      'publisher-place': ref.publisherPlace,
      DOI: ref.DOI,
      URL: ref.URL,
    })
  }

  return items
}

function mapCslType(raw?: string): string | undefined {
  if (!raw) return undefined
  return raw // usamos los mismos IDs que Reference.type
}

function parseCslDate(d?: CslDate): DateParts | undefined {
  if (!d || !d['date-parts'] || !d['date-parts'].length) return undefined
  const first = d['date-parts'][0] || []
  const [year, month, day] = first
  if (typeof year !== 'number') return undefined
  const result: DateParts = { year }
  if (typeof month === 'number') result.month = month
  if (typeof day === 'number') result.day = day
  return result
}

function parseCslAuthors(authors?: CslName[]): PersonName[] | undefined {
  if (!authors || !authors.length) return undefined
  const result: PersonName[] = authors.map((a) => ({
    given: a.given,
    family: a.family,
    literal: a.literal,
  }))
  return result.length ? result : undefined
}

/**
 * Convierte CSL-JSON a referencias internas.
 * No valida esquemas exhaustivamente; toma campos principales.
 */
export function fromCslJson(items: CslItem[]): Reference[] {
  const refs: Reference[] = []

  for (const item of items) {
    const id = (item.id || `ref-${Math.random().toString(36).slice(2, 10)}`).trim()

    const ref: Reference = {
      id,
      type: (mapCslType(item.type) as any) || 'article-journal',
      title: item.title,
      containerTitle: item['container-title'],
      author: parseCslAuthors(item.author),
      issued: parseCslDate(item.issued),
      volume: item.volume,
      issue: item.issue,
      page: item.page,
      publisher: item.publisher,
      publisherPlace: item['publisher-place'],
      DOI: item.DOI,
      URL: item.URL,
    }

    refs.push(ref)
  }

  return refs
}
```


### `packages/editor-citations/src/formatter.ts`

```ts
// packages/editor-citations/src/formatter.ts
import type {
  CitationFormatter,
  CitationLocation,
  CitationStyleId,
  DateParts,
  PersonName,
  Reference,
} from './types'

function primarySurname(authors?: PersonName[]): string | null {
  if (!authors || authors.length === 0) return null
    const a = authors[0]!
    if (a.family) return a.family
      if (a.literal) return a.literal
        if (a.given) return a.given
          return null
}

function formatYear(issued?: DateParts): string {
  if (!issued || issued.year == null) return 's. f.'
    return String(issued.year)
}

function initialsFromGiven(given?: string): string {
  if (!given) return ''
    const parts = given.split(/\s+/).filter(Boolean)
    return parts.map((p) => `${p[0]!.toUpperCase()}.`).join(' ')
}

function formatAuthorsAPA(authors?: PersonName[]): string {
  if (!authors || authors.length === 0) return ''

    if (authors.length === 1) {
      const a = authors[0]!
      const family = a.family ?? a.literal ?? a.given ?? ''
      const initials = initialsFromGiven(a.given)
      return initials ? `${family}, ${initials}` : family
    }

    if (authors.length === 2) {
      const [a1, a2] = authors
      const f1 = a1.family ?? a1.literal ?? a1.given ?? ''
      const f2 = a2.family ?? a2.literal ?? a2.given ?? ''
      return `${f1} & ${f2}`
    }

    const a1 = authors[0]!
    const f1 = a1.family ?? a1.literal ?? a1.given ?? ''
    return `${f1} et al.`
}

function formatAuthorsVancouver(authors?: PersonName[]): string {
  if (!authors || authors.length === 0) return ''
    const mapped = authors.slice(0, 6).map((a) => {
      const family = a.family ?? a.literal ?? a.given ?? ''
    const initials = initialsFromGiven(a.given).replace(/\./g, '')
    return initials ? `${family} ${initials}` : family
    })
    if (authors.length > 6) mapped.push('et al')
      return mapped.join(', ')
}

function formatUrlOrDoi(ref: Reference): string {
  if (ref.DOI) return `https://doi.org/${ref.DOI}`
    return ref.URL ?? ''
}

/**
 * Formateador por defecto para F2.x.
 * Cubre:
 *  - Citas en texto autor-año (APA/Harvard/Chicago-like)
 *  - Citas numéricas estilo Vancouver
 *  - Entradas de bibliografía básicas.
 */
export const defaultCitationFormatter: CitationFormatter = {
  formatInText(reference: Reference, loc: CitationLocation, style: CitationStyleId): string {
    const surname = primarySurname(reference.author) ?? 'Autor'
    const year = formatYear(reference.issued)

    if (style === 'vancouver' && reference.citationNumber != null) {
      // Estilo Vancouver numérico simple: [n] con localizador opcional.
      let text = `[${reference.citationNumber}]`
      if (loc.locator) {
        text = `${text} (${loc.locator})`
      }
      if (loc.prefix) {
        text = `${loc.prefix} ${text}`
      }
      if (loc.suffix) {
        text = `${text} ${loc.suffix}`
      }
      return text
    }

    // Estilos autor-fecha tipo APA / MLA / Chicago / etc.
    let core = `${surname}, ${year}`

    if (loc.locator) {
      // Si parece rango (141-146), usamos "pp.", si no "p."
      const pagesLabel = /[-–]/.test(loc.locator) ? 'pp.' : 'p.'
      core = `${core}, ${pagesLabel} ${loc.locator}`
    }

    let text = `(${core})`

    if (loc.prefix) {
      text = `${loc.prefix} ${text}`
    }
    if (loc.suffix) {
      text = `${text} ${loc.suffix}`
    }

    return text
  },

  formatBibliographyEntry(reference: Reference, style: CitationStyleId): string {
    const year = formatYear(reference.issued)
    const title = reference.title ?? '[Sin título]'
    const container = reference.containerTitle
    const volume = reference.volume
    const issue = reference.issue
    const pages = reference.page
    const urlOrDoi = formatUrlOrDoi(reference)

    if (style === 'vancouver') {
      const authors = formatAuthorsVancouver(reference.author)
      const parts: string[] = []

      if (authors) parts.push(authors)
        if (title) parts.push(title)

          let tail = ''
          if (container) {
            tail += container
          }
          if (year) {
            tail += tail ? `. ${year}` : year
          }
          if (volume) {
            tail += tail ? `;${volume}` : volume
          }
          if (issue) {
            tail += `(${issue})`
          }
          if (pages) {
            tail += `:${pages}`
          }
          if (tail) parts.push(tail)
            if (urlOrDoi) parts.push(urlOrDoi)

              return parts.join('. ') + '.'
    }

    // APA-like para el resto de estilos
    const authors = formatAuthorsAPA(reference.author)
    const parts: string[] = []

    if (authors) parts.push(`${authors}`)
      if (year) parts.push(`(${year}).`)
        if (title) parts.push(`${title}.`)

          if (container) {
            let journal = container
            if (volume) {
              journal += `, ${volume}`
              if (issue) {
                journal += `(${issue})`
              }
            }
            if (pages) {
              journal += `, ${pages}`
            }
            journal += '.'
            parts.push(journal)
          } else if (pages) {
            parts.push(`${pages}.`)
          }

          if (urlOrDoi) {
            parts.push(urlOrDoi)
          }

          return parts.join(' ')
  },
}
```


### `packages/editor-citations/src/index.ts`

```ts
// packages/editor-citations/src/index.ts

export { CitationInline } from './CitationInline'
export { Bibliography } from './BibliographyBlock'

export * from './types'

export { createCitationManager } from './manager'
export type { CitationManager } from './manager'

export { defaultCitationFormatter } from './formatter'

export { parseBibTeX, formatBibTeX } from './bibtex'
export { toCslJson, fromCslJson } from './csl'
```


### `packages/editor-citations/src/manager.ts`

```ts
// packages/editor-citations/src/manager.ts
import type { CitationStyleId, Reference } from './types'

export interface CitationManager {
  getStyle(): CitationStyleId
  setStyle(style: CitationStyleId): void

  addReference(input: Omit<Reference, 'id'> & { id?: string }): Reference
  updateReference(id: string, patch: Partial<Reference>): Reference | null
  getReference(id: string): Reference | null
  listReferences(): Reference[]
  removeReference(id: string): void
  clear(): void
}

/**
 * Implementación sencilla en memoria.
 * No depende de librerías externas (sin nanoid).
 */
class InMemoryCitationManager implements CitationManager {
  private style: CitationStyleId = 'apa'
    private readonly references = new Map<string, Reference>()

    getStyle(): CitationStyleId {
      return this.style
    }

    setStyle(style: CitationStyleId): void {
      this.style = style
    }

    addReference(input: Omit<Reference, 'id'> & { id?: string }): Reference {
      const trimmedId = input.id?.trim()
      const id = trimmedId && trimmedId.length > 0 ? trimmedId : this.generateId()

      // Normalizamos el objeto referencia: garantizamos id y type.
      const existing = this.references.get(id)
      const base: Reference =
      existing ??
      ({
        id,
        // fallback razonable; CSL usa "article-journal" muy a menudo
        type: (input as any).type ?? 'article-journal',
      } as Reference)

      const ref: Reference = {
        ...base,
        ...input,
        id, // aseguramos que no se sobreescriba con algo raro
      }

      this.references.set(id, ref)
      return ref
    }

    updateReference(id: string, patch: Partial<Reference>): Reference | null {
      const current = this.references.get(id)
      if (!current) return null

        const updated: Reference = {
          ...current,
          ...patch,
          id: current.id, // nunca cambiamos el id
        }

        this.references.set(id, updated)
        return updated
    }

    getReference(id: string): Reference | null {
      return this.references.get(id) ?? null
    }

    listReferences(): Reference[] {
      return Array.from(this.references.values())
    }

    removeReference(id: string): void {
      this.references.delete(id)
    }

    clear(): void {
      this.references.clear()
    }

    /**
     * Generador simple de IDs únicos "ref-xxxxx".
     * Es suficiente para uso en memoria en el editor.
     */
    private generateId(): string {
      return `ref-${Math.random().toString(36).slice(2, 10)}`
    }
}

export function createCitationManager(): CitationManager {
  return new InMemoryCitationManager()
}
```


### `packages/editor-citations/src/types.ts`

```ts
// packages/editor-citations/src/types.ts

/**
 * Estilos de cita soportados en F2.3.
 *
 * Nota: los IDs son estables y alineados con el plan maestro:
 * APA, MLA, Chicago, Harvard, Vancouver, IEEE, ACS, ISO 690, Turabian.
 */
export type CitationStyleId =
| 'apa'
| 'mla'
| 'chicago'
| 'harvard'
| 'vancouver'
| 'ieee'
| 'acs'
| 'iso690'
| 'turabian'

/**
 * Tipos de referencia básicos, compatibles con CSL/BibTeX.
 * Esto se puede extender en la misma F2.3 sin romper contratos.
 */
export type ReferenceType =
| 'article-journal'
| 'book'
| 'chapter'
| 'thesis'
| 'report'
| 'webpage'
| 'conference-paper'
| 'dataset'
| 'other'

/**
 * Representación simplificada de un nombre de persona, compatible
 * con el modelo de CSL (given/family/literal).
 */
export interface PersonName {
  given?: string
  family?: string
  literal?: string
}

/**
 * Fecha simplificada compatible con CSL: año obligatorio, mes/día opcionales.
 */
export interface DateParts {
  year?: number
  month?: number
  day?: number
}

/**
 * Modelo mínimo de referencia bibliográfica para F2.3.
 * Está pensado para mapearse 1:1 a CSL-JSON / BibTeX en la misma fase.
 */
export interface Reference {
  id: string
  type: ReferenceType

  title?: string
  containerTitle?: string // revista / libro / actas
  author?: PersonName[]
  issued?: DateParts

  volume?: string
  issue?: string
  page?: string
  edition?: string

  publisher?: string
  publisherPlace?: string

  DOI?: string
  URL?: string

  accessed?: DateParts

  // Metadatos adicionales (tags, notas internas, etc.)
  tags?: string[]
  note?: string

  /**
   * Número de cita secuencial para estilos numéricos (p. ej. Vancouver).
   */
  citationNumber?: number
}

/**
 * Atributos que acompañan a una cita concreta en el texto.
 * Ejemplo: "cf. Smith (2010, p. 23)" → prefix, locator, suffix.
 */
export interface CitationLocation {
  prefix?: string | null
  suffix?: string | null
  locator?: string | null // p. ej. "23", "pp. 23-25", "cap. 2"
  position?: 'first' | 'subsequent' | 'ibid'
}

/**
 * Atributos del nodo inline de cita en el documento.
 */
export interface CitationNodeAttrs {
  refId: string
  locator?: string | null
  prefix?: string | null
  suffix?: string | null
}

/**
 * Atributos del nodo de bibliografía (bloque).
 */
export interface BibliographyNodeAttrs {
  style: CitationStyleId
  title?: string | null
}

/**
 * Contrato interno para un formateador de citas.
 */
export interface CitationFormatter {
  formatInText(
    reference: Reference,
    loc: CitationLocation,
    style: CitationStyleId,
  ): string

  formatBibliographyEntry(
    reference: Reference,
    style: CitationStyleId,
  ): string
}
```


## Paquete `editor-core`


### `packages/editor-core/package.json`

```json
{
  "name": "@disertare/editor-core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@tiptap/core": "^3.10.2",
    "@tiptap/starter-kit": "^3.10.2"
  }
}
```


### `packages/editor-core/src/index.ts`

```ts
import { Editor, type EditorOptions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

// Registry tipado para extensiones externas
// Cada extensión puede registrar una función de inicialización (post-create)
export const extensionRegistry: Set<(editor: Editor) => void> = new Set()

/**
 * Registra una función de inicialización de extensión.
 * Se ejecutará tras la creación del editor.
 * Útil para extensiones que necesitan acceso al `editor` (ej. registrar comandos personalizados, listeners, etc.).
 */
export const registerExtension = (fn: (editor: Editor) => void): void => {
  extensionRegistry.add(fn)
}

/**
 * Crea una instancia del editor Disertare con soporte para extensiones registradas.
 *
 * @param content - Contenido inicial del editor (HTML o texto plano)
 * @param options - Opciones adicionales de TipTap (`extensions`, `editorProps`, etc.)
 * @returns Instancia de `Editor` lista para usar
 */
export const createDisertareEditor = (
  content: string = '',
  options: Partial<EditorOptions> = {}
): Editor => {
  const editor = new Editor({
    ...options,
    content,
    extensions: [...(options.extensions || []), StarterKit],
                            enableInputRules: true,
                            enablePasteRules: true,
                            autofocus: false,
                            injectCSS: true,
                            editorProps: {
                              attributes: {
                                class: 'disertare-editor-content',
                                ...(options.editorProps?.attributes || {}),
                              },
                              ...options.editorProps,
                            },
  })

  // Ejecutar todas las funciones de extensión registradas
  // Estas funciones pueden, por ejemplo, registrar comandos adicionales o plugins
  for (const registerFn of extensionRegistry) {
    registerFn(editor)
  }

  return editor
}

// Re-exportación explícita de tipos y clases para consumo externo
export type { Editor, EditorOptions }
export { Editor as TipTapEditor }
```


## Paquete `editor-ext-bio`


### `packages/editor-ext-bio/package.json`

```json
{
  "name": "@disertare/editor-ext-bio",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  }
}
```


### `packages/editor-ext-bio/src/BioExtension.ts`

```ts
// packages/editor-ext-bio/src/BioExtension.ts
import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewRenderer } from '@tiptap/core'
import { BioSequenceNodeViewRenderer } from './BioSequenceNodeView'
import type { BioSequenceAttrs, BioSequenceKind } from './types'

const DEFAULT_LABEL = 'Secuencia sin título'

export interface BioSequenceOptions {
  /**
   * Atributos HTML extra para el wrapper.
   */
  HTMLAttributes: Record<string, any>
}

/**
 * F2.8 — Nodo de dominio para secuencias biológicas.
 *
 * - Representa un bloque atómico (`atom`) para DNA/RNA/proteína.
 * - Se edita a través del panel Bio + NodeView Vue.
 * - Puede almacenar metadatos de análisis (analysis, annotations) generados
 *   en el panel Bio para evitar recalcular en el cliente.
 */
export const BioExtension = Node.create<BioSequenceOptions, BioSequenceAttrs>({
  name: 'bioSequence',

  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      id: {
        default: null,
      },
      kind: {
        default: 'dna' as BioSequenceKind,
      },
      label: {
        default: DEFAULT_LABEL,
      },
      sequence: {
        default: '',
      },
      /**
       * Resultado del análisis realizado en el panel Bio.
       * Se deja como `any` en el tipo de attrs para permitir evolución
       * sin romper documentos previos.
       */
      analysis: {
        default: null,
      },
      /**
       * Espacio para anotaciones futuras (features, regiones, etc.).
       * En F2.8 se deja como arreglo libre, pero se mantiene estructurado
       * para F2.x+ donde se pueda integrar con stats/datos.
       */
      annotations: {
        default: [],
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="bio-sequence"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'bio-sequence',
      }),
      0,
    ]
  },

  addNodeView(): NodeViewRenderer {
    return BioSequenceNodeViewRenderer
  },
})
```


### `packages/editor-ext-bio/src/BioSequenceNodeView.ts`

```ts
// packages/editor-ext-bio/src/BioSequenceNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import BioSequenceNodeView from './BioSequenceNodeView.vue'

export const BioSequenceNodeViewRenderer: NodeViewRenderer =
VueNodeViewRenderer(BioSequenceNodeView)
```


### `packages/editor-ext-bio/src/BioSequenceNodeView.vue`

```vue
<!-- packages/editor-ext-bio/src/BioSequenceNodeView.vue -->
<template>
  <NodeViewWrapper class="bio-sequence-node">
    <header class="bio-sequence-node__header">
      <div class="bio-sequence-node__title">
        <span class="bio-sequence-node__label">
          {{ label || 'Secuencia sin título' }}
        </span>
        <span class="bio-sequence-node__badge">
          {{ kindLabel }}
        </span>
      </div>
      <div class="bio-sequence-node__meta">
        <span class="bio-sequence-node__meta-item">
          {{ analysisSummary.lengthLabel }}
        </span>
        <span
          v-if="analysisSummary.gcLabel"
          class="bio-sequence-node__meta-item"
        >
          {{ analysisSummary.gcLabel }}
        </span>
        <span
          v-if="analysisSummary.orfLabel"
          class="bio-sequence-node__meta-item"
        >
          {{ analysisSummary.orfLabel }}
        </span>
      </div>
    </header>

    <section class="bio-sequence-node__body">
      <pre class="bio-sequence-node__sequence">
{{ sequenceSnippet }}
<span v-if="sequence.length > maxSnippetLength" class="bio-sequence-node__sequence-more">… ({{ sequence.length }} símbolos)</span>
      </pre>
    </section>

    <footer
      v-if="effectiveAnalysis.insights && effectiveAnalysis.insights.length"
      class="bio-sequence-node__footer"
    >
      <ul class="bio-sequence-node__insights">
        <li
          v-for="(msg, idx) in effectiveAnalysis.insights"
          :key="idx"
        >
          {{ msg }}
        </li>
      </ul>
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

type BioSequenceKind = 'dna' | 'rna' | 'protein'

interface OrfMeta {
  frame?: number
  start?: number
  end?: number
  lengthAminoacids?: number
}

interface BioAnalysisLike {
  rawLength?: number
  cleanedLength?: number
  gcPercent?: number | null
  baseCounts?: Record<string, number>
  invalidChars?: string[]
  motifs?: { motif: string; index: number }[]
  orfs?: OrfMeta[]
  complement?: string | null
  reverse?: string | null
  reverseComplement?: string | null
  insights?: string[]
}

/**
 * Accesores básicos
 */
const kind = computed<BioSequenceKind>(() => {
  const k = (props.node.attrs.kind as BioSequenceKind) ?? 'dna'
  if (k === 'dna' || k === 'rna' || k === 'protein') return k
  return 'dna'
})

const label = computed<string>(() => props.node.attrs.label ?? 'Secuencia sin título')

const sequence = computed<string>(() => String(props.node.attrs.sequence ?? ''))

const maxSnippetLength = 120

const sequenceSnippet = computed(() => {
  const seq = sequence.value
  if (seq.length <= maxSnippetLength) return seq
  return seq.slice(0, maxSnippetLength)
})

/**
 * Preferimos attrs.analysis (rellenado por useEditorBio),
 * pero si no existe hacemos un análisis mínimo como respaldo.
 */
const analysisFromAttrs = computed<BioAnalysisLike | null>(() => {
  const a = props.node.attrs.analysis
  if (a && typeof a === 'object') {
    return a as BioAnalysisLike
  }
  return null
})

function computeFallbackAnalysis(seq: string, k: BioSequenceKind): BioAnalysisLike {
  const rawLength = seq.length
  const cleaned = seq.replace(/[^A-Z]/gi, '').toUpperCase()
  const cleanedLength = cleaned.length

  let gc = 0
  if (k === 'dna' || k === 'rna') {
    for (const ch of cleaned) {
      if (ch === 'G' || ch === 'C') gc++
    }
  }

  const gcPercent =
    (k === 'dna' || k === 'rna') && cleanedLength > 0
      ? (gc / cleanedLength) * 100
      : null

  const insights: string[] = []

  if (cleanedLength === 0) {
    insights.push('La secuencia está vacía o no contiene símbolos alfabéticos.')
  } else if (gcPercent != null) {
    insights.push(`GC% aproximado: ${gcPercent.toFixed(1)}%.`)
  }

  return {
    rawLength,
    cleanedLength,
    gcPercent,
    orfs: [],
    insights,
  }
}

const effectiveAnalysis = computed<BioAnalysisLike>(() => {
  if (analysisFromAttrs.value) {
    return analysisFromAttrs.value
  }
  return computeFallbackAnalysis(sequence.value, kind.value)
})

/**
 * Resumen compacto para el encabezado del bloque.
 */
const analysisSummary = computed(() => {
  const a = effectiveAnalysis.value
  const length = a.cleanedLength ?? a.rawLength ?? sequence.value.length

  const lengthLabel = `${length} símbolo${length === 1 ? '' : 's'}`

  const gc =
    a.gcPercent != null
      ? `GC ${a.gcPercent.toFixed(1)}%`
      : null

  const orfsCount = Array.isArray(a.orfs) ? a.orfs.length : 0
  const orfLabel =
    orfsCount > 0 ? `${orfsCount} ORF${orfsCount > 1 ? 's' : ''}` : null

  return {
    lengthLabel,
    gcLabel: gc,
    orfLabel,
  }
})

const kindLabel = computed(() => {
  switch (kind.value) {
    case 'dna':
      return 'DNA'
    case 'rna':
      return 'RNA'
    case 'protein':
      return 'Proteína'
    default:
      return String(kind.value)
  }
})
</script>

<style scoped>
.bio-sequence-node {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 8px 10px;
  margin: 6px 0;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bio-sequence-node__header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bio-sequence-node__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.bio-sequence-node__label {
  font-weight: 600;
  color: #111827;
}

.bio-sequence-node__badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  white-space: nowrap;
}

.bio-sequence-node__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: #4b5563;
}

.bio-sequence-node__meta-item {
  font-variant-numeric: tabular-nums;
}

.bio-sequence-node__body {
  margin-top: 4px;
}

.bio-sequence-node__sequence {
  margin: 0;
  padding: 4px 6px;
  border-radius: 6px;
  background: #111827;
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
}

.bio-sequence-node__sequence-more {
  opacity: 0.7;
}

.bio-sequence-node__footer {
  margin-top: 4px;
}

.bio-sequence-node__insights {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
```


### `packages/editor-ext-bio/src/index.ts`

```ts
// packages/editor-ext-bio/src/index.ts
export * from './types'
export { BioExtension } from './BioExtension'
```


### `packages/editor-ext-bio/src/types.ts`

```ts
// packages/editor-ext-bio/src/types.ts

export type BioSequenceKind = 'dna' | 'rna' | 'protein'

export interface BioSequenceAnnotation {
  id: string
  label: string
  start: number
  end: number
  color?: string
}

export interface BioSequenceAttrs {
  id: string | null
  kind: BioSequenceKind
  label: string
  sequence: string
  annotations: BioSequenceAnnotation[]
}
```


## Paquete `editor-ext-cad`


### `packages/editor-ext-cad/package.json`

```json
{
  "name": "@disertare/editor-ext-cad",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  }
}
```


### `packages/editor-ext-cad/src/CadNodeView.ts`

```ts
// packages/editor-ext-cad/src/CadNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CadNodeViewComponent from './CadNodeView.vue'

export const CadNodeView: NodeViewRenderer =
VueNodeViewRenderer(CadNodeViewComponent)
```


### `packages/editor-ext-cad/src/CadNodeView.vue`

```vue
<!-- packages/editor-ext-cad/src/CadNodeView.vue -->
<template>
  <NodeViewWrapper class="cad-node">
    <div class="cad-inner" @click.stop="selectNode">
      <div class="cad-header">
        <span class="cad-chip">CAD</span>
        <span class="cad-title">{{ title }}</span>
      </div>

      <div
        class="cad-canvas-placeholder"
        :style="{ width, height }"
      >
        <div class="cad-filename">{{ fileName }}</div>
        <div class="cad-hint">
          Vista previa CAD básica (F2).
        </div>
      </div>

      <div class="cad-meta">
        <span v-if="src" class="cad-src">Origen: {{ src }}</span>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

// Placeholder i18n F4.2+
const t = (key: string) => key

const title = computed(() => props.node.attrs.title || t('editor.ext.cad.default_title'))
const fileName = computed(
  () => props.node.attrs.fileName || props.node.attrs.src || 'modelo.dxf',
)
const src = computed(() => props.node.attrs.src || '')
const width = computed(() => props.node.attrs.width || '100%')
const height = computed(() => props.node.attrs.height || '260px')

const selectNode = () => {
  props.editor.commands.setNodeSelection(props.getPos() as number)
}
</script>

<style scoped>
.cad-node {
  display: block;
  margin: 1rem 0;
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
}

.cad-inner {
  border: 1px solid #e0d6ff;
  border-radius: 6px;
  background: #faf7ff;
  padding: 8px 10px;
}

.cad-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.cad-chip {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #6a5af9;
  color: #fff;
}

.cad-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.cad-canvas-placeholder {
  border-radius: 4px;
  background: repeating-linear-gradient(
    45deg,
    #ede7ff,
    #ede7ff 6px,
    #f7f2ff 6px,
    #f7f2ff 12px
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  text-align: center;
  color: #555;
}

.cad-filename {
  font-weight: 600;
  margin-bottom: 4px;
}

.cad-hint {
  font-size: 12px;
}

.cad-meta {
  margin-top: 4px;
  font-size: 11px;
  color: #777;
}
</style>
```


### `packages/editor-ext-cad/src/index.ts`

```ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { CadNodeView } from './CadNodeView'

export interface CadOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    cad: {
      /**
       * Inserta un dibujo CAD (DXF) como imagen editable
       */
      setCad: (attrs: { dxfContent: string; fileName?: string }) => ReturnType
    }
  }
}

export const Cad = Node.create<CadOptions>({
  name: 'cad',
  group: 'block',
  content: 'text*',
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      dxfContent: {
        default: '',
        parseHTML: element => element.getAttribute('data-dxf'),
        renderHTML: attributes => {
          return { 'data-dxf': attributes.dxfContent }
        },
      },
      fileName: {
        default: 'dibujo.dxf',
        parseHTML: element => element.getAttribute('data-file-name'),
        renderHTML: attributes => {
          return { 'data-file-name': attributes.fileName }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-cad]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-cad': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setCad:
        attrs =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                dxfContent: attrs.dxfContent,
                fileName: attrs.fileName || 'dibujo.dxf',
              },
            })
            .run()
        },
    }
  },

  addNodeView() {
    return CadNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('cadDropPasteHandler'),
        props: {
          handleDOMEvents: {
            drop(view, event) {
              const files = Array.from(event.dataTransfer?.files || [])
              const dxfFile = files.find(f => f.name.toLowerCase().endsWith('.dxf'))
              if (!dxfFile) return false

              event.preventDefault()
              const reader = new FileReader()
              reader.onload = () => {
                const { schema, dispatch } = view.state
                const node = schema.nodes.cad.create({
                  dxfContent: reader.result as string,
                  fileName: dxfFile.name,
                })
                const transaction = view.state.tr.replaceSelectionWith(node)
                dispatch(transaction)
              }
              reader.readAsText(dxfFile)
              return true
            },
          },
        },
      }),
    ]
  },
})
```


## Paquete `editor-ext-chem`


### `packages/editor-ext-chem/package.json`

```json
{
  "name": "@disertare/editor-ext-chem",
  "version": "0.0.1",
  "main": "src/index.ts",
  "type": "module"
}
```


### `packages/editor-ext-chem/src/ChemExtension.ts`

```ts
// packages/editor-ext-chem/src/ChemExtension.ts
import { Node } from '@tiptap/core'
import { ChemNodeView } from './ChemNodeView'

export const ChemExtension = Node.create({
  name: 'chemStructure',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      format: { default: 'smiles' },
        value: { default: '' },

        /**
         * Atributos heredados / de compatibilidad:
         *  - layout2D: reservado para guardar coordenadas 2D en fases posteriores.
         *  - metadata: información adicional de la molécula (JSON serializable).
         */
        layout2D: { default: null },
        metadata: { default: {} },

        /**
         * Atributos añadidos en F2.7 para el NodeView:
         *  - title: texto descriptivo mostrado en el header de la tarjeta.
         *  - viewMode: '2d' | '3d' para recordar el modo de visualización.
         *  - smiles: duplicado semántico de value, para compatibilidad explícita.
         */
        title: { default: null },
        viewMode: { default: '2d' },
        smiles: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'chem-structure' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['chem-structure', HTMLAttributes]
  },

  addNodeView() {
    return ChemNodeView
  },
})
```


### `packages/editor-ext-chem/src/ChemNodeView.ts`

```ts
// packages/editor-ext-chem/src/ChemNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'

import ChemNodeViewVue from './ChemNodeView.vue'

/**
 * NodeView de química basado en Vue.
 *
 * Se conecta con ChemExtension en:
 *   addNodeView(() => ChemNodeView)
 */
export const ChemNodeView: NodeViewRenderer = VueNodeViewRenderer(
  ChemNodeViewVue,
)
```


### `packages/editor-ext-chem/src/ChemNodeView.vue`

```vue
<!-- packages/editor-ext-chem/src/ChemNodeView.vue -->
<template>
  <NodeViewWrapper
    class="dsr-chem-node"
    :class="{ 'dsr-chem-node--selected': selected }"
  >
    <div class="dsr-chem-card">
      <!-- Header: título + modo de vista -->
      <header class="dsr-chem-card__header">
        <input
          v-model="localTitle"
          class="dsr-chem-card__title-input"
          type="text"
          :placeholder="defaultTitlePlaceholder"
        />

        <div class="dsr-chem-card__view-toggle">
          <button
            type="button"
            class="dsr-chem-card__view-button"
            :class="{ 'dsr-chem-card__view-button--active': viewMode === '2d' }"
            @click="setViewMode('2d')"
          >
            2D
          </button>
          <button
            type="button"
            class="dsr-chem-card__view-button"
            :class="{ 'dsr-chem-card__view-button--active': viewMode === '3d' }"
            @click="setViewMode('3d')"
          >
            3D
          </button>
        </div>
      </header>

      <!-- Cuerpo: placeholders 2D / 3D -->
      <section class="dsr-chem-card__body">
        <!-- Área de visualización 2D -->
        <div
          v-if="viewMode === '2d'"
          ref="canvas2dRef"
          class="dsr-chem-card__canvas dsr-chem-card__canvas--2d"
        >
          <div class="dsr-chem-card__canvas-placeholder">
            <span class="dsr-chem-card__canvas-label">
              Vista 2D (SMILES: {{ displaySmiles }})
            </span>
            <small class="dsr-chem-card__canvas-helper">
              Aquí se integrará el render 2D con OpenChemLib en fases
              posteriores.
            </small>
          </div>
        </div>

        <!-- Área de visualización 3D -->
        <div
          v-else
          ref="canvas3dRef"
          class="dsr-chem-card__canvas dsr-chem-card__canvas--3d"
        >
          <div class="dsr-chem-card__canvas-placeholder">
            <span class="dsr-chem-card__canvas-label">
              Vista 3D (SMILES: {{ displaySmiles }})
            </span>
            <small class="dsr-chem-card__canvas-helper">
              Aquí se integrará el render 3D con 3Dmol u otro motor compatible.
            </small>
          </div>
        </div>
      </section>

      <!-- Footer: edición de SMILES -->
      <footer class="dsr-chem-card__footer">
        <label class="dsr-chem-card__field">
          <span class="dsr-chem-card__field-label">SMILES</span>
          <input
            v-model="localSmiles"
            class="dsr-chem-card__field-input"
            type="text"
            placeholder="Ejemplo: C1=CC=CC=C1 (benceno)"
          />
        </label>

        <div class="dsr-chem-card__actions">
          <button
            type="button"
            class="dsr-chem-card__action-button"
            @click="applyChanges"
          >
            Actualizar
          </button>
        </div>
      </footer>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

type ViewMode = '2d' | '3d'

/**
 * Atributos esperados en ChemExtension:
 *  - id: string
 *  - format: 'smiles' | ...
 *  - value: string (SMILES)
 *  - title?: string
 *  - viewMode?: '2d' | '3d'
 *  - (compat opcional) smiles?: string
 */
const initialValue =
  (props.node.attrs.value as string | undefined) ??
  (props.node.attrs.smiles as string | undefined) ??
  ''

const localSmiles = ref<string>(initialValue)
const localTitle = ref<string>(
  (props.node.attrs.title as string | undefined) || 'Estructura química',
)

const viewMode = ref<ViewMode>(
  props.node.attrs.viewMode === '3d' ? '3d' : '2d',
)

const canvas2dRef = ref<HTMLElement | null>(null)
const canvas3dRef = ref<HTMLElement | null>(null)

const defaultTitlePlaceholder = 'Estructura química'

const displaySmiles = computed(() =>
  localSmiles.value.trim() ? localSmiles.value.trim() : 'sin definir',
)

/**
 * Cambia el modo de vista (2D/3D) y actualiza attrs.
 */
function setViewMode(mode: ViewMode) {
  viewMode.value = mode
  if (props.updateAttributes) {
    props.updateAttributes({
      viewMode: mode,
    })
  }
}

/**
 * Aplica cambios locales a los atributos del nodo.
 * Guarda siempre en formato SMILES.
 */
function applyChanges() {
  const trimmed = localSmiles.value.trim()

  if (props.updateAttributes) {
    props.updateAttributes({
      format: 'smiles',
      value: trimmed,
      // compat opcional con attrs.smiles, si existiera
      smiles: trimmed || null,
      title: localTitle.value || null,
    })
  }
}

/**
 * Mantener sincronización si los atributos del nodo cambian desde fuera
 * (por ejemplo, comandos globales, deshacer/rehacer, carga de documento).
 */
watch(
  () => props.node.attrs,
  (newAttrs) => {
    const attrValue = (newAttrs.value as string | undefined) ??
      (newAttrs.smiles as string | undefined)

    if (typeof attrValue === 'string' && attrValue !== localSmiles.value) {
      localSmiles.value = attrValue
    }

    if (
      typeof newAttrs.title === 'string' &&
      newAttrs.title !== localTitle.value
    ) {
      localTitle.value = newAttrs.title
    }

    if (newAttrs.viewMode === '2d' || newAttrs.viewMode === '3d') {
      if (newAttrs.viewMode !== viewMode.value) {
        viewMode.value = newAttrs.viewMode as ViewMode
      }
    }
  },
  { deep: true },
)

onMounted(() => {
  // F2.7: solo placeholders. En fases posteriores se integrarán:
  //  - OpenChemLib (2D)
  //  - 3Dmol (3D)
  // usando canvas2dRef / canvas3dRef.
})
</script>

<style scoped>
.dsr-chem-node {
  margin: 0.5rem 0;
}

.dsr-chem-node--selected .dsr-chem-card {
  box-shadow:
    0 0 0 1px #a855f7,
    0 0 0 3px rgba(168, 85, 247, 0.25);
}

/* Card */
.dsr-chem-card {
  border-radius: 10px;
  border: 1px solid #e0d6ff;
  background: #ffffff;
  box-shadow:
    0 0 0 1px #f4f0ff,
    0 8px 20px rgba(15, 23, 42, 0.08);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

/* Header */
.dsr-chem-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dsr-chem-card__title-input {
  flex: 1;
  border-radius: 6px;
  border: 1px solid #d3cfff;
  padding: 4px 6px;
  font-size: 13px;
  font-weight: 600;
  color: #312e81;
}

/* View toggle */
.dsr-chem-card__view-toggle {
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid #d3cfff;
  overflow: hidden;
  background: #f5f3ff;
}

.dsr-chem-card__view-button {
  border: none;
  background: transparent;
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
  color: #4b3f72;
}

.dsr-chem-card__view-button--active {
  background: #4f46e5;
  color: #f9fafb;
}

/* Body / canvas */
.dsr-chem-card__body {
  border-radius: 8px;
  background: #f9fafb;
  padding: 6px;
}

.dsr-chem-card__canvas {
  min-height: 140px;
  border-radius: 8px;
  border: 1px dashed #c4b5fd;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f3ff;
}

.dsr-chem-card__canvas--3d {
  background: #eef2ff;
}

.dsr-chem-card__canvas-placeholder {
  text-align: center;
  max-width: 260px;
}

.dsr-chem-card__canvas-label {
  display: block;
  font-weight: 600;
  color: #3730a3;
  margin-bottom: 2px;
}

.dsr-chem-card__canvas-helper {
  font-size: 11px;
  color: #6b7280;
}

/* Footer */
.dsr-chem-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.dsr-chem-card__field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dsr-chem-card__field-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.dsr-chem-card__field-input {
  border-radius: 6px;
  border: 1px solid #d3cfff;
  padding: 4px 6px;
  font-size: 13px;
}

.dsr-chem-card__actions {
  display: flex;
  justify-content: flex-end;
}

.dsr-chem-card__action-button {
  border-radius: 999px;
  border: 1px solid #d3cfff;
  background: #f3ecff;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.dsr-chem-card__action-button:hover {
  background: #e6d9ff;
  border-color: #b399ff;
  box-shadow: 0 0 0 1px #d3cfff;
}
</style>
```


### `packages/editor-ext-chem/src/index.ts`

```ts
export * from './ChemExtension'
export * from './types'
```


### `packages/editor-ext-chem/src/types.ts`

```ts
// packages/editor-ext-chem/src/types.ts

/**
 * Formatos soportados para la estructura química.
 * Para F2.7 empezamos con SMILES como formato principal
 * y dejamos espacio para otros.
 */
export type ChemFormat = 'smiles' | 'mol' | 'inchi' | 'cml'

/**
 * Atributos del nodo `chemStructure` en TipTap.
 * Estos campos se serializan dentro del documento.
 */
export interface ChemNodeAttributes {
  /** ID único dentro del documento (opcional) */
  id?: string

  /** Formato principal almacenado (por ahora, típicamente 'smiles') */
  format: ChemFormat

  /** Valor en el formato principal (ej. SMILES canónico) */
  value: string

  /**
   * Layout 2D opcional (MOL/CML serializado como string) para
   * render inmediato sin recalcular coordenadas.
   */
  layout2D?: string | null

  /** Nombre o título de la molécula (Compuesto 1, benceno, etc.) */
  title?: string | null

  /** Etiquetas libres (familia, proyecto, serie, etc.) */
  tags?: string[] | null

  /** Metadatos adicionales para futuras fases (propiedades, IDs externos, etc.) */
  meta?: Record<string, unknown> | null
}
```


## Paquete `editor-ext-circuits`


### `packages/editor-ext-circuits/package.json`

```json
{
  "name": "@disertare/editor-ext-circuits",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "type": "module",
  "dependencies": {
    "@disertare/editor-core": "workspace:^",
    "@tiptap/core": "3.10.2",
    "@tiptap/vue-3": "3.10.2"
  }
}
```


### `packages/editor-ext-circuits/src/CircuitNodeView.ts`

```ts
// packages/editor-ext-circuits/src/CircuitNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'

import CircuitNodeViewVue from './CircuitNodeView.vue'

/**
 * NodeView de circuitos basado en Vue.
 *
 * Se conecta con CircuitsExtension mediante:
 *   addNodeView(() => CircuitNodeView)
 */
export const CircuitNodeView: NodeViewRenderer = VueNodeViewRenderer(
  CircuitNodeViewVue,
)
```


### `packages/editor-ext-circuits/src/CircuitNodeView.vue`

```vue
<!-- packages/editor-ext-circuits/src/CircuitNodeView.vue -->
<template>
  <NodeViewWrapper
    class="dsr-circuit-node"
    :class="{ 'dsr-circuit-node--selected': selected }"
    role="group"
    aria-label="Bloque de circuito (F2.9)"
    contenteditable="false"
  >
    <div class="dsr-circuit-card" @click.stop="selectNode">
      <!-- Header -->
      <header class="dsr-circuit-card__header">
        <div class="dsr-circuit-card__title-block">
          <span class="dsr-circuit-card__badge">CIRCUITO</span>
          <input
            v-model="localLabel"
            class="dsr-circuit-card__title-input"
            type="text"
            :placeholder="defaultLabelPlaceholder"
            @blur="syncLabel"
          />
        </div>
      </header>

      <!-- Body -->
      <section class="dsr-circuit-card__body">
        <div class="dsr-circuit-card__notation">
          <label class="dsr-circuit-card__field-label">
            Notación / descripción
          </label>
          <textarea
            v-model="localNotation"
            class="dsr-circuit-card__textarea"
            rows="3"
            placeholder="Ej.: Divisor resistivo R1‖R2, entrada Vin, salida Vout…"
            @blur="syncNotation"
          />
        </div>

        <div class="dsr-circuit-card__notes">
          <label class="dsr-circuit-card__field-label">
            Notas didácticas
          </label>
          <textarea
            v-model="localNotes"
            class="dsr-circuit-card__textarea dsr-circuit-card__textarea--notes"
            rows="3"
            placeholder="Explica aquí el objetivo del circuito, supuestos, advertencias, etc."
            @blur="syncNotes"
          />
        </div>
      </section>

      <!-- Footer (F2.9: sólo texto resumen) -->
      <footer class="dsr-circuit-card__footer">
        <p class="dsr-circuit-card__hint">
          Este bloque guarda el circuito en el documento.
          En fases posteriores se podrá vincular a simuladores o vistas IEC/ANSI avanzadas.
        </p>
      </footer>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const localLabel = ref<string>(props.node.attrs.label || '')
const localNotation = ref<string>(props.node.attrs.notation || '')
const localNotes = ref<string>(props.node.attrs.notes || '')

const defaultLabelPlaceholder = computed(
  () => 'Circuito sin título',
)

function syncLabel() {
  props.updateAttributes({ label: localLabel.value || null })
}

function syncNotation() {
  props.updateAttributes({ notation: localNotation.value })
}

function syncNotes() {
  props.updateAttributes({ notes: localNotes.value })
}

// Mantener reactivo si el documento cambia desde fuera
watch(
  () => props.node.attrs.label,
  (value) => {
    if (value !== localLabel.value) {
      localLabel.value = value || ''
    }
  },
)

watch(
  () => props.node.attrs.notation,
  (value) => {
    if (value !== localNotation.value) {
      localNotation.value = value || ''
    }
  },
)

watch(
  () => props.node.attrs.notes,
  (value) => {
    if (value !== localNotes.value) {
      localNotes.value = value || ''
    }
  },
)

function selectNode() {
  // Permite seleccionar el nodo completo al hacer clic en la tarjeta
  props.editor?.chain().setNodeSelection(props.getPos()).run()
}
</script>

<style scoped>
.dsr-circuit-node {
  margin: 0.75rem 0;
  /* Nos aseguramos de que el wrapper no tenga borde propio */
  border: none;
  outline: none;
}

.dsr-circuit-card {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 0.75rem 0.9rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dsr-circuit-node--selected .dsr-circuit-card {
  border-color: #4b3f72;
  box-shadow: 0 0 0 1px rgba(75, 63, 114, 0.35);
}

.dsr-circuit-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dsr-circuit-card__title-block {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dsr-circuit-card__badge {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: #ede9fe;
  color: #4c1d95;
}

.dsr-circuit-card__title-input {
  border: none;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  min-width: 0;
}

.dsr-circuit-card__title-input::placeholder {
  color: #9ca3af;
}

.dsr-circuit-card__title-input:focus {
  outline: none;
}

.dsr-circuit-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dsr-circuit-card__field-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.dsr-circuit-card__textarea {
  width: 100%;
  border-radius: 0.4rem;
  border: 1px solid #e5e7eb;
  padding: 0.4rem 0.5rem;
  font-size: 0.82rem;
  font-family: inherit;
  resize: vertical;
  min-height: 2.6rem;
}

.dsr-circuit-card__textarea--notes {
  min-height: 3.1rem;
}

.dsr-circuit-card__textarea:focus {
  outline: none;
  border-color: #4b3f72;
  box-shadow: 0 0 0 1px rgba(75, 63, 114, 0.22);
}

.dsr-circuit-card__footer {
  margin-top: 0.25rem;
}

.dsr-circuit-card__hint {
  font-size: 0.72rem;
  color: #6b7280;
}
</style>
```


### `packages/editor-ext-circuits/src/CircuitsExtension.ts`

```ts
// packages/editor-ext-circuits/src/CircuitsExtension.ts
import { Node } from '@tiptap/core'
import type { CircuitNodeAttributes } from './types'
import { CircuitNodeView } from './CircuitNodeView'

/**
 * Extensión de dominio F2.9 — Circuitos.
 *
 * Define un nodo de bloque genérico `circuitDiagram` que representa
 * un circuito IEC/ANSI a nivel de documento, sin imponer todavía
 * ningún motor de simulación.
 */
export const CircuitsExtension = Node.create({
  name: 'circuitDiagram',

  group: 'block',

  atom: true,

  addAttributes() {
    const defaults: CircuitNodeAttributes = {
      id: undefined,
      label: 'Circuito sin título',
      notation: '',
      notes: '',
    }

    return {
      id: {
        default: defaults.id,
      },
      label: {
        default: defaults.label,
      },
      notation: {
        default: defaults.notation,
      },
      notes: {
        default: defaults.notes,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'circuit-diagram' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['circuit-diagram', HTMLAttributes]
  },

  addNodeView() {
    return CircuitNodeView
  },
})
```


### `packages/editor-ext-circuits/src/index.ts`

```ts
// packages/editor-ext-circuits/src/index.ts
export * from './CircuitsExtension'
export * from './types'
```


### `packages/editor-ext-circuits/src/types.ts`

```ts
// packages/editor-ext-circuits/src/types.ts

/**
 * Atributos del nodo `circuitDiagram` en TipTap.
 * F2.9 define un bloque genérico de circuito IEC/ANSI
 * sin acoplar todavía un motor de simulación.
 */
export interface CircuitNodeAttributes {
  /** ID único dentro del documento (opcional pero recomendado) */
  id?: string

  /**
   * Etiqueta visible en el documento.
   * Ej.: "Divisor de tensión", "Puente de Wheatstone".
   */
  label?: string | null

  /**
   * Notación o descripción del circuito.
   *
   * En F2.9 se trata simplemente de texto libre que podría
   * contener:
   *  - nombre de topología,
   *  - pseudocódigo / netlist,
   *  - o una descripción natural del circuito.
   *
   * En fases posteriores (F3/F4) puede reinterpretarse como
   * DSL estructurada sin romper compatibilidad.
   */
  notation?: string

  /**
   * Notas didácticas o contexto adicional para el lector.
   */
  notes?: string
}
```


## Paquete `editor-ext-diagrams-adv`


### `packages/editor-ext-diagrams-adv/package.json`

```json
{
  "name": "@disertare/editor-ext-diagrams-adv",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "type": "module",
  "dependencies": {
    "@disertare/editor-core": "workspace:^",
    "@tiptap/core": "3.10.2",
    "@tiptap/vue-3": "3.10.2"
  }
}
```


### `packages/editor-ext-diagrams-adv/src/DiagramAdvNodeView.ts`

```ts
// packages/editor-ext-diagrams-adv/src/DiagramAdvNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import DiagramAdvNodeView from './DiagramAdvNodeView.vue'

/**
 * NodeView renderer principal para el nodo "diagram-adv-node".
 * Envuelve el componente Vue `DiagramAdvNodeView.vue` dentro de
 * la integración de TipTap.
 */
export const DiagramAdvNodeViewRenderer: NodeViewRenderer =
VueNodeViewRenderer(DiagramAdvNodeView)
```


### `packages/editor-ext-diagrams-adv/src/DiagramAdvNodeView.vue`

```vue
<!-- packages/editor-ext-diagrams-adv/src/DiagramAdvNodeView.vue -->
<template>
  <NodeViewWrapper class="diagram-adv-node">
    <header class="diagram-adv-node__header">
      <div class="diagram-adv-node__title-block">
        <span class="diagram-adv-node__title">
          {{ effectiveTitle }}
        </span>

        <span class="diagram-adv-node__badge">
          {{ kindLabel }}
        </span>
      </div>

      <p v-if="description" class="diagram-adv-node__description">
        {{ description }}
      </p>
    </header>

    <section class="diagram-adv-node__body">
      <!-- AQUÍ es donde cambiamos realmente de tipo de diagrama -->
      <component
        :is="currentBodyComponent"
        :node="node"
        :update-attributes="updateAttributes"
      />
    </section>

    <footer class="diagram-adv-node__footer">
      <small class="diagram-adv-node__hint">
        {{ footerHint }}
      </small>
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

import IshikawaNodeView from './IshikawaNodeView.vue'
import VennEulerNodeView from './VennEulerNodeView.vue'
import RiskMatrixNodeView from './RiskMatrixNodeView.vue'
import ProcessMapNodeView from './ProcessMapNodeView.vue'
import SystemsModelNodeView from './SystemsModelNodeView.vue'
import type { DiagramKind } from './types'

const props = defineProps(nodeViewProps)

const kind = computed<DiagramKind>(() => props.node.attrs.kind ?? 'ishikawa')
const title = computed(() => props.node.attrs.title as string | null)
const description = computed(() => props.node.attrs.description as string | null)

const effectiveTitle = computed(() => title.value || 'Diagrama avanzado')

const kindLabel = computed(() => {
  switch (kind.value) {
    case 'ishikawa':
      return 'Diagrama de Ishikawa'
    case 'venn':
      return 'Diagrama de Venn/Euler'
    case 'riskMatrix':
      return 'Matriz de riesgo'
    case 'processMap':
      return 'Mapa de procesos'
    case 'systemsModel':
      return 'Modelo / análisis de sistemas'
    default:
      return 'Diagrama avanzado'
  }
})

const footerHint = computed(() => {
  switch (kind.value) {
    case 'ishikawa':
      return 'Las ramas y categorías se pueden personalizar editando este bloque dentro de F2.11.'
    case 'venn':
      return 'Los conjuntos y sus intersecciones se definen y etiquetan en este bloque.'
    case 'riskMatrix':
      return 'Probabilidad × impacto. Los niveles de riesgo se configuran desde la plantilla seleccionada.'
    case 'processMap':
      return 'Mapa de procesos básico. Los pasos y decisiones pueden refinarse en el documento.'
    case 'systemsModel':
      return 'Modelo causal / análisis de sistemas. Variables y relaciones se ajustan desde este bloque.'
    default:
      return ''
  }
})

const currentBodyComponent = computed(() => {
  switch (kind.value) {
    case 'ishikawa':
      return IshikawaNodeView
    case 'venn':
      return VennEulerNodeView
    case 'riskMatrix':
      return RiskMatrixNodeView
    case 'processMap':
      return ProcessMapNodeView
    case 'systemsModel':
      return SystemsModelNodeView
    default:
      return IshikawaNodeView
  }
})
</script>

<style scoped>
.diagram-adv-node {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 12px 14px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
}

.diagram-adv-node__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.diagram-adv-node__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.diagram-adv-node__title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.diagram-adv-node__badge {
  align-self: flex-start;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
}

.diagram-adv-node__description {
  margin: 0;
  margin-left: 12px;
  font-size: 11px;
  color: #4b5563;
}

.diagram-adv-node__body {
  margin-top: 8px;
  font-size: 11px;
  color: #111827;
}

.diagram-adv-node__footer {
  margin-top: 8px;
}

.diagram-adv-node__hint {
  font-size: 10px;
  color: #6b7280;
}
</style>
```


### `packages/editor-ext-diagrams-adv/src/DiagramsAdvExtension.ts`

```ts
// packages/editor-ext-diagrams-adv/src/DiagramsAdvExtension.ts
import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewRenderer } from '@tiptap/core'
import { DiagramAdvNodeViewRenderer } from './DiagramAdvNodeView'
import type { DiagramAdvAttrs, DiagramAdvOptions, DiagramKind } from './types'

const DEFAULT_TITLE = 'Diagrama avanzado'

/**
 * F2.11 — Nodo de dominio para diagramas avanzados.
 *
 * - Nodo único `diagramAdv` con atributo `kind`.
 * - El NodeView delega la representación en sub-vistas según `kind`.
 */
export const DiagramsAdvExtension = Node.create<
DiagramAdvOptions,
DiagramAdvAttrs
>({
  name: 'diagramAdv',

  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      id: {
        default: null,
      },
      kind: {
        default: 'ishikawa' as DiagramKind,
      },
      title: {
        default: null,
      },
      description: {
        default: null,
      },
      datasetRef: {
        default: null,
      },
      config: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="diagram-adv"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'diagram-adv',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      /**
       * Inserta un diagrama avanzado con los atributos proporcionados.
       * Se usa desde el panel `EditorDiagramsPanel` y otros flujos.
       */
      insertDiagramAdv:
      (attrs: Partial<DiagramAdvAttrs>) =>
      ({ chain }) => {
        const kind: DiagramKind = (attrs.kind ?? 'ishikawa') as DiagramKind

        return chain()
        .focus()
        .insertContent({
          type: this.name,
          attrs: {
            id:
            attrs.id ??
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? (crypto as any).randomUUID()
            : `diagram-${Math.random().toString(36).slice(2)}`),
                       kind,
                       title: attrs.title ?? DEFAULT_TITLE,
                       description: attrs.description ?? null,
                       datasetRef: attrs.datasetRef ?? null,
                       config: attrs.config ?? null,
          },
        })
        .run()
      },
    }
  },

  addNodeView(): NodeViewRenderer {
    return DiagramAdvNodeViewRenderer
  },
})
```


### `packages/editor-ext-diagrams-adv/src/index.ts`

```ts
// packages/editor-ext-diagrams-adv/src/index.ts
export { DiagramsAdvExtension } from './DiagramsAdvExtension'
export * from './types'
export * from './templates'
```


### `packages/editor-ext-diagrams-adv/src/IshikawaNodeView.vue`

```vue
<!-- packages/editor-ext-diagrams-adv/src/IshikawaNodeView.vue -->
<template>
  <NodeViewWrapper class="diagram-ishikawa">
    <!-- Encabezado: título + descripción/efecto principal -->
    <header class="diagram-ishikawa__header">
      <input
        class="diagram-ishikawa__title"
        type="text"
        :value="title"
        placeholder="Diagrama de Ishikawa"
        @input="onTitleInput(($event.target as HTMLInputElement).value)"
      />

      <input
        class="diagram-ishikawa__description"
        type="text"
        :value="description"
        placeholder="Descripción / contexto (opcional)"
        @input="onDescriptionInput(($event.target as HTMLInputElement).value)"
      />
    </header>

    <!-- Cuerpo del diagrama: espina horizontal + ramas en ambos lados -->
    <div class="diagram-ishikawa__body">
      <!-- Lado izquierdo -->
      <div class="diagram-ishikawa__side diagram-ishikawa__side--left">
        <div
          v-for="(cat, index) in leftCategories"
          :key="cat.key"
          class="diagram-ishikawa__branch diagram-ishikawa__branch--left"
        >
          <!-- “Hueso” diagonal hacia la espina -->
          <div class="diagram-ishikawa__branch-bone" />

          <div class="diagram-ishikawa__branch-content">
            <div class="diagram-ishikawa__branch-label">
              <input
                type="text"
                :value="cat.label"
                placeholder="Categoría"
                @input="
                  onCategoryLabelInput(
                    index,
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>

            <ul class="diagram-ishikawa__causes">
              <li
                v-for="(cause, causeIndex) in cat.items"
                :key="`${cat.key}-${causeIndex}`"
              >
                <input
                  type="text"
                  :value="cause"
                  placeholder="Causa..."
                  @input="
                    onCauseInput(
                      index,
                      causeIndex,
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
              </li>
            </ul>

            <button
              type="button"
              class="diagram-ishikawa__add-cause"
              @click="addCause(index)"
            >
              +
            </button>
          </div>
        </div>

        <!-- Añadir rama en el lado izquierdo -->
        <button
          type="button"
          class="diagram-ishikawa__add-branch diagram-ishikawa__add-branch--left"
          @click="addCategoryLeft"
        >
          + Añadir rama izquierda
        </button>
      </div>

      <!-- Espina central + efecto -->
      <div class="diagram-ishikawa__center">
        <!-- Espina horizontal -->
        <div class="diagram-ishikawa__spine">
          <div class="diagram-ishikawa__spine-line" />
          <div class="diagram-ishikawa__spine-arrow" />
        </div>

        <!-- Efecto / problema principal -->
        <div class="diagram-ishikawa__effect-box">
          <textarea
            :value="effect"
            class="diagram-ishikawa__effect-input"
            placeholder="Efecto / problema principal"
            @input="
              onEffectInput(($event.target as HTMLTextAreaElement).value)
            "
          />
        </div>
      </div>

      <!-- Lado derecho -->
      <div class="diagram-ishikawa__side diagram-ishikawa__side--right">
        <div
          v-for="(cat, index) in rightCategories"
          :key="cat.key"
          class="diagram-ishikawa__branch diagram-ishikawa__branch--right"
        >
          <!-- “Hueso” diagonal hacia la espina -->
          <div class="diagram-ishikawa__branch-bone" />

          <div class="diagram-ishikawa__branch-content">
            <div class="diagram-ishikawa__branch-label">
              <input
                type="text"
                :value="cat.label"
                placeholder="Categoría"
                @input="
                  onCategoryLabelInput(
                    index + leftCategories.length,
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>

            <ul class="diagram-ishikawa__causes">
              <li
                v-for="(cause, causeIndex) in cat.items"
                :key="`${cat.key}-${causeIndex}`"
              >
                <input
                  type="text"
                  :value="cause"
                  placeholder="Causa..."
                  @input="
                    onCauseInput(
                      index + leftCategories.length,
                      causeIndex,
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
              </li>
            </ul>

            <button
              type="button"
              class="diagram-ishikawa__add-cause"
              @click="addCause(index + leftCategories.length)"
            >
              +
            </button>
          </div>
        </div>

        <!-- Añadir rama en el lado derecho -->
        <button
          type="button"
          class="diagram-ishikawa__add-branch diagram-ishikawa__add-branch--right"
          @click="addCategoryRight"
        >
          + Añadir rama derecha
        </button>
      </div>
    </div>

    <footer class="diagram-ishikawa__footer">
      Vista editable de Diagrama de Ishikawa (causa–efecto).
      Puedes añadir o quitar ramas en ambos lados, cambiar sus títulos y detallar
      las causas. El esquema 6M se usa como punto de partida, pero el usuario
      define la estructura final según sus necesidades.
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

type IshikawaCategory = {
  key: string
  label: string
  items: string[]
}

/**
 * Plantilla base 6M:
 * Método, Mano de obra, Maquinaria, Medición, Medio ambiente, Materiales.
 * Es el punto de partida, pero el usuario puede modificar etiquetas,
 * número de causas e incluso el número de ramas (añadir/eliminar).
 */
const DEFAULT_CATEGORIES: IshikawaCategory[] = [
  {
    key: 'metodo',
    label: 'Método',
    items: [''],
  },
  {
    key: 'mano-obra',
    label: 'Mano de obra',
    items: [''],
  },
  {
    key: 'maquinaria',
    label: 'Maquinaria',
    items: [''],
  },
  {
    key: 'medicion',
    label: 'Medición',
    items: [''],
  },
  {
    key: 'medio-ambiente',
    label: 'Medio ambiente',
    items: [''],
  },
  {
    key: 'materiales',
    label: 'Materiales',
    items: [''],
  },
]

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
}>()

const title = computed(
  () => props.node.attrs.title ?? 'Diagrama de Ishikawa',
)

const description = computed(
  () => props.node.attrs.description ?? '',
)

const effect = computed(
  () => props.node.attrs.effect ?? 'Efecto / problema principal',
)

/**
 * Categorías actuales:
 * - Si no hay nada en attrs.categories, usamos DEFAULT_CATEGORIES (6M).
 * - Si el usuario ya modificó/añadió/eliminó, respetamos lo que hay.
 */
const categories = computed<IshikawaCategory[]>(() => {
  const raw = props.node.attrs.categories as IshikawaCategory[] | undefined

  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_CATEGORIES
  }

  return raw.map((cat, index) => ({
    key: cat?.key ?? `cat-${index}`,
    label: cat?.label ?? `Categoría ${index + 1}`,
    items:
      Array.isArray(cat?.items) && cat.items.length > 0
        ? [...cat.items]
        : [''],
  }))
})

/**
 * División dinámica izquierda/derecha:
 * - Tomamos la mitad (redondeo hacia arriba) para el lado izquierdo.
 * - El resto para el lado derecho.
 * Permite que el número de ramas crezca o disminuya.
 */
const leftCategories = computed(() => {
  const all = categories.value
  const mid = Math.ceil(all.length / 2)
  return all.slice(0, mid)
})

const rightCategories = computed(() => {
  const all = categories.value
  const mid = Math.ceil(all.length / 2)
  return all.slice(mid)
})

function commitCategories(next: IshikawaCategory[]) {
  props.updateAttributes({
    categories: next,
  })
}

function onTitleInput(value: string) {
  props.updateAttributes({ title: value })
}

function onDescriptionInput(value: string) {
  props.updateAttributes({ description: value })
}

function onEffectInput(value: string) {
  props.updateAttributes({ effect: value })
}

function onCategoryLabelInput(index: number, value: string) {
  const current = categories.value
  const next = [...current]
  if (!next[index]) return

  next[index] = {
    ...next[index],
    label: value,
  }

  commitCategories(next)
}

function onCauseInput(index: number, causeIndex: number, value: string) {
  const current = categories.value
  const next = [...current]
  const cat = next[index]
  if (!cat) return

  const items = [...cat.items]
  items[causeIndex] = value

  next[index] = {
    ...cat,
    items,
  }

  commitCategories(next)
}

function addCause(index: number) {
  const current = categories.value
  const next = [...current]
  const cat = next[index]
  if (!cat) return

  next[index] = {
    ...cat,
    items: [...cat.items, ''],
  }

  commitCategories(next)
}

/**
 * Añadir una nueva rama en el lado izquierdo:
 * - Insertamos cerca del inicio de la lista para que se reparta visualmente.
 */
function addCategoryLeft() {
  const current = categories.value
  const next: IshikawaCategory[] = [...current]

  const newIndex = 0
  const newCat: IshikawaCategory = {
    key: `cat-left-${Date.now()}`,
    label: 'Nueva rama izquierda',
    items: [''],
  }

  next.splice(newIndex, 0, newCat)
  commitCategories(next)
}

/**
 * Añadir una nueva rama en el lado derecho:
 * - Añadimos al final de la lista para que quede en el lado derecho.
 */
function addCategoryRight() {
  const current = categories.value
  const next: IshikawaCategory[] = [...current]

  const newCat: IshikawaCategory = {
    key: `cat-right-${Date.now()}`,
    label: 'Nueva rama derecha',
    items: [''],
  }

  next.push(newCat)
  commitCategories(next)
}
</script>

<style scoped>
.diagram-ishikawa {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 10px 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  font-size: 12px;
  color: #111827;
}

/* Header */

.diagram-ishikawa__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.diagram-ishikawa__title {
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
}

.diagram-ishikawa__description {
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  padding: 4px 8px;
  font-size: 12px;
}

/* Cuerpo / esqueleto de pescado */

.diagram-ishikawa__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

/* Espina central */

.diagram-ishikawa__center {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.diagram-ishikawa__spine {
  position: relative;
  height: 2px;
  background: transparent;
  margin-bottom: 4px;
}

.diagram-ishikawa__spine-line {
  position: absolute;
  left: 0;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  height: 2px;
  background: #4b5563;
}

.diagram-ishikawa__spine-arrow {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid #4b5563;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}

/* Efecto principal */

.diagram-ishikawa__effect-box {
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  min-width: 160px;
  text-align: center;
  background: #f9fafb;
}

.diagram-ishikawa__effect-input {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  text-align: center;
  font-size: 12px;
  line-height: 1.3;
}

/* Lados / ramas */

.diagram-ishikawa__side {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Rama: “hueso” diagonal + contenido */

.diagram-ishikawa__branch {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Línea diagonal (hueso) */
.diagram-ishikawa__branch-bone {
  width: 36px;
  height: 2px;
  background: #6b7280;
  transform-origin: center;
}

.diagram-ishikawa__branch--left .diagram-ishikawa__branch-bone {
  transform: rotate(-30deg);
}

.diagram-ishikawa__branch--right .diagram-ishikawa__branch-bone {
  transform: rotate(30deg);
}

.diagram-ishikawa__branch-content {
  flex: 1;
}

/* Etiqueta de la rama */

.diagram-ishikawa__branch-label input {
  width: 100%;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  background: #f9fafb;
}

/* Causas */

.diagram-ishikawa__causes {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.diagram-ishikawa__causes input {
  width: 100%;
  border-radius: 4px;
  border: 1px dashed #e5e7eb;
  padding: 2px 6px;
  font-size: 11px;
}

/* Botón + causa */

.diagram-ishikawa__add-cause {
  margin-top: 2px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 11px;
  width: 18px;
  height: 18px;
  line-height: 1;
  cursor: pointer;
}

/* Botones de añadir ramas */

.diagram-ishikawa__add-branch {
  margin-top: 4px;
  border-radius: 999px;
  border: 1px dashed #d1d5db;
  background: #fdfbff;
  font-size: 11px;
  padding: 3px 8px;
  cursor: pointer;
  color: #4b3f72;
}

.diagram-ishikawa__add-branch:hover {
  background: #f3ecff;
  border-color: #c1b6ff;
}

/* Footer */

.diagram-ishikawa__footer {
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
}
</style>
```


### `packages/editor-ext-diagrams-adv/src/locales/en.json`

```json
{
  "diagramsAdv": {
    "panel": {
      "title": "Advanced diagrams",
      "subtitle": "Insert Ishikawa, Venn/Euler, risk matrix, process maps and systems models."
    },
    "kind": {
      "ishikawa": "Ishikawa diagram (cause–effect)",
      "venn": "Venn/Euler diagram",
      "riskMatrix": "Risk matrix",
      "processMap": "Process map",
      "systemsModel": "Systems model / analysis"
    }
  }
}
```


### `packages/editor-ext-diagrams-adv/src/locales/es.json`

```json
{
  "diagramsAdv": {
    "panel": {
      "title": "Diagramas avanzados",
      "subtitle": "Inserta diagramas de Ishikawa, Venn/Euler, matrices de riesgo, mapas de procesos y modelos de sistemas."
    },
    "kind": {
      "ishikawa": "Diagrama de Ishikawa (causa–efecto)",
      "venn": "Diagrama de Venn/Euler",
      "riskMatrix": "Matriz de riesgo",
      "processMap": "Mapa de procesos",
      "systemsModel": "Modelo / análisis de sistemas"
    }
  }
}
```


### `packages/editor-ext-diagrams-adv/src/ProcessMapNodeView.vue`

```vue
<!-- packages/editor-ext-diagrams-adv/src/ProcessMapNodeView.vue -->
<template>
  <NodeViewWrapper class="process-map">
    <header class="process-map__header">
      <input
        class="process-map__title"
        type="text"
        :value="title"
        placeholder="Mapa de procesos"
        @input="onTitleInput(($event.target as HTMLInputElement).value)"
      />

      <input
        class="process-map__description"
        type="text"
        :value="description"
        placeholder="Proceso / alcance (opcional)"
        @input="onDescriptionInput(($event.target as HTMLInputElement).value)"
      />
    </header>

    <section class="process-map__canvas">
      <div class="process-map__flow">
        <template
          v-for="(step, index) in steps"
          :key="step.id"
        >
          <div
            class="process-map__step"
            :class="`process-map__step--${step.type}`"
          >
            <div class="process-map__step-label">
              {{ step.label || defaultLabelForType(step.type, index) }}
            </div>
          </div>

          <div
            v-if="index < steps.length - 1"
            class="process-map__arrow"
          >
            <span>➜</span>
          </div>
        </template>
      </div>
    </section>

    <section class="process-map__editor">
      <h3 class="process-map__section-title">
        Pasos del proceso
      </h3>

      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="process-map__step-row"
      >
        <div class="process-map__step-row-main">
          <select
            class="process-map__select"
            :value="step.type"
            @change="
              onStepTypeChange(
                index,
                ($event.target as HTMLSelectElement).value as any,
              )
            "
          >
            <option value="start">Inicio / entrada</option>
            <option value="process">Actividad / tarea</option>
            <option value="decision">Decisión</option>
            <option value="end">Fin / salida</option>
          </select>

          <input
            class="process-map__input"
            type="text"
            :value="step.label"
            :placeholder="defaultLabelForType(step.type, index)"
            @input="
              onStepLabelInput(
                index,
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>

        <button
          type="button"
          class="process-map__remove"
          @click="removeStep(index)"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        class="process-map__add-step"
        @click="addStep"
      >
        + Añadir paso
      </button>
    </section>

    <footer class="process-map__footer">
      Mapa de procesos simplificado (BPMN-lite). Ajusta el tipo de cada paso
      (inicio, actividad, decisión, fin) y sus etiquetas para documentar el flujo.
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

type StepType = 'start' | 'process' | 'decision' | 'end'

type ProcessStep = {
  id: string
  type: StepType
  label: string
}

const DEFAULT_STEPS: ProcessStep[] = [
  { id: 's-1', type: 'start', label: 'Inicio' },
  { id: 's-2', type: 'process', label: 'Actividad principal' },
  { id: 's-3', type: 'end', label: 'Fin' },
]

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
}>()

const title = computed(
  () => props.node.attrs.title ?? 'Mapa de procesos',
)

const description = computed(
  () => props.node.attrs.description ?? '',
)

const steps = computed<ProcessStep[]>(() => {
  const raw = props.node.attrs.steps as ProcessStep[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_STEPS
  }

  return raw.map((s, index) => ({
    id: s?.id ?? `step-${index}`,
    type: (s?.type as StepType) || 'process',
    label: s?.label ?? '',
  }))
})

function commitSteps(next: ProcessStep[]) {
  props.updateAttributes({
    steps: next,
  })
}

function onTitleInput(value: string) {
  props.updateAttributes({ title: value })
}

function onDescriptionInput(value: string) {
  props.updateAttributes({ description: value })
}

function defaultLabelForType(type: StepType, index: number): string {
  switch (type) {
    case 'start':
      return 'Inicio'
    case 'process':
      return `Actividad ${index + 1}`
    case 'decision':
      return 'Decisión'
    case 'end':
      return 'Fin'
    default:
      return `Paso ${index + 1}`
  }
}

function addStep() {
  const current = steps.value
  const next: ProcessStep[] = [
    ...current,
    {
      id: `step-${Date.now()}`,
      type: 'process',
      label: '',
    },
  ]
  commitSteps(next)
}

function removeStep(index: number) {
  const current = steps.value
  if (current.length <= 1) return
  const next = [...current]
  next.splice(index, 1)
  commitSteps(next)
}

function onStepTypeChange(index: number, type: StepType) {
  const current = steps.value
  const next = [...current]
  if (!next[index]) return
  next[index] = {
    ...next[index],
    type,
  }
  commitSteps(next)
}

function onStepLabelInput(index: number, value: string) {
  const current = steps.value
  const next = [...current]
  if (!next[index]) return
  next[index] = {
    ...next[index],
    label: value,
  }
  commitSteps(next)
}
</script>

<style scoped>
.process-map {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 10px 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  font-size: 12px;
  color: #111827;
}

.process-map__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.process-map__title {
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
}

.process-map__description {
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  padding: 4px 8px;
  font-size: 12px;
}

/* Canvas */

.process-map__canvas {
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
  background: #f9fafb;
  padding: 8px;
  margin-bottom: 8px;
  overflow-x: auto;
}

.process-map__flow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Steps */

.process-map__step {
  min-width: 70px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  font-size: 11px;
  text-align: center;
}

.process-map__step--start {
  border-radius: 999px;
  border-color: #22c55e;
  background: #ecfdf3;
}

.process-map__step--end {
  border-radius: 999px;
  border-color: #ef4444;
  background: #fef2f2;
}

.process-map__step--decision {
  border-style: dashed;
  border-color: #f97316;
  background: #fff7ed;
}

.process-map__step--process {
  border-color: #60a5fa;
  background: #eff6ff;
}

.process-map__step-label {
  white-space: nowrap;
}

/* Arrow */

.process-map__arrow {
  font-size: 14px;
  color: #4b5563;
}

/* Editor de pasos */

.process-map__editor {
  margin-bottom: 4px;
}

.process-map__section-title {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

.process-map__step-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.process-map__step-row-main {
  display: flex;
  flex: 1;
  gap: 4px;
}

.process-map__select {
  flex: 0 0 140px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

.process-map__input {
  flex: 1;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

.process-map__remove {
  border-radius: 999px;
  border: 1px solid #fee2e2;
  background: #fef2f2;
  color: #b91c1c;
  width: 20px;
  height: 20px;
  font-size: 11px;
  cursor: pointer;
}

.process-map__add-step {
  margin-top: 4px;
  border-radius: 999px;
  border: 1px dashed #d1d5db;
  background: #fdfbff;
  font-size: 11px;
  padding: 3px 8px;
  cursor: pointer;
  color: #4b3f72;
}

.process-map__add-step:hover {
  background: #f3ecff;
  border-color: #c1b6ff;
}

/* Footer */

.process-map__footer {
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
}
</style>
```


### `packages/editor-ext-diagrams-adv/src/RiskMatrixNodeView.vue`

```vue
<!-- packages/editor-ext-diagrams-adv/src/RiskMatrixNodeView.vue -->
<template>
  <NodeViewWrapper class="risk-matrix">
    <header class="risk-matrix__header">
      <input
        class="risk-matrix__title"
        type="text"
        :value="title"
        placeholder="Matriz de riesgo"
        @input="onTitleInput(($event.target as HTMLInputElement).value)"
      />

      <input
        class="risk-matrix__description"
        type="text"
        :value="description"
        placeholder="Proyecto / proceso / contexto (opcional)"
        @input="onDescriptionInput(($event.target as HTMLInputElement).value)"
      />
    </header>

    <section class="risk-matrix__axes">
      <div class="risk-matrix__axis-group">
        <h3>Probabilidad (eje Y)</h3>
        <div
          v-for="(level, index) in probLevels"
          :key="`p-${index}`"
          class="risk-matrix__axis-field"
        >
          <span>{{ probLevels.length - index }}</span>
          <input
            type="text"
            :value="level"
            placeholder="Nivel"
            @input="
              onProbLevelInput(
                index,
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>
      </div>

      <div class="risk-matrix__axis-group">
        <h3>Impacto (eje X)</h3>
        <div
          v-for="(level, index) in impactLevels"
          :key="`i-${index}`"
          class="risk-matrix__axis-field risk-matrix__axis-field--horizontal"
        >
          <span>{{ index + 1 }}</span>
          <input
            type="text"
            :value="level"
            placeholder="Nivel"
            @input="
              onImpactLevelInput(
                index,
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>
      </div>
    </section>

    <section class="risk-matrix__grid-wrapper">
      <div class="risk-matrix__grid">
        <!-- Encabezado horizontal (impacto) -->
        <div class="risk-matrix__grid-cell risk-matrix__grid-cell--corner" />
        <div
          v-for="(impact, iIndex) in impactLevels"
          :key="`head-x-${iIndex}`"
          class="risk-matrix__grid-cell risk-matrix__grid-cell--header"
        >
          {{ iIndex + 1 }}
        </div>

        <!-- Filas (probabilidad) + celdas -->
        <template
          v-for="(prob, pIndex) in probLevels"
          :key="`row-${pIndex}`"
        >
          <div class="risk-matrix__grid-cell risk-matrix__grid-cell--header">
            {{ probLevels.length - pIndex }}
          </div>

          <button
            v-for="(impact, iIndex) in impactLevels"
            :key="`cell-${pIndex}-${iIndex}`"
            type="button"
            class="risk-matrix__grid-cell risk-matrix__grid-cell--data"
            :class="{
              'risk-matrix__grid-cell--selected':
                selectedCell &&
                selectedCell.row === pIndex &&
                selectedCell.col === iIndex,
            }"
            @click="onCellClick(pIndex, iIndex)"
          >
            {{ riskLevelLabel(pIndex, iIndex) }}
          </button>
        </template>
      </div>
    </section>

    <section class="risk-matrix__summary">
      <label class="risk-matrix__field">
        <span>Riesgo principal (descripción)</span>
        <input
          type="text"
          :value="mainRiskDescription"
          placeholder="Ej. Retraso en la entrega por falta de recursos..."
          @input="
            onMainRiskDescriptionInput(
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </label>

      <p class="risk-matrix__hint">
        Celda seleccionada:
        <strong v-if="selectedCell">
          Prob. {{ probLabelByIndex(selectedCell.row) }} /
          Impacto {{ impactLabelByIndex(selectedCell.col) }}
        </strong>
        <span v-else>ninguna celda seleccionada.</span>
      </p>
    </section>

    <footer class="risk-matrix__footer">
      Matriz Probabilidad × Impacto editable. Los niveles pueden adaptarse al
      contexto (docente, ingeniería, institucional). La cuantificación detallada
      y vínculo con datos se completa dentro de F2.11.
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

const DEFAULT_PROB_LEVELS = [
  'Muy baja',
  'Baja',
  'Media',
  'Alta',
  'Muy alta',
]

const DEFAULT_IMPACT_LEVELS = [
  'Muy bajo',
  'Bajo',
  'Medio',
  'Alto',
  'Muy alto',
]

type SelectedCell = {
  row: number
  col: number
}

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
}>()

const title = computed(
  () => props.node.attrs.title ?? 'Matriz de riesgo',
)

const description = computed(
  () => props.node.attrs.description ?? '',
)

const probLevels = computed<string[]>(() => {
  const raw = props.node.attrs.probLevels as string[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_PROB_LEVELS]
  }
  return raw
})

const impactLevels = computed<string[]>(() => {
  const raw = props.node.attrs.impactLevels as string[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_IMPACT_LEVELS]
  }
  return raw
})

const selectedCell = computed<SelectedCell | null>(() => {
  const cell = props.node.attrs.selectedCell as SelectedCell | undefined
  if (!cell) return null
  if (
    typeof cell.row !== 'number' ||
    typeof cell.col !== 'number'
  ) {
    return null
  }
  return cell
})

const mainRiskDescription = computed(
  () =>
    props.node.attrs.mainRiskDescription ??
    '',
)

function onTitleInput(value: string) {
  props.updateAttributes({ title: value })
}

function onDescriptionInput(value: string) {
  props.updateAttributes({ description: value })
}

function commitProbLevels(next: string[]) {
  props.updateAttributes({
    probLevels: next,
  })
}

function commitImpactLevels(next: string[]) {
  props.updateAttributes({
    impactLevels: next,
  })
}

function onProbLevelInput(index: number, value: string) {
  const current = probLevels.value
  const next = [...current]
  if (!next[index]) return
  next[index] = value
  commitProbLevels(next)
}

function onImpactLevelInput(index: number, value: string) {
  const current = impactLevels.value
  const next = [...current]
  if (!next[index]) return
  next[index] = value
  commitImpactLevels(next)
}

function onCellClick(row: number, col: number) {
  props.updateAttributes({
    selectedCell: { row, col },
  })
}

function onMainRiskDescriptionInput(value: string) {
  props.updateAttributes({
    mainRiskDescription: value,
  })
}

function probLabelByIndex(rowIndex: number): string {
  const levels = probLevels.value
  const effectiveIndex = rowIndex
  return levels[effectiveIndex] ?? `${rowIndex + 1}`
}

function impactLabelByIndex(colIndex: number): string {
  const levels = impactLevels.value
  return levels[colIndex] ?? `${colIndex + 1}`
}

/**
 * Etiqueta de severidad (simple) basada en posición.
 * F2.11: lógica ligera, sin cálculos complejos.
 */
function riskLevelLabel(rowIndex: number, colIndex: number): string {
  const maxRow = probLevels.value.length - 1
  const maxCol = impactLevels.value.length - 1

  const normalizedRow = rowIndex / maxRow
  const normalizedCol = colIndex / maxCol
  const score = (normalizedRow + normalizedCol) / 2

  if (score < 0.33) return 'Bajo'
  if (score < 0.66) return 'Medio'
  return 'Alto'
}
</script>

<style scoped>
.risk-matrix {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 10px 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  font-size: 12px;
  color: #111827;
}

.risk-matrix__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.risk-matrix__title {
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
}

.risk-matrix__description {
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  padding: 4px 8px;
  font-size: 12px;
}

/* Ejes */

.risk-matrix__axes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.risk-matrix__axis-group h3 {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

.risk-matrix__axis-field {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
  font-size: 11px;
}

.risk-matrix__axis-field span {
  display: inline-flex;
  width: 16px;
  justify-content: center;
  color: #6b7280;
}

.risk-matrix__axis-field input {
  flex: 1;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

.risk-matrix__axis-field--horizontal span {
  width: 18px;
}

/* Grid */

.risk-matrix__grid-wrapper {
  overflow-x: auto;
  margin-bottom: 8px;
}

.risk-matrix__grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  border-collapse: collapse;
  border: 1px solid #e5e7eb;
}

.risk-matrix__grid-cell {
  min-width: 40px;
  min-height: 24px;
  font-size: 11px;
  padding: 3px 4px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

/* Esquina */

.risk-matrix__grid-cell--corner {
  background: #f9fafb;
}

/* Encabezados */

.risk-matrix__grid-cell--header {
  background: #f3f4f6;
  font-weight: 600;
  color: #4b5563;
}

/* Celdas de datos */

.risk-matrix__grid-cell--data {
  background: #ffffff;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  transition:
    background 0.12s ease,
    border-color 0.12s ease,
    box-shadow 0.12s ease;
}

.risk-matrix__grid-cell--data:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.risk-matrix__grid-cell--selected {
  background: #fee2e2;
  border-color: #f97373;
  box-shadow: 0 0 0 1px #fecaca;
}

/* Resumen */

.risk-matrix__summary {
  margin-bottom: 4px;
}

.risk-matrix__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}

.risk-matrix__field input {
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

.risk-matrix__hint {
  margin: 4px 0 0;
  font-size: 10px;
  color: #6b7280;
}

/* Footer */

.risk-matrix__footer {
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
}
</style>
```


### `packages/editor-ext-diagrams-adv/src/SystemsModelNodeView.vue`

```vue
<!-- packages/editor-ext-diagrams-adv/src/SystemsModelNodeView.vue -->
<template>
  <NodeViewWrapper class="systems-model">
    <header class="systems-model__header">
      <input
        class="systems-model__title"
        type="text"
        :value="title"
        placeholder="Modelo / análisis de sistemas"
        @input="onTitleInput(($event.target as HTMLInputElement).value)"
      />

      <input
        class="systems-model__description"
        type="text"
        :value="description"
        placeholder="Descripción general del sistema (opcional)"
        @input="onDescriptionInput(($event.target as HTMLInputElement).value)"
      />
    </header>

    <section class="systems-model__body">
      <!-- Entradas -->
      <div class="systems-model__column systems-model__column--inputs">
        <h3 class="systems-model__column-title">Entradas</h3>
        <ul class="systems-model__list">
          <li
            v-for="(entry, index) in inputs"
            :key="`in-${index}`"
          >
            <input
              type="text"
              :value="entry"
              placeholder="Recurso / señal / factor..."
              @input="
                onInputChange(
                  index,
                  ($event.target as HTMLInputElement).value,
                )
              "
            />
          </li>
        </ul>

        <button
          type="button"
          class="systems-model__add"
          @click="addInput"
        >
          + Añadir entrada
        </button>
      </div>

      <!-- Caja negra del sistema -->
      <div class="systems-model__column systems-model__column--system">
        <div class="systems-model__box">
          <input
            class="systems-model__system-name"
            type="text"
            :value="systemName"
            placeholder="Nombre del sistema / proceso"
            @input="onSystemNameInput(($event.target as HTMLInputElement).value)"
          />
          <textarea
            class="systems-model__system-notes"
            :value="systemNotes"
            rows="3"
            placeholder="Descripción interna (opcional): componentes, restricciones, supuestos..."
            @input="
              onSystemNotesInput(($event.target as HTMLTextAreaElement).value)
            "
          />
        </div>
      </div>

      <!-- Salidas -->
      <div class="systems-model__column systems-model__column--outputs">
        <h3 class="systems-model__column-title">Salidas</h3>
        <ul class="systems-model__list">
          <li
            v-for="(output, index) in outputs"
            :key="`out-${index}`"
          >
            <input
              type="text"
              :value="output"
              placeholder="Producto / resultado / indicador..."
              @input="
                onOutputChange(
                  index,
                  ($event.target as HTMLInputElement).value,
                )
              "
            />
          </li>
        </ul>

        <button
          type="button"
          class="systems-model__add"
          @click="addOutput"
        >
          + Añadir salida
        </button>
      </div>
    </section>

    <footer class="systems-model__footer">
      Modelo de “caja negra”: relaciona entradas, sistema y salidas. Las
      extensiones hacia diagramas causales, bucles de realimentación o matrices
      de parámetros se desarrollan sobre esta base dentro de F2.11–F3.x.
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
}>()

const title = computed(
  () =>
    props.node.attrs.title ?? 'Modelo / análisis de sistemas',
)

const description = computed(
  () => props.node.attrs.description ?? '',
)

const inputs = computed<string[]>(() => {
  const raw = props.node.attrs.inputs as string[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return ['']
  }
  return raw
})

const outputs = computed<string[]>(() => {
  const raw = props.node.attrs.outputs as string[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return ['']
  }
  return raw
})

const systemName = computed(
  () => props.node.attrs.systemName ?? '',
)

const systemNotes = computed(
  () => props.node.attrs.systemNotes ?? '',
)

function onTitleInput(value: string) {
  props.updateAttributes({ title: value })
}

function onDescriptionInput(value: string) {
  props.updateAttributes({ description: value })
}

function commitInputs(next: string[]) {
  props.updateAttributes({
    inputs: next,
  })
}

function commitOutputs(next: string[]) {
  props.updateAttributes({
    outputs: next,
  })
}

function onInputChange(index: number, value: string) {
  const current = inputs.value
  const next = [...current]
  next[index] = value
  commitInputs(next)
}

function onOutputChange(index: number, value: string) {
  const current = outputs.value
  const next = [...current]
  next[index] = value
  commitOutputs(next)
}

function addInput() {
  const current = inputs.value
  const next = [...current, '']
  commitInputs(next)
}

function addOutput() {
  const current = outputs.value
  const next = [...current, '']
  commitOutputs(next)
}

function onSystemNameInput(value: string) {
  props.updateAttributes({
    systemName: value,
  })
}

function onSystemNotesInput(value: string) {
  props.updateAttributes({
    systemNotes: value,
  })
}
</script>

<style scoped>
.systems-model {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 10px 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  font-size: 12px;
  color: #111827;
}

/* Header */

.systems-model__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.systems-model__title {
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
}

.systems-model__description {
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  padding: 4px 8px;
  font-size: 12px;
}

/* Body */

.systems-model__body {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.2fr) minmax(0, 1.1fr);
  gap: 8px;
  margin-bottom: 8px;
}

/* Columns */

.systems-model__column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.systems-model__column-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

/* Inputs/outputs list */

.systems-model__list {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.systems-model__list input {
  width: 100%;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

/* Add button */

.systems-model__add {
  margin-top: 2px;
  border-radius: 999px;
  border: 1px dashed #d1d5db;
  background: #fdfbff;
  font-size: 11px;
  padding: 3px 8px;
  cursor: pointer;
  color: #4b3f72;
}

.systems-model__add:hover {
  background: #f3ecff;
  border-color: #c1b6ff;
}

/* System box */

.systems-model__box {
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  padding: 8px;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.systems-model__system-name {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  background: #ffffff;
}

.systems-model__system-notes {
  border-radius: 6px;
  border: 1px dashed #d1d5db;
  padding: 4px 8px;
  font-size: 11px;
  resize: vertical;
  background: #ffffff;
}

/* Footer */

.systems-model__footer {
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
}
</style>
```


### `packages/editor-ext-diagrams-adv/src/templates/index.ts`

```ts
// packages/editor-ext-diagrams-adv/src/templates/index.ts
import type { DiagramKind } from '../types'

export interface DiagramTemplate {
  id: string
  kind: DiagramKind
  label: string
  description?: string
  /**
   * Configuración base para el diagrama.
   * La interpretación depende del kind.
   */
  config: Record<string, any>
}

/**
 * Plantillas mínimas sugeridas en F2.11.
 * (Se pueden ampliar dentro de la misma fase sin romper compatibilidad.)
 */
export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'ishikawa-6m',
    kind: 'ishikawa',
    label: 'Ishikawa 6M (calidad)',
    description: 'Método, Mano de obra, Maquinaria, Medición, Medio ambiente, Materiales.',
    config: {
      categories: ['Método', 'Mano de obra', 'Maquinaria', 'Medición', 'Medio ambiente', 'Materiales'],
    },
  },
  {
    id: 'ishikawa-educacion',
    kind: 'ishikawa',
    label: 'Ishikawa Educación / Proyectos terminales',
    description:
      'Factores académicos, administrativos, metodológicos, recursos, tiempo y contexto.',
    config: {
      categories: [
        'Académicos',
        'Administrativos',
        'Metodológicos',
        'Recursos',
        'Tiempo',
        'Contexto',
      ],
    },
  },
  {
    id: 'venn-3',
    kind: 'venn',
    label: 'Venn de 3 conjuntos',
    config: {
      sets: ['A', 'B', 'C'],
    },
  },
  {
    id: 'risk-5x5',
    kind: 'riskMatrix',
    label: 'Matriz de riesgo 5×5',
    config: {
      size: 5,
    },
  },
  {
    id: 'process-basic',
    kind: 'processMap',
    label: 'Mapa de proceso básico',
    config: {
      layout: 'left-to-right',
    },
  },
  {
    id: 'systems-causal',
    kind: 'systemsModel',
    label: 'Diagrama causal simple',
    config: {
      defaultNodes: 3,
    },
  },
]
```


### `packages/editor-ext-diagrams-adv/src/types.ts`

```ts
// packages/editor-ext-diagrams-adv/src/types.ts

/**
 * Tipos base para F2.11 — Diagramas avanzados.
 *
 * Un único nodo `diagramAdv` con distintos "kinds".
 * Configuración extensible vía `config`.
 */

export type DiagramKind =
| 'ishikawa'
| 'venn'
| 'riskMatrix'
| 'processMap'
| 'systemsModel'

export interface DiagramAdvAttrs {
  /**
   * Identificador estable del nodo, para enlazar con datasets, stats, etc.
   */
  id: string

  /**
   * Tipo de diagrama (Ishikawa, Venn/Euler, Matriz de riesgo, etc.).
   */
  kind: DiagramKind

  /**
   * Título del diagrama (etiqueta visible).
   */
  title: string | null

  /**
   * Descripción corta o nota explicativa.
   */
  description: string | null

  /**
   * Referencia lógica a un dataset de stats (si aplica).
   * Ej: "dataset://tabla1" o un ID interno.
   */
  datasetRef: string | null

  /**
   * Configuración específica según el tipo de diagrama.
   * En F2.11 se deja como `Record<string, any>` para permitir evolucionar
   * sin romper compatibilidad.
   */
  config: Record<string, any> | null
}

export interface DiagramAdvOptions {
  /**
   * Atributos HTML extra para el contenedor principal del NodeView.
   */
  HTMLAttributes: Record<string, any>
}
```


### `packages/editor-ext-diagrams-adv/src/VennEulerNodeView.vue`

```vue
<!-- packages/editor-ext-diagrams-adv/src/VennEulerNodeView.vue -->
<template>
  <NodeViewWrapper class="diagram-venn">
    <header class="diagram-venn__header">
      <input
        class="diagram-venn__title"
        type="text"
        :value="title"
        placeholder="Diagrama de Venn / Euler"
        @input="onTitleInput(($event.target as HTMLInputElement).value)"
      />

      <input
        class="diagram-venn__description"
        type="text"
        :value="description"
        placeholder="Descripción / contexto (opcional)"
        @input="onDescriptionInput(($event.target as HTMLInputElement).value)"
      />
    </header>

    <section class="diagram-venn__controls">
      <label class="diagram-venn__field">
        <span>Número de conjuntos (2–4)</span>
        <input
          type="number"
          min="2"
          max="4"
          :value="sets.length"
          @input="onSetCountInput(($event.target as HTMLInputElement).value)"
        />
      </label>
    </section>

    <section class="diagram-venn__body">
      <!-- Vista “diagramática” simplificada -->
      <div
        class="diagram-venn__canvas"
        :class="`diagram-venn__canvas--${sets.length}`"
      >
        <div
          v-for="(set, index) in sets"
          :key="set.id"
          class="diagram-venn__circle"
          :class="`diagram-venn__circle--${index + 1}`"
        >
          <span class="diagram-venn__circle-label">
            {{ set.label || `Conjunto ${index + 1}` }}
          </span>
        </div>
      </div>

      <!-- Configuración de conjuntos -->
      <div class="diagram-venn__sets">
        <h3 class="diagram-venn__section-title">Conjuntos</h3>
        <div
          v-for="(set, index) in sets"
          :key="set.id"
          class="diagram-venn__set-row"
        >
          <label class="diagram-venn__field diagram-venn__field--inline">
            <span>Etiqueta</span>
            <input
              type="text"
              :value="set.label"
              :placeholder="`Conjunto ${index + 1}`"
              @input="
                onSetLabelInput(
                  index,
                  ($event.target as HTMLInputElement).value,
                )
              "
            />
          </label>

          <label class="diagram-venn__field diagram-venn__field--inline">
            <span>Nota / descripción</span>
            <input
              type="text"
              :value="set.note"
              placeholder="p.ej. Estudiantes con beca"
              @input="
                onSetNoteInput(
                  index,
                  ($event.target as HTMLInputElement).value,
                )
              "
            />
          </label>
        </div>
      </div>
    </section>

    <footer class="diagram-venn__footer">
      Vista simplificada de Venn/Euler. Define de 2 a 4 conjuntos, sus nombres y
      notas. La integración con datos (cardinalidades, porcentajes) se completa
      dentro de la misma F2.11.
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

type VennSet = {
  id: string
  label: string
  note?: string
}

const DEFAULT_SETS: VennSet[] = [
  { id: 'set-a', label: 'A', note: '' },
  { id: 'set-b', label: 'B', note: '' },
  { id: 'set-c', label: 'C', note: '' },
]

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
}>()

const title = computed(
  () => props.node.attrs.title ?? 'Diagrama de Venn / Euler',
)

const description = computed(
  () => props.node.attrs.description ?? '',
)

const sets = computed<VennSet[]>(() => {
  const raw = props.node.attrs.sets as VennSet[] | undefined
  if (!raw || !Array.isArray(raw) || raw.length < 2) {
    return DEFAULT_SETS.slice(0, 2)
  }

  return raw.map((s, index) => ({
    id: s?.id ?? `set-${index}`,
    label: s?.label ?? `Conjunto ${index + 1}`,
    note: s?.note ?? '',
  }))
})

function commitSets(next: VennSet[]) {
  props.updateAttributes({
    sets: next,
  })
}

function onTitleInput(value: string) {
  props.updateAttributes({ title: value })
}

function onDescriptionInput(value: string) {
  props.updateAttributes({ description: value })
}

function onSetCountInput(rawValue: string) {
  const current = sets.value
  let nextCount = Number.parseInt(rawValue, 10)
  if (Number.isNaN(nextCount)) return

  nextCount = Math.min(4, Math.max(2, nextCount))

  const next: VennSet[] = []

  for (let i = 0; i < nextCount; i += 1) {
    const existing = current[i]
    if (existing) {
      next.push(existing)
    } else {
      next.push({
        id: `set-${Date.now()}-${i}`,
        label: `Conjunto ${i + 1}`,
        note: '',
      })
    }
  }

  commitSets(next)
}

function onSetLabelInput(index: number, value: string) {
  const current = sets.value
  const next = [...current]
  if (!next[index]) return

  next[index] = {
    ...next[index],
    label: value,
  }

  commitSets(next)
}

function onSetNoteInput(index: number, value: string) {
  const current = sets.value
  const next = [...current]
  if (!next[index]) return

  next[index] = {
    ...next[index],
    note: value,
  }

  commitSets(next)
}
</script>

<style scoped>
.diagram-venn {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 10px 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  font-size: 12px;
  color: #111827;
}

.diagram-venn__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.diagram-venn__title {
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
}

.diagram-venn__description {
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  padding: 4px 8px;
  font-size: 12px;
}

.diagram-venn__controls {
  margin-bottom: 8px;
}

.diagram-venn__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}

.diagram-venn__field input {
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 11px;
}

/* Cuerpo */

.diagram-venn__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 10px;
  margin-bottom: 8px;
}

/* “Lienzo” con círculos */

.diagram-venn__canvas {
  position: relative;
  min-height: 120px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
}

/* Posiciones para 2, 3 y 4 conjuntos */

.diagram-venn__circle {
  position: absolute;
  border-radius: 999px;
  border: 1px solid #c7d2fe;
  background: rgba(219, 234, 254, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  padding: 4px;
  text-align: center;
}

.diagram-venn__circle-label {
  max-width: 70px;
}

/* 2 conjuntos */
.diagram-venn__canvas--2 .diagram-venn__circle--1 {
  width: 70px;
  height: 70px;
  left: 18%;
  top: 25%;
}

.diagram-venn__canvas--2 .diagram-venn__circle--2 {
  width: 70px;
  height: 70px;
  right: 18%;
  top: 25%;
}

/* 3 conjuntos */
.diagram-venn__canvas--3 .diagram-venn__circle--1 {
  width: 70px;
  height: 70px;
  left: 14%;
  top: 30%;
}

.diagram-venn__canvas--3 .diagram-venn__circle--2 {
  width: 70px;
  height: 70px;
  right: 14%;
  top: 30%;
}

.diagram-venn__canvas--3 .diagram-venn__circle--3 {
  width: 70px;
  height: 70px;
  left: 50%;
  transform: translateX(-50%);
  top: 10%;
}

/* 4 conjuntos - disposición aproximada */
.diagram-venn__canvas--4 .diagram-venn__circle--1 {
  width: 60px;
  height: 60px;
  left: 12%;
  top: 20%;
}

.diagram-venn__canvas--4 .diagram-venn__circle--2 {
  width: 60px;
  height: 60px;
  right: 12%;
  top: 20%;
}

.diagram-venn__canvas--4 .diagram-venn__circle--3 {
  width: 60px;
  height: 60px;
  left: 22%;
  bottom: 12%;
}

.diagram-venn__canvas--4 .diagram-venn__circle--4 {
  width: 60px;
  height: 60px;
  right: 22%;
  bottom: 12%;
}

/* Config de conjuntos */

.diagram-venn__sets {
  font-size: 11px;
}

.diagram-venn__section-title {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

.diagram-venn__set-row {
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 6px;
  margin-bottom: 4px;
  background: #fdfbff;
}

.diagram-venn__field--inline {
  flex-direction: column;
  gap: 2px;
  margin-bottom: 2px;
}

.diagram-venn__footer {
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
}
</style>
```


## Paquete `editor-ext-dicom`


### `packages/editor-ext-dicom/package.json`

```json
{
  "name": "@disertare/editor-ext-dicom",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  }
}
```


### `packages/editor-ext-dicom/src/DicomNodeView.ts`

```ts
// packages/editor-ext-dicom/src/DicomNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import DicomNodeViewComponent from './DicomNodeView.vue'

export const DicomNodeView: NodeViewRenderer =
VueNodeViewRenderer(DicomNodeViewComponent)
```


### `packages/editor-ext-dicom/src/DicomNodeView.vue`

```vue
<!-- packages/editor-ext-dicom/src/DicomNodeView.vue -->
<template>
  <NodeViewWrapper class="dicom-node">
    <div class="dicom-inner" @click.stop="selectNode">
      <div class="dicom-header">
        <span class="dicom-chip">DICOM</span>
        <span class="dicom-title">{{ heading }}</span>
      </div>

      <div
        class="dicom-viewport"
        :style="{ width, height }"
      >
        <div class="dicom-filename">{{ fileName }}</div>
        <div class="dicom-placeholder">
          Vista previa DICOM básica (F2).
        </div>
      </div>

      <div class="dicom-meta">
        <span v-if="patient">Paciente: {{ patient }}</span>
        <span v-if="study"> · Estudio: {{ study }}</span>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

// i18n placeholder
const t = (key: string) => key

const heading = computed(
  () => props.node.attrs.title || t('editor.ext.dicom.default_title'),
)
const fileName = computed(
  () => props.node.attrs.fileName || props.node.attrs.src || 'imagen.dcm',
)
const patient = computed(() => props.node.attrs.patient || '')
const study = computed(() => props.node.attrs.study || '')
const width = computed(() => props.node.attrs.width || '100%')
const height = computed(() => props.node.attrs.height || '260px')

const selectNode = () => {
  props.editor.commands.setNodeSelection(props.getPos() as number)
}
</script>

<style scoped>
.dicom-node {
  display: block;
  margin: 1rem 0;
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
}

.dicom-inner {
  border: 1px solid #e0d6ff;
  border-radius: 6px;
  background: #faf7ff;
  padding: 8px 10px;
}

.dicom-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.dicom-chip {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #f97373;
  color: #fff;
}

.dicom-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.dicom-viewport {
  border-radius: 4px;
  background: radial-gradient(circle at 30% 30%, #ffffff, #e5e5e5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  text-align: center;
  color: #444;
}

.dicom-filename {
  font-weight: 600;
  margin-bottom: 4px;
}

.dicom-placeholder {
  font-size: 12px;
}

.dicom-meta {
  margin-top: 4px;
  font-size: 11px;
  color: #777;
}
</style>
```


### `packages/editor-ext-dicom/src/index.ts`

```ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DicomNodeView } from './DicomNodeView'

export interface DicomOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dicom: {
      /**
       * Inserta una imagen médica DICOM como objeto editable
       */
      setDicom: (attrs: { dicomArrayBuffer: ArrayBuffer; fileName?: string }) => ReturnType
    }
  }
}

export const Dicom = Node.create<DicomOptions>({
  name: 'dicom',
  group: 'block',
  content: 'text*',
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      fileName: {
        default: 'imagen.dcm',
        parseHTML: element => element.getAttribute('data-file-name'),
        renderHTML: attributes => {
          return { 'data-file-name': attributes.fileName }
        },
      },
      patient: {
        default: '',
        parseHTML: element => element.getAttribute('data-patient'),
        renderHTML: attributes => {
          return { 'data-patient': attributes.patient }
        },
      },
      study: {
        default: '',
        parseHTML: element => element.getAttribute('data-study'),
        renderHTML: attributes => {
          return { 'data-study': attributes.study }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-dicom]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-dicom': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setDicom:
        attrs =>
        ({ chain }) => {
          // Nota: TipTap no serializa ArrayBuffer; usamos base64 en atributos solo para UI
          // El contenido real se maneja en el NodeView
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                fileName: attrs.fileName || 'imagen.dcm',
                patient: attrs.patient || '',
                study: attrs.study || '',
              },
            })
            .run()
        },
    }
  },

  addNodeView() {
    return DicomNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('dicomDropHandler'),
        props: {
          handleDOMEvents: {
            drop(view, event) {
              const files = Array.from(event.dataTransfer?.files || [])
              const dcmFile = files.find(f => f.name.toLowerCase().endsWith('.dcm'))
              if (!dcmFile) return false

              event.preventDefault()
              const reader = new FileReader()
              reader.onload = () => {
                const arrayBuffer = reader.result as ArrayBuffer
                const { schema, dispatch } = view.state

                // Extraer metadatos básicos (simulado)
                const metadata = parseDicomMetadata(arrayBuffer)
                const node = schema.nodes.dicom.create({
                  fileName: dcmFile.name,
                  patient: metadata.PatientName || '',
                  study: metadata.StudyDescription || '',
                })

                const transaction = view.state.tr.replaceSelectionWith(node)
                // Adjuntar buffer al nodo (solo en runtime, no serializable)
                ;(transaction as any).setMeta('dicomBuffer', arrayBuffer)
                dispatch(transaction)
              }
              reader.readAsArrayBuffer(dcmFile)
              return true
            },
          },
        },
      }),
    ]
  },
})

// Parser mínimo de metadatos DICOM (grupo 0x0010 y 0x0008)
function parseDicomMetadata(buffer: ArrayBuffer): Record<string, string> {
  const dataView = new DataView(buffer)
  let offset = 0
  const metadata: Record<string, string> = {}

  // Saltar encabezado de 128 bytes + "DICM"
  if (new TextDecoder().decode(new Uint8Array(buffer, 128, 4)) === 'DICM') {
    offset = 132
  }

  while (offset < buffer.byteLength - 8) {
    const group = dataView.getUint16(offset, true)
    const element = dataView.getUint16(offset + 2, true)
    const vr = new TextDecoder().decode(new Uint8Array(buffer, offset + 4, 2))
    let length = dataView.getUint32(offset + 6, true)
    let valueStart = offset + 12

    if (vr === 'OB' || vr === 'OW' || vr === 'OF' || vr === 'SQ') {
      // Skip binary data
      offset += 8 + ((length + 1) & ~1)
      continue
    }

    if (length === 0xffffffff) {
      // Undefined length — skip
      break
    }

    let value = ''
    if (length > 0 && length < 1000) {
      try {
        value = new TextDecoder().decode(new Uint8Array(buffer, valueStart, length)).trim()
      } catch {}
    }

    if (group === 0x0010 && element === 0x0010) metadata.PatientName = value
    if (group === 0x0008 && element === 0x1030) metadata.StudyDescription = value

    offset += 8 + ((length + 1) & ~1)
  }

  return metadata
}
```


## Paquete `editor-ext-gantt`


### `packages/editor-ext-gantt/package.json`

```json
{
  "name": "@disertare/editor-ext-gantt",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  }
}
```


### `packages/editor-ext-gantt/src/GanttNodeView.ts`

```ts
// packages/editor-ext-gantt/src/GanttNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import GanttNodeViewComponent from './GanttNodeView.vue'

export const GanttNodeView: NodeViewRenderer =
VueNodeViewRenderer(GanttNodeViewComponent)
```


### `packages/editor-ext-gantt/src/GanttNodeView.vue`

```vue
<!-- packages/editor-ext-gantt/src/GanttNodeView.vue -->
<template>
  <NodeViewWrapper class="gantt-node" :data-mode="mode">
    <!-- Cabecera / título -->
    <header class="gantt-header">
      <span class="gantt-badge">GANTT</span>
      <div class="gantt-title-group">
        <div class="gantt-title">
          {{ t('editor.ext.gantt.default_title') }}
        </div>
        <div class="gantt-subtitle">
          {{ t('editor.ext.gantt.subtitle') }}
        </div>
      </div>
    </header>

    <!-- Barra de controles -->
    <div class="gantt-toolbar">
      <label class="gantt-mode-select">
        <span>{{ t('editor.ext.gantt.mode_label') }}</span>
        <select v-model="mode">
          <option value="gantt">Gantt</option>
          <option value="kanban">Kanban</option>
        </select>
      </label>

      <textarea
        v-model="rawData"
        class="gantt-data-input"
        :placeholder="t('editor.ext.gantt.placeholder')"
      ></textarea>
    </div>

    <!-- Vista Gantt -->
    <div v-if="mode === 'gantt'" class="gantt-chart">
      <div v-if="parsedTasks.length === 0" class="gantt-empty">
        {{ t('editor.ext.gantt.empty_hint') }}
      </div>

      <div
        v-else
        class="gantt-track"
        @click.stop="selectNode"
      >
        <!-- Grid de fondo -->
        <div class="gantt-grid">
          <div
            v-for="day in totalDays"
            :key="'grid-' + day"
            class="gantt-grid-column"
          ></div>
        </div>

        <!-- Barras de tareas -->
        <div
          v-for="task in parsedTasks"
          :key="task.id"
          class="gantt-task-row"
        >
          <div class="gantt-task-label">
            {{ task.label }}
          </div>

          <div class="gantt-task-bar-wrapper">
            <div
              class="gantt-task-bar"
              :style="{
                left: taskLeft(task) + '%',
                width: taskWidth(task) + '%',
              }"
            >
              <span class="gantt-task-bar-text">
                {{ task.duration }}d
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista Kanban -->
    <div v-else class="kanban-board" @click.stop="selectNode">
      <div
        v-for="column in kanbanColumns"
        :key="column.id"
        class="kanban-column"
      >
        <div class="kanban-column-header">
          {{ column.name }}
        </div>

        <div class="kanban-column-body">
          <div
            v-for="task in column.tasks"
            :key="task.id"
            class="kanban-card"
          >
            <div class="kanban-card-title">{{ task.title }}</div>
            <div v-if="task.date" class="kanban-card-date">
              {{ task.date }}
            </div>
          </div>

          <div v-if="column.tasks.length === 0" class="kanban-empty">
            {{ t('editor.ext.gantt.kanban_empty') }}
          </div>
        </div>
      </div>
    </div>

    <footer class="gantt-footer">
      <span class="gantt-footer-hint">
        {{ t('editor.ext.gantt.footer_hint') }}
      </span>
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

// i18n placeholder
const t = (key: string) => key

// --- Estado básico ---
const mode = ref<'gantt' | 'kanban'>(
  (props.node.attrs.mode as 'gantt' | 'kanban') ?? 'gantt',
)

const DEFAULT_DATA =
  'Tarea A,2025-11-10,5\n' +
  'Tarea B,2025-11-15,3\n' +
  'Tarea C,2025-11-18,4'

const rawData = ref<string>(props.node.attrs.content ?? DEFAULT_DATA)

type GanttTask = {
  id: string
  label: string
  start: Date
  duration: number
}

type KanbanTask = {
  id: string
  title: string
  date?: string
}

type KanbanColumn = {
  id: string
  name: string
  tasks: KanbanTask[]
}

const parsedTasks = ref<GanttTask[]>([])

const kanbanColumns = ref<KanbanColumn[]>([
  { id: 'todo', name: 'Por hacer', tasks: [] },
  { id: 'doing', name: 'En progreso', tasks: [] },
  { id: 'done', name: 'Hecho', tasks: [] },
])

// --- Parsing de datos ---
const parseData = () => {
  const lines = rawData.value
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const tasks: GanttTask[] = []
  lines.forEach((line, index) => {
    const [labelRaw, dateRaw, durationRaw] = line.split(',').map(p => p?.trim() ?? '')
    const label = labelRaw || `Task ${index + 1}`

    let start = new Date()
    if (dateRaw) {
      const d = new Date(dateRaw)
      if (!Number.isNaN(d.getTime())) {
        start = d
      }
    }

    const duration = Number(durationRaw || '1') || 1

    tasks.push({
      id: `task-${index}`,
      label,
      start,
      duration,
    })
  })

  parsedTasks.value = tasks

  // Rellenar Kanban de forma muy sencilla: todas las tareas en "Por hacer"
  kanbanColumns.value[0].tasks = tasks.map(t => ({
    id: t.id,
    title: t.label,
    date: t.start.toISOString().slice(0, 10),
  }))
  kanbanColumns.value[1].tasks = []
  kanbanColumns.value[2].tasks = []
}

// --- Cálculos para el Gantt ---
const minDate = computed(() => {
  if (!parsedTasks.value.length) return new Date()
  return parsedTasks.value.reduce(
    (min, t) => (t.start < min ? t.start : min),
    parsedTasks.value[0].start,
  )
})

const maxDate = computed(() => {
  if (!parsedTasks.value.length) return new Date()
  return parsedTasks.value.reduce((max, t) => {
    const end = new Date(t.start.getTime() + t.duration * 24 * 60 * 60 * 1000)
    return end > max ? end : max
  }, parsedTasks.value[0].start)
})

const totalDays = computed(() => {
  const diffMs = maxDate.value.getTime() - minDate.value.getTime()
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000)) || 1
  return days
})

const taskLeft = (task: GanttTask) => {
  const diffMs = task.start.getTime() - minDate.value.getTime()
  const daysFromStart = diffMs / (24 * 60 * 60 * 1000)
  const ratio = daysFromStart / totalDays.value
  return Math.max(0, Math.min(100, ratio * 100))
}

const taskWidth = (task: GanttTask) => {
  const ratio = task.duration / totalDays.value
  return Math.max(5, Math.min(100, ratio * 100))
}

// --- Sincronización con TipTap ---
const syncAttrs = () => {
  props.updateAttributes({
    mode: mode.value,
    content: rawData.value,
  })
}

// Seleccionar el nodo completo al hacer clic en el área principal
const selectNode = () => {
  try {
    props.editor.commands.setNodeSelection(props.getPos() as number)
  } catch {
    // no-op en caso de que getPos no esté disponible
  }
}

onMounted(() => {
  parseData()
  syncAttrs()
})

// Cuando cambian los datos o el modo, volvemos a parsear y sincronizar attrs
watch([rawData, mode], () => {
  parseData()
  syncAttrs()
})
</script>

<style scoped>
.gantt-node {
  margin: 1rem 0;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(106, 90, 249, 0.25);
  background: #fbf9ff;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
}

/* Header */
.gantt-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.gantt-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  background: #f1ecff;
  color: #5b48f0;
}

.gantt-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gantt-title {
  font-weight: 600;
}

.gantt-subtitle {
  font-size: 11px;
  color: #666;
}

/* Toolbar */
.gantt-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.gantt-mode-select {
  display: flex;
  align-items: center;
  gap: 4px;
}

.gantt-mode-select select {
  padding: 2px 4px;
  font-size: 12px;
}

.gantt-data-input {
  flex: 1;
  min-height: 60px;
  padding: 4px 6px;
  font-size: 12px;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, 'Liberation Mono', 'Courier New', monospace;
  border-radius: 4px;
  border: 1px solid #d4cef7;
  resize: vertical;
}

/* Gantt view */
.gantt-chart {
  position: relative;
  padding: 8px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e2dcff;
}

.gantt-empty {
  font-size: 12px;
  color: #777;
  font-style: italic;
}

.gantt-track {
  position: relative;
  overflow-x: auto;
}

.gantt-grid {
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
}

.gantt-grid-column {
  flex: 1;
  border-right: 1px dashed rgba(148, 131, 255, 0.25);
}

.gantt-task-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-block: 4px;
}

.gantt-task-label {
  min-width: 120px;
  max-width: 160px;
  font-size: 12px;
  color: #333;
}

.gantt-task-bar-wrapper {
  position: relative;
  flex: 1;
  height: 20px;
}

.gantt-task-bar {
  position: absolute;
  top: 2px;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, #a394ff, #6a5af9);
  display: flex;
  align-items: center;
  padding-inline: 6px;
  color: #fff;
  font-size: 11px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(31, 22, 86, 0.3);
}

.gantt-task-bar-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Kanban view */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.kanban-column {
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e2dcff;
  display: flex;
  flex-direction: column;
  max-height: 260px;
}

.kanban-column-header {
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 600;
  background: #f4f0ff;
  border-bottom: 1px solid #e2dcff;
}

.kanban-column-body {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.kanban-card {
  padding: 4px 6px;
  border-radius: 4px;
  background: #f7f4ff;
  border: 1px solid #ddd4ff;
}

.kanban-card-title {
  font-size: 12px;
  font-weight: 500;
}

.kanban-card-date {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.kanban-empty {
  font-size: 11px;
  color: #888;
  font-style: italic;
}

/* Footer */
.gantt-footer {
  margin-top: 6px;
  font-size: 11px;
  color: #777;
}

.gantt-footer-hint {
  font-style: italic;
}
</style>
```


### `packages/editor-ext-gantt/src/index.ts`

```ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { GanttNodeView } from './GanttNodeView'

export interface GanttOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gantt: {
      /**
       * Inserta un diagrama Gantt o tablero Kanban editable
       */
      setGantt: (attrs?: { mode?: 'gantt' | 'kanban'; content?: string }) => ReturnType
    }
  }
}

export const Gantt = Node.create<GanttOptions>({
  name: 'gantt',
  group: 'block',
  content: 'text*',
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      mode: {
        default: 'gantt',
        parseHTML: element => element.getAttribute('data-mode') || 'gantt',
        renderHTML: attributes => {
          return { 'data-mode': attributes.mode }
        },
      },
      content: {
        default: 'Tarea A,2025-11-10,5\nTarea B,2025-11-12,3',
        parseHTML: element => element.getAttribute('data-content'),
        renderHTML: attributes => {
          return { 'data-content': attributes.content }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-gantt]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-gantt': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setGantt:
        attrs =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                mode: attrs?.mode ?? 'gantt',
                content: attrs?.content ?? 'Tarea A,2025-11-10,5\nTarea B,2025-11-12,3',
              },
            })
            .run()
        },
    }
  },

  addNodeView() {
    return GanttNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('ganttPasteHandler'),
        props: {
          // Opcional: detectar listas de tareas en portapapeles
        },
      }),
    ]
  },
})
```


## Paquete `editor-ext-geospatial`


### `packages/editor-ext-geospatial/package.json`

```json
{
  "name": "@disertare/editor-ext-geospatial",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  }
}
```


### `packages/editor-ext-geospatial/src/GeoSpatialNodeView.ts`

```ts
// packages/editor-ext-geospatial/src/GeoSpatialNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import GeoSpatialNodeViewComponent from './GeoSpatialNodeView.vue'

export const GeoSpatialNodeView: NodeViewRenderer =
VueNodeViewRenderer(GeoSpatialNodeViewComponent)
```


### `packages/editor-ext-geospatial/src/GeoSpatialNodeView.vue`

```vue
<!-- packages/editor-ext-geospatial/src/GeoSpatialNodeView.vue -->
<template>
  <NodeViewWrapper class="geo-node">
    <div class="geo-inner" @click.stop="selectNode">
      <div class="geo-header">
        <span class="geo-chip">MAP</span>
        <span class="geo-title">{{ title }}</span>
      </div>

      <div
        class="geo-map-placeholder"
        :style="{ width, height }"
      >
        <div class="geo-filename">{{ fileName }}</div>
        <div class="geo-hint">
          Vista GeoSpatial básica (F2).
        </div>
        <div v-if="hasSummary" class="geo-summary">
          {{ summary }}
        </div>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const t = (key: string) => key

const title = computed(
  () => props.node.attrs.title || t('editor.ext.geospatial.default_title'),
)
const fileName = computed(
  () => props.node.attrs.fileName || 'map.geojson',
)
const width = computed(() => props.node.attrs.width || '100%')
const height = computed(() => props.node.attrs.height || '260px')
const geojson = computed(() => props.node.attrs.geojson || props.node.attrs.geoJson || '')

const hasSummary = computed(() => !!geojson.value && geojson.value.length > 0)
const summary = computed(() =>
  geojson.value.length > 80
    ? geojson.value.slice(0, 80) + '…'
    : geojson.value,
)

const selectNode = () => {
  props.editor.commands.setNodeSelection(props.getPos() as number)
}
</script>

<style scoped>
.geo-node {
  display: block;
  margin: 1rem 0;
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
}

.geo-inner {
  border: 1px solid #e0d6ff;
  border-radius: 6px;
  background: #faf7ff;
  padding: 8px 10px;
}

.geo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.geo-chip {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #10b981;
  color: #fff;
}

.geo-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.geo-map-placeholder {
  border-radius: 4px;
  background: repeating-linear-gradient(
    -45deg,
    #e0f7ff,
    #e0f7ff 6px,
    #f2fbff 6px,
    #f2fbff 12px
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  text-align: center;
  color: #444;
}

.geo-filename {
  font-weight: 600;
  margin-bottom: 4px;
}

.geo-hint {
  font-size: 12px;
  margin-bottom: 4px;
}

.geo-summary {
  font-size: 11px;
  max-width: 90%;
  word-break: break-word;
}
</style>
```


### `packages/editor-ext-geospatial/src/index.ts`

```ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { GeoSpatialNodeView } from './GeoSpatialNodeView'

export interface GeoSpatialOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    geospatial: {
      /**
       * Inserta un mapa geoespacial (GeoJSON/TopoJSON) editable
       */
      setGeoSpatial: (attrs: { geojson: string; fileName?: string }) => ReturnType
    }
  }
}

export const GeoSpatial = Node.create<GeoSpatialOptions>({
  name: 'geospatial',
  group: 'block',
  content: 'text*',
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      geojson: {
        default: '',
        parseHTML: element => element.getAttribute('data-geojson'),
        renderHTML: attributes => {
          return { 'data-geojson': attributes.geojson }
        },
      },
      fileName: {
        default: 'map.geojson',
        parseHTML: element => element.getAttribute('data-file-name'),
        renderHTML: attributes => {
          return { 'data-file-name': attributes.fileName }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-geospatial]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-geospatial': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setGeoSpatial:
        attrs =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                geojson: attrs.geojson,
                fileName: attrs.fileName || 'map.geojson',
              },
            })
            .run()
        },
    }
  },

  addNodeView() {
    return GeoSpatialNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('geoPasteHandler'),
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData('text/plain')
            if (!text) return false

            try {
              const json = JSON.parse(text)
              if (
                (json.type === 'FeatureCollection' || json.type === 'Topology') &&
                json.features?.length > 0
              ) {
                const { schema, dispatch } = view.state
                const node = schema.nodes.geospatial.create({
                  geojson: text,
                  fileName: 'clipboard.geojson',
                })
                const transaction = view.state.tr.replaceSelectionWith(node)
                dispatch(transaction)
                event.preventDefault()
                return true
              }
            } catch {
              // Not valid GeoJSON/TopoJSON
            }
            return false
          },
        },
      }),
    ]
  },
})
```


## Paquete `editor-ext-images-adv`


### `packages/editor-ext-images-adv/package.json`

```json
{
  "name": "@disertare/editor-ext-images-adv",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "disertareBrand": {
    "module": "editor",
    "scope": "extension",
    "feature": "images-adv",
    "phase": "F2.15"
  }
}
```


### `packages/editor-ext-images-adv/src/ImagesAdvNodeView.vue`

```vue
<template>
  <NodeViewWrapper
    class="images-adv-node-wrapper"
    :aria-label="t('editor.ext.imagesAdv.edit_image_advanced')"
  >
    <div class="images-adv-node">
      <!-- Toolbar superior -->
      <header class="images-adv-toolbar">
        <!-- Grupo: herramientas de pintura / selección -->
        <div class="tools-group">
          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'brush' }"
            @click="setTool('brush')"
          >
            🖌
            <span>{{ t('editor.ext.imagesAdv.tool.brush') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'eraser' }"
            @click="setTool('eraser')"
          >
            🧽
            <span>{{ t('editor.ext.imagesAdv.tool.eraser') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'clone' }"
            @click="setTool('clone')"
          >
            🩹
            <span>{{ t('editor.ext.imagesAdv.tool.clone') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'eyedropper' }"
            @click="setTool('eyedropper')"
          >
            🎯
            <span>{{ t('editor.ext.imagesAdv.tool.eyedropper') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'selectRect' }"
            @click="setTool('selectRect')"
          >
            ▭
            <span>{{ t('editor.ext.imagesAdv.tool.selectRect') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'lasso' }"
            @click="setTool('lasso')"
          >
            ✏
            <span>{{ t('editor.ext.imagesAdv.tool.lasso') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'text' }"
            @click="setTool('text')"
          >
            T
            <span>{{ t('editor.ext.imagesAdv.tool.text') }}</span>
          </button>
        </div>

        <!-- Grupo: transformaciones (rotar/voltear/recortar) -->
        <div class="tools-group">
          <button
            type="button"
            class="tool-btn subtle"
            @click="rotateCanvas('left')"
          >
            ↺
            <span>{{ t('editor.ext.imagesAdv.action.rotate_left') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn subtle"
            @click="rotateCanvas('right')"
          >
            ↻
            <span>{{ t('editor.ext.imagesAdv.action.rotate_right') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn subtle"
            @click="flipCanvas('horizontal')"
          >
            ↔
            <span>{{ t('editor.ext.imagesAdv.action.flip_horizontal') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn subtle"
            @click="flipCanvas('vertical')"
          >
            ↕
            <span>{{ t('editor.ext.imagesAdv.action.flip_vertical') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn subtle"
            @click="cropToSelection"
          >
            ✂
            <span>{{ t('editor.ext.imagesAdv.action.crop_selection') }}</span>
          </button>
        </div>

        <!-- Grupo: pincel / color -->
        <div class="tools-group">
          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.brush.size') }}
            <input
              v-model.number="brushSize"
              type="range"
              min="1"
              max="80"
            >
          </label>

          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.brush.opacity') }}
            <input
              v-model.number="brushOpacity"
              type="range"
              min="0.1"
              max="1"
              step="0.05"
            >
          </label>

          <div
            v-if="currentColor"
            class="color-swatch"
            :style="{ backgroundColor: currentColor }"
            :title="currentColor"
          />
        </div>

        <!-- Grupo: filtros rápidos / reset -->
        <div class="tools-group">
          <button
            type="button"
            class="tool-btn subtle"
            @click="applyPreset('none')"
          >
            {{ t('editor.ext.imagesAdv.filter.none') }}
          </button>
          <button
            type="button"
            class="tool-btn subtle"
            @click="applyPreset('bw')"
          >
            B&N
          </button>
          <button
            type="button"
            class="tool-btn subtle"
            @click="applyPreset('sepia')"
          >
            Sepia
          </button>
          <button
            type="button"
            class="tool-btn subtle"
            @click="applyPreset('auto')"
          >
            ✨ {{ t('editor.ext.imagesAdv.action.autoEnhance') }}
          </button>

          <button
            type="button"
            class="tool-btn subtle"
            @click="resetAdjustments"
          >
            ♺ {{ t('editor.ext.imagesAdv.action.reset') }}
          </button>
        </div>
      </header>

      <div class="images-adv-body">
        <!-- Panel de capas -->
        <aside class="layers-panel">
          <header class="layers-header">
            {{ t('editor.ext.imagesAdv.layers.title') }}
          </header>

          <ul class="layers-list">
            <li
              v-for="layer in layers"
              :key="layer.id"
              class="layer-item"
              :class="{ active: layer.id === activeLayerId }"
              @click="setActiveLayer(layer.id)"
            >
              <button
                type="button"
                class="layer-visibility"
                @click.stop="toggleLayerVisibility(layer.id)"
              >
                {{ layer.visible ? '👁' : '🚫' }}
              </button>
              <input
                class="layer-name"
                :value="layer.name"
                @input="e => renameLayer(layer.id, (e.target as HTMLInputElement).value)"
              >
              <input
                class="layer-opacity"
                type="range"
                min="0"
                max="1"
                step="0.05"
                :value="layer.opacity"
                @input="e => changeLayerOpacity(layer.id, Number((e.target as HTMLInputElement).value))"
              >
            </li>
          </ul>

          <footer class="layers-footer">
            <button
              type="button"
              class="tool-btn subtle small"
              @click="addLayer"
            >
              +
            </button>
            <button
              type="button"
              class="tool-btn subtle small"
              @click="removeActiveLayer"
            >
              −
            </button>
          </footer>
        </aside>

        <!-- Lienzo + selección, con zoom -->
        <div class="images-adv-canvas-outer">
          <div
            class="images-adv-canvas-container"
            :style="canvasZoomStyle"
            @mousedown="onPointerDown"
            @mousemove="onPointerMove"
            @mouseup="onPointerUp"
            @mouseleave="onPointerUp"
          >
            <canvas
              ref="canvasRef"
              class="images-adv-canvas"
              :style="canvasStyle"
            />

            <div
              v-if="selectionRect"
              class="selection-rect"
              :style="selectionStyle"
            />
          </div>
        </div>
      </div>

      <!-- Ajustes globales + zoom + exportación -->
      <footer class="images-adv-footer">
        <div class="adjustments">
          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.adjust.brightness') }}
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              :value="adjustments.brightness"
              @input="onAdjustChange('brightness', $event)"
            >
          </label>

          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.adjust.contrast') }}
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              :value="adjustments.contrast"
              @input="onAdjustChange('contrast', $event)"
            >
          </label>

          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.adjust.saturation') }}
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              :value="adjustments.saturation"
              @input="onAdjustChange('saturation', $event)"
            >
          </label>

          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.filter.blur') }}
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              :value="filters.blur"
              @input="onFilterChange('blur', $event)"
            >
          </label>

          <!-- Zoom solo de visualización -->
          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.view.zoom') }}
            <input
              v-model.number="zoom"
              type="range"
              min="0.25"
              max="2"
              step="0.05"
            >
          </label>
        </div>

        <div class="export-options">
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="removeExif"
              @change="toggleRemoveExif"
            >
            {{ t('editor.ext.imagesAdv.export.removeExif') }}
          </label>

          <button
            type="button"
            class="tool-btn primary"
            @click="exportToWebP"
          >
            {{ t('editor.ext.imagesAdv.export.webp') }}
          </button>
        </div>
      </footer>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import {
  onMounted,
  ref,
  computed,
  watch,
} from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

import type {
  ImagesAdvAttributes,
  RasterAdjustments,
  RasterFiltersState,
  RasterLayer,
} from './types'

const props = defineProps<NodeViewProps>()

// Placeholder i18n (F2.x se integra con el sistema global)
const t = (key: string) => key

type ToolId =
  | 'brush'
  | 'eraser'
  | 'clone'
  | 'eyedropper'
  | 'selectRect'
  | 'lasso'
  | 'text'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

const currentTool = ref<ToolId>('brush')
const isPointerDown = ref(false)
const isDrawingStroke = ref(false)

const lastX = ref(0)
const lastY = ref(0)

const brushSize = ref(16)
const brushOpacity = ref(0.8)
const currentColor = ref<string | null>('#000000')

// Clonado
const cloneSourceX = ref<number | null>(null)
const cloneSourceY = ref<number | null>(null)

// Selección
const selectionStartX = ref(0)
const selectionStartY = ref(0)
const selectionRectLocal = ref<ImagesAdvAttributes['selectionRect']>(null)

// Zoom de visualización
const zoom = ref(1)

const attrs = computed<ImagesAdvAttributes>(() => props.node.attrs as ImagesAdvAttributes)

const adjustments = computed<RasterAdjustments>(() => attrs.value.adjustments)
const filters = computed<RasterFiltersState>(() => attrs.value.filters)
const removeExif = computed<boolean>(() => Boolean(attrs.value.removeExif))
const layers = computed<RasterLayer[]>(() => attrs.value.layers || [])
const activeLayerId = computed<string | null>(() => attrs.value.activeLayerId || null)

const canvasStyle = computed(() => {
  const a = adjustments.value
  const f = filters.value

  const brightness = a.brightness || 1
  const contrast = a.contrast || 1
  const saturation = a.saturation || 1
  const blur = f.blur || 0

  const filterParts = [
    `brightness(${brightness})`,
    `contrast(${contrast})`,
    `saturate(${saturation})`,
  ]

  if (blur > 0) {
    filterParts.push(`blur(${blur}px)`)
  }

  if (f.preset === 'bw') {
    filterParts.push('grayscale(1)')
  } else if (f.preset === 'sepia') {
    filterParts.push('sepia(0.9)')
  }

  return {
    filter: filterParts.join(' '),
    maxWidth: '100%',
    display: 'block',
  }
})

const canvasZoomStyle = computed(() => ({
  transform: `scale(${zoom.value})`,
  transformOrigin: 'center center',
}))

const selectionRect = computed(() => selectionRectLocal.value)

const selectionStyle = computed(() => {
  if (!selectionRectLocal.value || !canvasRef.value) return {}
  const r = selectionRectLocal.value

  return {
    left: `${r.x}px`,
    top: `${r.y}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
  }
})

function setTool(tool: ToolId) {
  currentTool.value = tool
}

/**
 * Inicializa el canvas con la imagen actual (src).
 */
function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const imageSrc = attrs.value.src
  if (!imageSrc) return

  const image = new Image()
  image.onload = () => {
    const maxWidth = 800
    const scale =
      image.width > maxWidth ? maxWidth / image.width : 1

    const w = image.width * scale
    const h = image.height * scale

    canvas.width = w
    canvas.height = h

    const context = canvas.getContext('2d')
    if (!context) return

    ctx.value = context
    context.clearRect(0, 0, w, h)
    context.drawImage(image, 0, 0, w, h)
  }
  image.onerror = () => {
    // noop
  }
  image.src = imageSrc
}

function canvasCoordsFromEvent(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) / zoom.value,
    y: (e.clientY - rect.top) / zoom.value,
  }
}

function onPointerDown(e: MouseEvent) {
  const coords = canvasCoordsFromEvent(e)
  if (!coords || !ctx.value || !canvasRef.value) return

  isPointerDown.value = true

  if (currentTool.value === 'selectRect' || currentTool.value === 'lasso') {
    selectionStartX.value = coords.x
    selectionStartY.value = coords.y
    selectionRectLocal.value = {
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
    }
    return
  }

  if (currentTool.value === 'text') {
    const text = window.prompt(t('editor.ext.imagesAdv.tool.text'))
    if (text && ctx.value) {
      ctx.value.save()
      ctx.value.font = '16px sans-serif'
      ctx.value.fillStyle = currentColor.value || '#000000'
      ctx.value.textBaseline = 'top'
      ctx.value.fillText(text, coords.x, coords.y)
      ctx.value.restore()
      persistCanvasToAttrs()
    }
    return
  }

  if (currentTool.value === 'eyedropper') {
    const color = sampleColorAt(coords.x, coords.y)
    if (color) {
      currentColor.value = color
    }
    return
  }

  if (currentTool.value === 'clone' && e.altKey) {
    // Alt+clic define el origen del clonado
    cloneSourceX.value = coords.x
    cloneSourceY.value = coords.y
    return
  }

  if (
    currentTool.value === 'brush' ||
    currentTool.value === 'eraser' ||
    currentTool.value === 'clone'
  ) {
    isDrawingStroke.value = true
    lastX.value = coords.x
    lastY.value = coords.y
  }
}

function onPointerMove(e: MouseEvent) {
  if (!isPointerDown.value || !canvasRef.value) return

  const coords = canvasCoordsFromEvent(e)
  if (!coords || !ctx.value) return

  const context = ctx.value

  if (
    currentTool.value === 'selectRect' ||
    currentTool.value === 'lasso'
  ) {
    const x = Math.min(selectionStartX.value, coords.x)
    const y = Math.min(selectionStartY.value, coords.y)
    const w = Math.abs(coords.x - selectionStartX.value)
    const h = Math.abs(coords.y - selectionStartY.value)

    selectionRectLocal.value = {
      x,
      y,
      width: w,
      height: h,
    }
    return
  }

  if (!isDrawingStroke.value) return

  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.lineWidth = brushSize.value

  if (currentTool.value === 'brush') {
    context.globalCompositeOperation = 'source-over'
    context.globalAlpha = brushOpacity.value
    context.strokeStyle = currentColor.value || '#000000'
    context.beginPath()
    context.moveTo(lastX.value, lastY.value)
    context.lineTo(coords.x, coords.y)
    context.stroke()
  } else if (currentTool.value === 'eraser') {
    context.globalCompositeOperation = 'destination-out'
    context.globalAlpha = 1
    context.strokeStyle = '#ffffff'
    context.beginPath()
    context.moveTo(lastX.value, lastY.value)
    context.lineTo(coords.x, coords.y)
    context.stroke()
  } else if (
    currentTool.value === 'clone' &&
    cloneSourceX.value != null &&
    cloneSourceY.value != null
  ) {
    const size = brushSize.value * 2
    const sx = cloneSourceX.value + (coords.x - lastX.value) - size / 2
    const sy = cloneSourceY.value + (coords.y - lastY.value) - size / 2
    const dx = coords.x - size / 2
    const dy = coords.y - size / 2

    const imgData = context.getImageData(sx, sy, size, size)
    context.putImageData(imgData, dx, dy)
  }

  lastX.value = coords.x
  lastY.value = coords.y
}

function onPointerUp() {
  if (!isPointerDown.value) return
  isPointerDown.value = false

  if (
    currentTool.value === 'selectRect' ||
    currentTool.value === 'lasso'
  ) {
    const type = currentTool.value === 'selectRect' ? 'rect' : 'lasso'
    props.updateAttributes({
      selectionType: type,
      selectionRect: selectionRectLocal.value,
    })
  }

  if (isDrawingStroke.value) {
    isDrawingStroke.value = false
    persistCanvasToAttrs()
  }
}

/**
 * Guarda el canvas como dataURL (WebP) en attrs.src
 */
function persistCanvasToAttrs() {
  const canvas = canvasRef.value
  if (!canvas) return

  const dataUrl = canvas.toDataURL('image/webp', 0.9)

  props.updateAttributes({
    src: dataUrl,
    format: 'webp',
  })
}

function onAdjustChange(
  key: keyof RasterAdjustments,
  event: Event,
) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)

  const next: RasterAdjustments = {
    ...adjustments.value,
    [key]: value,
  }

  props.updateAttributes({
    adjustments: next,
  })
}

function onFilterChange(
  key: keyof RasterFiltersState,
  event: Event,
) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)

  const next: RasterFiltersState = {
    ...filters.value,
    [key]: value,
  }

  props.updateAttributes({
    filters: next,
  })
}

function applyPreset(preset: RasterFiltersState['preset']) {
  const baseAdjustments: RasterAdjustments = {
    ...adjustments.value,
  }
  const baseFilters: RasterFiltersState = {
    ...filters.value,
    preset,
  }

  if (preset === 'bw') {
    baseAdjustments.saturation = 0
  } else if (preset === 'sepia') {
    baseAdjustments.saturation = 0.8
  } else if (preset === 'auto') {
    baseAdjustments.brightness = 1.05
    baseAdjustments.contrast = 1.1
    baseAdjustments.saturation = 1.05
    baseFilters.sharpen = Math.max(baseFilters.sharpen, 0.3)
  }

  props.updateAttributes({
    adjustments: baseAdjustments,
    filters: baseFilters,
  })
}

function resetAdjustments() {
  props.updateAttributes({
    adjustments: {
      brightness: 1,
      contrast: 1,
      exposure: 0,
      temperature: 0,
      saturation: 1,
    },
    filters: {
      blur: 0,
      sharpen: 0,
      grain: 0,
      preset: 'none',
    },
  })
}

function toggleRemoveExif() {
  props.updateAttributes({
    removeExif: !removeExif.value,
  })
}

function exportToWebP() {
  const canvas = canvasRef.value
  if (!canvas) return

  const dataUrl = canvas.toDataURL('image/webp', 0.85)

  props.updateAttributes({
    src: dataUrl,
    format: 'webp',
  })
}

// --- Transformaciones: rotar / voltear / recortar ---

function cloneCurrentCanvas() {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context) return null

  const tmp = document.createElement('canvas')
  tmp.width = canvas.width
  tmp.height = canvas.height
  const tctx = tmp.getContext('2d')
  if (!tctx) return null
  tctx.drawImage(canvas, 0, 0)
  return { tmp, tctx }
}

function rotateCanvas(direction: 'left' | 'right') {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context) return

  const cloned = cloneCurrentCanvas()
  if (!cloned) return
  const { tmp } = cloned

  const oldW = canvas.width
  const oldH = canvas.height

  const newW = oldH
  const newH = oldW

  canvas.width = newW
  canvas.height = newH

  const c = canvas.getContext('2d')
  if (!c) return
  ctx.value = c

  c.save()
  c.clearRect(0, 0, newW, newH)

  if (direction === 'right') {
    c.translate(newW, 0)
    c.rotate(Math.PI / 2)
  } else {
    c.translate(0, newH)
    c.rotate(-Math.PI / 2)
  }

  c.drawImage(tmp, 0, 0)
  c.restore()

  selectionRectLocal.value = null
  props.updateAttributes({
    selectionRect: null,
    selectionType: null,
  })

  persistCanvasToAttrs()
}

function flipCanvas(orientation: 'horizontal' | 'vertical') {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context) return

  const cloned = cloneCurrentCanvas()
  if (!cloned) return
  const { tmp } = cloned

  const w = canvas.width
  const h = canvas.height

  const c = canvas.getContext('2d')
  if (!c) return
  ctx.value = c

  c.save()
  c.clearRect(0, 0, w, h)

  if (orientation === 'horizontal') {
    c.translate(w, 0)
    c.scale(-1, 1)
  } else {
    c.translate(0, h)
    c.scale(1, -1)
  }

  c.drawImage(tmp, 0, 0)
  c.restore()

  persistCanvasToAttrs()
}

function cropToSelection() {
  const canvas = canvasRef.value
  const context = ctx.value
  const rect = selectionRectLocal.value
  if (!canvas || !context || !rect) return
  if (rect.width <= 0 || rect.height <= 0) return

  const tmp = document.createElement('canvas')
  tmp.width = rect.width
  tmp.height = rect.height
  const tctx = tmp.getContext('2d')
  if (!tctx) return

  tctx.drawImage(
    canvas,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  )

  canvas.width = rect.width
  canvas.height = rect.height

  const c = canvas.getContext('2d')
  if (!c) return
  ctx.value = c

  c.clearRect(0, 0, rect.width, rect.height)
  c.drawImage(tmp, 0, 0)

  selectionRectLocal.value = null
  props.updateAttributes({
    selectionRect: null,
    selectionType: null,
  })

  persistCanvasToAttrs()
}

// --- Capas ---

function setActiveLayer(id: string) {
  props.updateAttributes({
    activeLayerId: id,
  })
}

function toggleLayerVisibility(id: string) {
  const next = layers.value.map((layer) =>
    layer.id === id
      ? { ...layer, visible: !layer.visible }
      : layer,
  )

  props.updateAttributes({
    layers: next,
  })
}

function renameLayer(id: string, name: string) {
  const next = layers.value.map((layer) =>
    layer.id === id ? { ...layer, name } : layer,
  )
  props.updateAttributes({ layers: next })
}

function changeLayerOpacity(id: string, opacity: number) {
  const next = layers.value.map((layer) =>
    layer.id === id ? { ...layer, opacity } : layer,
  )
  props.updateAttributes({ layers: next })
}

function addLayer() {
  const newLayer: RasterLayer = {
    id: `layer-${Date.now()}`,
    name: `Capa ${layers.value.length + 1}`,
    visible: true,
    opacity: 1,
    blendMode: 'normal',
  }

  props.updateAttributes({
    layers: [...layers.value, newLayer],
    activeLayerId: newLayer.id,
  })
}

function removeActiveLayer() {
  if (!activeLayerId.value || layers.value.length <= 1) return

  const filtered = layers.value.filter(
    l => l.id !== activeLayerId.value,
  )
  const nextActive =
    filtered[filtered.length - 1]?.id ?? 'base'

  props.updateAttributes({
    layers: filtered,
    activeLayerId: nextActive,
  })
}

// --- Utilidades ---

function sampleColorAt(x: number, y: number): string | null {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context) return null

  const data = context.getImageData(x, y, 1, 1).data
  const [r, g, b, a] = data
  if (a === 0) return null
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`
}

onMounted(() => {
  initCanvas()
})

watch(
  () => attrs.value.src,
  () => {
    initCanvas()
  },
)
</script>

<style scoped>
.images-adv-node-wrapper {
  display: block;
  margin: 1rem 0;
}

.images-adv-node {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.images-adv-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tools-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: 0.75rem;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 999px;
  padding: 2px 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 11px;
  cursor: pointer;
  color: #4b3f72;
  font-weight: 500;
}

.tool-btn span {
  white-space: nowrap;
}

.tool-btn.active {
  background: #ede9fe;
  border-color: #a855f7;
}

.tool-btn.subtle {
  font-size: 11px;
  padding-inline: 10px;
}

.tool-btn.primary {
  background: #4b3f72;
  border-color: #4b3f72;
  color: #ffffff;
}

.tool-btn.primary:hover {
  background: #433266;
}

.color-swatch {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.slider-label {
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slider-label input[type='range'] {
  width: 120px;
}

.images-adv-body {
  display: flex;
  min-height: 260px;
}

/* Capas */
.layers-panel {
  width: 180px;
  border-right: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
}

.layers-header {
  padding: 0.4rem 0.5rem;
  font-size: 11px;
  font-weight: 600;
  color: #4b3f72;
  border-bottom: 1px solid #e5e7eb;
}

.layers-list {
  flex: 1;
  margin: 0;
  padding: 0.25rem 0.25rem;
  list-style: none;
  overflow: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
}

.layer-item.active {
  background: #ede9fe;
}

.layer-visibility {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.layer-name {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 11px;
  padding: 1px 4px;
}

.layer-opacity {
  width: 60px;
}

.layers-footer {
  padding: 0.3rem 0.4rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 4px;
}

.tool-btn.small {
  padding: 0 6px;
  font-size: 11px;
}

/* Canvas + zoom */
.images-adv-canvas-outer {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f3f4f6;
}

.images-adv-canvas-container {
  position: relative;
  padding: 0.75rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.images-adv-canvas {
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #e5e7eb;
}

/* Selección */
.selection-rect {
  position: absolute;
  border: 1px dashed #4b3f72;
  pointer-events: none;
}

/* Footer */
.images-adv-footer {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.adjustments {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.export-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 11px;
}
</style>
```


### `packages/editor-ext-images-adv/src/index.ts`

```ts
// packages/editor-ext-images-adv/src/index.ts

import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'

import ImagesAdvNodeView from './ImagesAdvNodeView.vue'
import {
  createDefaultAdjustments,
  createDefaultFilters,
  createDefaultLayer,
  type ImagesAdvAttributes,
  type RasterFormat,
} from './types'

export interface ImagesAdvOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imagesAdv: {
      /**
       * Inserta un nodo de imagen avanzada.
       */
      setImagesAdv: (attrs: Partial<ImagesAdvAttributes>) => ReturnType

      /**
       * Convierte la imagen seleccionada (nodo `image`) en `imagesAdv`.
       */
      convertImageToImagesAdv: () => ReturnType
    }
  }
}

export const ImagesAdvExtension = Node.create<ImagesAdvOptions>({
  name: 'imagesAdv',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'disertare-images-adv',
      },
    }
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      title: { default: '' },
      format: { default: 'webp' as RasterFormat },
        width: { default: null },
        height: { default: null },

        layers: {
          default: () => [createDefaultLayer()],
        },
        activeLayerId: {
          default: 'base',
        },

        adjustments: {
          default: () => createDefaultAdjustments(),
        },
        filters: {
          default: () => createDefaultFilters(),
        },

        selectionType: {
          default: null,
        },
        selectionRect: {
          default: null,
        },

        removeExif: {
          default: true,
        },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-images-adv]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { 'data-images-adv': 'true' },
      ),
      ['img', { src: HTMLAttributes.src || '', alt: HTMLAttributes.alt || '' }],
    ]
  },

  addNodeView(): NodeViewRenderer {
    return VueNodeViewRenderer(ImagesAdvNodeView)
  },

  addCommands() {
    return {
      setImagesAdv:
      attrs =>
      ({ commands }) => {
        const defaults: ImagesAdvAttributes = {
          src: attrs.src ?? null,
          alt: attrs.alt ?? '',
          title: attrs.title ?? '',
          format: attrs.format ?? 'webp',
            width: attrs.width ?? null,
            height: attrs.height ?? null,
            layers: attrs.layers ?? [createDefaultLayer()],
                                                                activeLayerId: attrs.activeLayerId ?? 'base',
                                                                adjustments: attrs.adjustments ?? createDefaultAdjustments(),
                                                                filters: attrs.filters ?? createDefaultFilters(),
                                                                selectionType: attrs.selectionType ?? null,
                                                                selectionRect: attrs.selectionRect ?? null,
                                                                removeExif: attrs.removeExif ?? true,
        }

        return commands.insertContent({
          type: 'imagesAdv',
          attrs: defaults,
        })
      },

      convertImageToImagesAdv:
      () =>
      ({ state, tr, dispatch }) => {
        const { selection, schema } = state
        const imageType = schema.nodes.image
        const advType = schema.nodes.imagesAdv

        if (!imageType || !advType) return false
          const node = selection.node
          if (!node || node.type !== imageType) return false

            const pos = selection.$from.pos
            const attrs = node.attrs as any

            const advAttrs: Partial<ImagesAdvAttributes> = {
              src: attrs.src ?? null,
              alt: attrs.alt ?? '',
              title: attrs.title ?? '',
              width:
              typeof attrs.width === 'string'
? parseInt(attrs.width, 10) || null
: attrs.width ?? null,
height:
typeof attrs.height === 'string'
? parseInt(attrs.height, 10) || null
: attrs.height ?? null,
            }

            const newNode = advType.create(advAttrs)

            tr = tr.setNodeMarkup(pos, advType, newNode.attrs)

            if (dispatch) {
              dispatch(tr)
            }
            return true
      },
    }
  },
})
```


### `packages/editor-ext-images-adv/src/locales/en.json`

```json
{
  "editor.ext.imagesAdv.edit_image_advanced": "Edit image (advanced raster)",
  "editor.ext.imagesAdv.tool.brush": "Brush",
  "editor.ext.imagesAdv.tool.eraser": "Eraser",
  "editor.ext.imagesAdv.tool.eyedropper": "Eyedropper",
  "editor.ext.imagesAdv.tool.selectRect": "Rect selection",
  "editor.ext.imagesAdv.tool.lasso": "Lasso",
  "editor.ext.imagesAdv.tool.text": "Text",
  "editor.ext.imagesAdv.brush.size": "Size",
  "editor.ext.imagesAdv.brush.opacity": "Opacity",
  "editor.ext.imagesAdv.adjust.brightness": "Brightness",
  "editor.ext.imagesAdv.adjust.contrast": "Contrast",
  "editor.ext.imagesAdv.adjust.saturation": "Saturation",
  "editor.ext.imagesAdv.filter.blur": "Blur",
  "editor.ext.imagesAdv.action.autoEnhance": "Auto enhance",
  "editor.ext.imagesAdv.action.reset": "Reset",
  "editor.ext.imagesAdv.export.removeExif": "Remove EXIF metadata when exporting",
  "editor.ext.imagesAdv.export.webp": "Export to WebP"
}
```


### `packages/editor-ext-images-adv/src/locales/es.json`

```json
{
  "editor.ext.imagesAdv.edit_image_advanced": "Editar imagen (raster avanzado)",
  "editor.ext.imagesAdv.tool.brush": "Pincel",
  "editor.ext.imagesAdv.tool.eraser": "Borrador",
  "editor.ext.imagesAdv.tool.eyedropper": "Cuentagotas",
  "editor.ext.imagesAdv.tool.selectRect": "Selección rectangular",
  "editor.ext.imagesAdv.tool.lasso": "Lazo",
  "editor.ext.imagesAdv.tool.text": "Texto",
  "editor.ext.imagesAdv.brush.size": "Tamaño",
  "editor.ext.imagesAdv.brush.opacity": "Opacidad",
  "editor.ext.imagesAdv.adjust.brightness": "Brillo",
  "editor.ext.imagesAdv.adjust.contrast": "Contraste",
  "editor.ext.imagesAdv.adjust.saturation": "Saturación",
  "editor.ext.imagesAdv.filter.blur": "Desenfoque",
  "editor.ext.imagesAdv.action.autoEnhance": "Automejorar",
  "editor.ext.imagesAdv.action.reset": "Restablecer",
  "editor.ext.imagesAdv.export.removeExif": "Remover metadata EXIF al exportar",
  "editor.ext.imagesAdv.export.webp": "Exportar a WebP"
}
```


### `packages/editor-ext-images-adv/src/types.ts`

```ts
// packages/editor-ext-images-adv/src/types.ts

export type RasterFormat = 'webp' | 'avif' | 'png' | 'jpeg'

export type RasterBlendMode =
| 'normal'
| 'multiply'
| 'screen'
| 'overlay'

export interface RasterLayer {
  id: string
  name: string
  visible: boolean
  opacity: number // 0–1
  blendMode: RasterBlendMode
}

export interface RasterAdjustments {
  brightness: number // 0–2 (1 = normal)
  contrast: number // 0–2 (1 = normal)
  exposure: number // EV, -2 – +2 aprox
  temperature: number // -1 (frío) – +1 (cálido)
  saturation: number // 0–2 (1 = normal)
}

export type RasterFilterPreset = 'none' | 'bw' | 'sepia' | 'auto'

export interface RasterFiltersState {
  blur: number // px
  sharpen: number // 0–1
  grain: number // 0–1
  preset: RasterFilterPreset
}

export type RasterSelectionType = 'rect' | 'lasso' | null

export interface RasterSelectionRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ImagesAdvAttributes {
  src: string | null
  alt?: string | null
  title?: string | null
  format: RasterFormat
    width: number | null
    height: number | null

    layers: RasterLayer[]
    activeLayerId: string | null

    adjustments: RasterAdjustments
    filters: RasterFiltersState

    selectionType: RasterSelectionType
    selectionRect: RasterSelectionRect | null

    removeExif: boolean
}

export function createDefaultLayer(): RasterLayer {
  return {
    id: 'base',
    name: 'Capa base',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
  }
}

export function createDefaultAdjustments(): RasterAdjustments {
  return {
    brightness: 1,
    contrast: 1,
    exposure: 0,
    temperature: 0,
    saturation: 1,
  }
}

export function createDefaultFilters(): RasterFiltersState {
  return {
    blur: 0,
    sharpen: 0,
    grain: 0,
    preset: 'none',
  }
}
```


## Paquete `editor-ext-images`


### `packages/editor-ext-images/package.json`

```json
{
  "name": "@disertare/editor-ext-images",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  }
}
```


### `packages/editor-ext-images/src/ImageNodeView.ts`

```ts
// packages/editor-ext-images/src/ImageNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageNodeViewComponent from './ImageNodeView.vue'

export const ImageNodeView: NodeViewRenderer =
VueNodeViewRenderer(ImageNodeViewComponent)
```


### `packages/editor-ext-images/src/ImageNodeView.vue`

```vue
<!-- packages/editor-ext-images/src/ImageNodeView.vue -->
<template>
  <NodeViewWrapper
    class="image-node-wrapper"
    :aria-label="t('editor.ext.images.edit_image')"
  >
    <div
      ref="imageContainer"
      class="image-node"
      :class="{ 'image-inline': inline, 'image-block': !inline }"
      :tabindex="0"
      role="button"
      @click="selectImage"
      @keydown.enter="openEditor"
      @keydown.space.prevent="openEditor"
    >
      <img
        ref="imgRef"
        :src="src"
        :alt="alt"
        :title="title"
        :style="imageStyle"
        class="image-content"
        @load="onLoad"
        @error="onError"
      />

      <div v-if="loading" class="image-placeholder">Cargando…</div>
      <div v-if="error" class="image-error">Error al cargar la imagen</div>

      <div v-if="selected" class="image-controls">
        <button
          class="control-btn"
          :aria-label="t('editor.ext.images.resize')"
          @mousedown="startResize"
        >
          ↖
        </button>
        <button
          class="control-btn rotate"
          :aria-label="t('editor.ext.images.rotate')"
          @click="rotate"
        >
          ↻
        </button>
        <button
          class="control-btn flip"
          :aria-label="t('editor.ext.images.flip_x')"
          @click="toggleFlipX"
        >
          ↔
        </button>
        <button
          class="control-btn flip"
          :aria-label="t('editor.ext.images.flip_y')"
          @click="toggleFlipY"
        >
          ↕
        </button>
        <button
          class="control-btn crop"
          :aria-label="t('editor.ext.images.crop')"
          @click="openCrop"
        >
          ✂
        </button>

        <!-- F2.15: editor raster avanzado -->
        <button
          class="control-btn advanced"
          :aria-label="t('editor.ext.images.open_advanced')"
          @click.stop="openAdvancedEditor"
        >
          ★
        </button>
      </div>

      <!-- 🔥 F2.19: indicador visual de contenedores -->
      <div
        v-if="hasContainers"
        class="image-container-indicator"
      >
        Contenedores activos
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

// --- NUEVO: resourceId (opcional, no rompe nada)
const resourceId = computed(() => props.node.attrs.resourceId ?? null)

// En F2.19 lo asignará automáticamente el editor si no existe
if (!resourceId.value && props.updateAttributes) {
  props.updateAttributes({
    resourceId: `img-${Math.random().toString(36).slice(2, 10)}`,
  })
}

// --- Resto de los attrs
const imageContainer = ref<HTMLDivElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)

const src = computed(() => props.node.attrs.src)
const alt = computed(() => props.node.attrs.alt || '')
const title = computed(() => props.node.attrs.title || '')
const width = computed(() => props.node.attrs.width || 'auto')
const height = computed(() => props.node.attrs.height || 'auto')
const rotation = computed(() => Number(props.node.attrs.rotation) || 0)
const isFlippedX = computed(() => Boolean(props.node.attrs.flipX))
const isFlippedY = computed(() => Boolean(props.node.attrs.flipY))
const inline = computed(() => props.node.type.spec.inline)

const loading = ref(true)
const error = ref(false)
const selected = ref(false)

// Placeholder i18n
const t = (key: string) => key

const imageStyle = computed(() => ({
  width: width.value,
  height: height.value,
  transform: `rotate(${rotation.value}deg) scaleX(${isFlippedX.value ? -1 : 1}) scaleY(${isFlippedY.value ? -1 : 1})`,
  transformOrigin: 'center',
  display: inline.value ? 'inline-block' : 'block',
}))

/* --------------------------------
 * 🔥 F2.19: detectar contenedores activos
 * El frontend revisará section.layout.containers.filter(c => c.resourceId === resourceId)
 * y activará un comando updateAttributes({ hasContainers: true })
 * -------------------------------- */
const hasContainers = computed(() => Boolean(props.node.attrs.hasContainers))

const onLoad = () => {
  loading.value = false
  error.value = false
}

const onError = () => {
  loading.value = false
  error.value = true
}

const selectImage = () => {
  selected.value = true
  props.editor.commands.setNodeSelection(props.getPos() as number)
}

const openEditor = () => {
  selectImage()
}

const rotate = () => {
  const newRotation = (rotation.value + 90) % 360
  props.updateAttributes({ rotation: newRotation })
}

const toggleFlipX = () => {
  props.updateAttributes({ flipX: !isFlippedX.value })
}

const toggleFlipY = () => {
  props.updateAttributes({ flipY: !isFlippedY.value })
}

const startResize = (e: MouseEvent) => {
  e.preventDefault()
  if (!imgRef.value) return

  const startX = e.clientX
  const startY = e.clientY
  const startWidth = imgRef.value.offsetWidth
  const startHeight = imgRef.value.offsetHeight

  const onMouseMove = (moveEvent: MouseEvent) => {
    const dx = moveEvent.clientX - startX
    const dy = moveEvent.clientY - startY

    const newWidth = Math.max(50, startWidth + dx)
    const newHeight = Math.max(50, startHeight + dy)

    props.updateAttributes({
      width: `${newWidth}px`,
      height: `${newHeight}px`,
    })
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const openCrop = () => {
  console.log('[editor-ext-images] crop not implemented (F2.x)')
}

const openAdvancedEditor = () => {
  const commands: any = props.editor.commands
  if (commands && typeof commands.convertImageToImagesAdv === 'function') {
    commands.convertImageToImagesAdv()
  }
}

const handleClickOutside = (e: MouseEvent) => {
  const el = imageContainer.value
  if (el && !el.contains(e.target as Node)) {
    selected.value = false
  }
}

onMounted(() => {
  if (imgRef.value?.complete) {
    loading.value = false
  }
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Estilos previos (intactos) */

.image-container-indicator {
  position: absolute;
  top: -22px;
  left: 0;
  background: #6a5af9dd;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
```


### `packages/editor-ext-images/src/index.ts`

```ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { ImageNodeView } from './ImageNodeView'

export interface ImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /**
       * Inserta una imagen con URL, archivo o base64
       */
      setImage: (attrs: { src: string; alt?: string; title?: string }) => ReturnType
    }
  }
}

export const Image = Node.create<ImageOptions>({
  name: 'image',
  selectable: true,
  draggable: true,
  allowGapCursor: true,
  atom: true,

  addOptions() {
    return {
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? 'inline' : 'block'
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          return { src: attributes.src }
        },
      },
      alt: {
        default: '',
        parseHTML: element => element.getAttribute('alt'),
        renderHTML: attributes => {
          return { alt: attributes.alt }
        },
      },
      title: {
        default: '',
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => {
          return { title: attributes.title }
        },
      },
      width: {
        default: 'auto',
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          return { width: attributes.width }
        },
      },
      height: {
        default: 'auto',
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          return { height: attributes.height }
        },
      },
      rotation: {
        default: 0,
        parseHTML: element => element.getAttribute('data-rotation') || '0',
        renderHTML: attributes => {
          return { 'data-rotation': attributes.rotation }
        },
      },
      flipX: {
        default: false,
        parseHTML: element => element.hasAttribute('data-flip-x'),
        renderHTML: attributes => {
          return { 'data-flip-x': attributes.flipX ? '' : null }
        },
      },
      flipY: {
        default: false,
        parseHTML: element => element.hasAttribute('data-flip-y'),
        renderHTML: attributes => {
          return { 'data-flip-y': attributes.flipY ? '' : null }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setImage:
        attrs =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
    }
  },

  addNodeView() {
    return ImageNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('imagePasteHandler'),
        props: {
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items || [])
            const imageItem = items.find(item => item.type.startsWith('image/'))
            if (!imageItem) return false

            const file = imageItem.getAsFile()
            if (!file) return false

            const reader = new FileReader()
            reader.onload = () => {
              const { schema, dispatch } = view.state
              const node = schema.nodes.image.create({
                src: reader.result as string,
                alt: file.name,
              })
              const transaction = view.state.tr.replaceSelectionWith(node)
              dispatch(transaction)
              event.preventDefault()
            }
            reader.readAsDataURL(file)
            return true
          },
        },
      }),
    ]
  },
})
```


## Paquete `editor-ext-katex`


### `packages/editor-ext-katex/package.json`

```json
{
  "name": "@disertare/editor-ext-katex",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  },
  "dependencies": {
    "katex": "^0.16.11"
  }
}
```


### `packages/editor-ext-katex/src/index.ts`

```ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { KatexNodeView } from './KatexNodeView'

export const Katex = Node.create({
  name: 'katex',
  content: 'text*',
  group: 'block',
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      content: {
        default: '',
          parseHTML: element => element.getAttribute('data-content'),
                                 renderHTML: attributes => {
                                   return { 'data-content': attributes.content }
                                 },
      },
      inline: {
        default: false,
          parseHTML: element => element.hasAttribute('data-inline'),
                                 renderHTML: attributes => {
                                   return { 'data-inline': attributes.inline ? '' : null }
                                 },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-katex]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-katex': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setKatex:
      attrs =>
      ({ chain }) => {
        return chain()
        .insertContent({
          type: this.name,
          attrs: {
            content: attrs.content || '',
            inline: attrs.inline || false,
          },
        })
        .run()
      },
    }
  },

  addNodeView() {
    return KatexNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('katexDropHandler'),
                 props: {
                   handleDOMEvents: {
                     drop(view, event) {
                       const files = Array.from(event.dataTransfer?.files || [])
                       const katexFile = files.find(f => f.name.toLowerCase().endsWith('.tex'))
                       if (!katexFile) return false

                         event.preventDefault()
                         const reader = new FileReader()
                         reader.onload = () => {
                           const content = reader.result as string
                           const { schema, dispatch } = view.state

                           const node = schema.nodes.katex.create({
                             content,
                             inline: false,
                           })

                           const transaction = view.state.tr.replaceSelectionWith(node)
                           dispatch(transaction)
                         }
                         reader.readAsText(katexFile)
                         return true
                     },
                   },
                 },
      }),
    ]
  },
})
```


### `packages/editor-ext-katex/src/KatexNodeView.ts`

```ts
// packages/editor-ext-katex/src/KatexNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import KatexNodeViewComponent from './KatexNodeView.vue'

export const KatexNodeView: NodeViewRenderer =
VueNodeViewRenderer(KatexNodeViewComponent)
```


### `packages/editor-ext-katex/src/KatexNodeView.vue`

```vue
<!-- packages/editor-ext-katex/src/KatexNodeView.vue -->
<template>
  <NodeViewWrapper
    class="katex-node"
    :class="{ 'katex-inline': inline, 'katex-display': !inline }"
    :tabindex="0"
    :aria-label="t('editor.ext.katex.edit_formula')"
    role="button"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Siempre se muestra KaTeX -->
    <div ref="renderedFormula" class="katex-rendered"></div>

    <!-- El input solo aparece en modo edición, debajo de la fórmula -->
    <input
      v-if="editing"
      ref="inputRef"
      v-model="formula"
      class="katex-input"
      :aria-label="t('editor.ext.katex.input_formula')"
      spellcheck="false"
      @blur="handleSubmit"
      @keydown.enter.stop.prevent="handleSubmit"
      @keydown.escape.stop.prevent="handleCancel"
      @keydown.tab.stop.prevent
    />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/vue-3'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = defineProps<NodeViewProps>()

const renderedFormula = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// inline depende de los attrs del nodo (por si cambian desde comandos)
const inline = computed<boolean>(() => props.node.attrs.inline ?? true)

// fórmula local inicializada desde attrs
const formula = ref<string>(
  typeof props.node.attrs.content === 'string'
    ? props.node.attrs.content
    : '\\sqrt{a^2 + b^2}',
)
const editing = ref(false)

// Placeholder para i18n
const t = (key: string) => key

function renderFormula() {
  if (!renderedFormula.value) return

  try {
    katex.render(formula.value || '', renderedFormula.value, {
      throwOnError: false,
      displayMode: !inline.value,
    })
    renderedFormula.value.style.color = 'inherit'
  } catch (error) {
    console.error('[KatexNodeView] render error:', error)
    renderedFormula.value.textContent = formula.value || 'Invalid formula'
    renderedFormula.value.style.color = 'red'
  }
}

async function handleClick() {
  editing.value = true
  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
}

function handleSubmit() {
  editing.value = false
  props.updateAttributes({
    content: formula.value,
    inline: inline.value,
  })
  renderFormula()
}

function handleCancel() {
  editing.value = false
  // restaurar a lo que tenga el nodo actualmente
  formula.value =
    typeof props.node.attrs.content === 'string'
      ? props.node.attrs.content
      : formula.value
  renderFormula()
}

// Render inicial
onMounted(() => {
  renderFormula()
})

// Si el nodo cambia desde fuera (otro comando, colaborador, etc.)
watch(
  () => props.node.attrs.content,
  newContent => {
    if (!editing.value && typeof newContent === 'string') {
      formula.value = newContent
      renderFormula()
    }
  },
)

// Si alguien cambia inline/display desde un comando
watch(
  () => inline.value,
  () => {
    renderFormula()
  },
)
</script>

<style scoped>
.katex-node {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.katex-rendered {
  min-width: 40px;
  min-height: 24px;
  padding: 4px;
}

.katex-input {
  margin-top: 4px;
  width: 100%;
  padding: 4px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
}

.katex-node:focus,
.katex-node:hover {
  outline: 2px solid #6a5af944;
}

.katex-inline {
  display: inline-block;
  vertical-align: middle;
}

.katex-display {
  display: block;
  text-align: center;
  margin: 1em 0;
}
</style>
```


## Paquete `editor-ext-mermaid`


### `packages/editor-ext-mermaid/package.json`

```json
{
  "name": "@disertare/editor-ext-mermaid",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  },
  "dependencies": {
    "mermaid": "^10.9.1"
  }
}
```


### `packages/editor-ext-mermaid/src/index.ts`

```ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { MermaidNodeView } from './MermaidNodeView'

export const Mermaid = Node.create({
  name: 'mermaid',
  content: 'text*',
  group: 'block',
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      content: {
        default: '',
          parseHTML: element => element.getAttribute('data-content'),
                                   renderHTML: attributes => {
                                     return { 'data-content': attributes.content }
                                   },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-mermaid]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-mermaid': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setMermaid:
      attrs =>
      ({ chain }) => {
        return chain()
        .insertContent({
          type: this.name,
          attrs: {
            content: attrs.content || '',
          },
        })
        .run()
      },
    }
  },

  addNodeView() {
    return MermaidNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mermaidDropHandler'),
                 props: {
                   handleDOMEvents: {
                     drop(view, event) {
                       const files = Array.from(event.dataTransfer?.files || [])
                       const mermaidFile = files.find(f => f.name.toLowerCase().endsWith('.mmd'))
                       if (!mermaidFile) return false

                         event.preventDefault()
                         const reader = new FileReader()
                         reader.onload = () => {
                           const content = reader.result as string
                           const { schema, dispatch } = view.state

                           const node = schema.nodes.mermaid.create({
                             content,
                           })

                           const transaction = view.state.tr.replaceSelectionWith(node)
                           dispatch(transaction)
                         }
                         reader.readAsText(mermaidFile)
                         return true
                     },
                   },
                 },
      }),
    ]
  },
})
```


### `packages/editor-ext-mermaid/src/MermaidNodeView.ts`

```ts
// packages/editor-ext-mermaid/src/MermaidNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import MermaidNodeViewComponent from './MermaidNodeView.vue'

export const MermaidNodeView: NodeViewRenderer =
VueNodeViewRenderer(MermaidNodeViewComponent)
```


### `packages/editor-ext-mermaid/src/MermaidNodeView.vue`

```vue
<!-- packages/editor-ext-mermaid/src/MermaidNodeView.vue -->
<template>
  <NodeViewWrapper
    ref="mermaidWrapper"
    class="mermaid-node"
    :aria-label="t('editor.ext.mermaid.edit_diagram')"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div ref="renderedDiagram" class="mermaid-rendered"></div>

    <textarea
      v-if="editing"
      ref="textareaRef"
      v-model="diagramCode"
      class="mermaid-input"
      spellcheck="false"
      :aria-label="t('editor.ext.mermaid.input_diagram')"
      @blur="handleBlur"
      @keydown.enter.exact.prevent="handleSubmit"
      @keydown.escape.prevent="handleCancel"
    ></textarea>

    <div v-if="error" class="mermaid-error">{{ error }}</div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

const mermaidWrapper = ref<InstanceType<typeof NodeViewWrapper> | null>(null)
const renderedDiagram = ref<HTMLDivElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// 🔑 Normaliza el contenido por si viene con <div class="mermaid">...</div>
const normalizeDiagramText = (raw: string | undefined | null): string => {
  if (!raw) {
    return 'graph TD\nA[Inicio] --> B{Decisión}\nB -->|Sí| C[Camino 1]\nB -->|No| D[Camino 2]'
  }

  const trimmed = raw.trim()
  const match = trimmed.match(/^<div[^>]*>([\s\S]*)<\/div>$/i)
  if (match && match[1]) {
    return match[1].trim()
  }

  return trimmed
}

const initialContent = normalizeDiagramText(props.node.attrs.content)
const diagramCode = ref<string>(initialContent)
const editing = ref(false)
const error = ref<string | null>(null)

// Placeholder i18n
const t = (key: string) => key

declare global {
  interface Window {
    __mermaidPromise?: Promise<any>
  }
}

const loadMermaid = async () => {
  if (window.__mermaidPromise) return window.__mermaidPromise

  window.__mermaidPromise = import('mermaid')
    .then(mod => {
      const mermaid = (mod as any).default || mod
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
      })
      return mermaid
    })
    .catch(err => {
      console.error('Failed to load Mermaid:', err)
      throw err
    })

  return window.__mermaidPromise
}

const renderDiagram = async () => {
  if (!renderedDiagram.value) return

  try {
    const mermaid = await loadMermaid()

    const container = renderedDiagram.value
    container.innerHTML = ''

    // ⬇️ Siempre texto puro, sin <div> envolvente
    const code = normalizeDiagramText(diagramCode.value)

    // Creamos el nodo .mermaid que Mermaid espera
    const codeEl = document.createElement('div')
    codeEl.className = 'mermaid'
    codeEl.textContent = code
    container.appendChild(codeEl)

    // ✅ IMPORTANTE: pasar el nodo .mermaid, no el contenedor
    await mermaid.run({ nodes: [codeEl] })

    error.value = null
  } catch (err: any) {
    console.error('Mermaid render error:', err)
    error.value = err?.message || 'Error al renderizar el diagrama'
    if (renderedDiagram.value) {
      renderedDiagram.value.innerHTML = ''
    }
  }
}

const handleClick = () => {
  editing.value = true
}

const handleBlur = () => {
  if (!editing.value) return
  handleSubmit()
}

const handleSubmit = () => {
  editing.value = false
  const clean = normalizeDiagramText(diagramCode.value)
  diagramCode.value = clean
  props.updateAttributes({ content: clean })
  renderDiagram()
}

const handleCancel = () => {
  editing.value = false
  diagramCode.value = normalizeDiagramText(props.node.attrs.content)
  renderDiagram()
}

onMounted(() => {
  renderDiagram()
})

watch(
  () => props.node.attrs.content,
  newVal => {
    if (!editing.value && typeof newVal === 'string') {
      diagramCode.value = normalizeDiagramText(newVal)
      renderDiagram()
    }
  },
)
</script>

<style scoped>
.mermaid-node {
  position: relative;
  display: block;
  cursor: pointer;
  margin: 1em 0;
}

.mermaid-rendered {
  min-height: 120px;
  min-width: 200px;
  text-align: center;
}

.mermaid-input {
  width: 100%;
  min-height: 120px;
  margin-top: 8px;
  padding: 8px;
  font-family: monospace;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

.mermaid-error {
  margin-top: 4px;
  color: #b00020;
  font-size: 12px;
}

.mermaid-node:focus,
.mermaid-node:hover {
  outline: 2px solid #6a5af944;
}
</style>
```


## Paquete `editor-ext-ocr`


### `packages/editor-ext-ocr/package.json`

```json
{
  "name": "@disertare/editor-ext-ocr",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "license": "MIT",
  "description": "Extensión OCR WASM on-device para el editor Disertare (F2.4).",
  "keywords": [
    "disertare",
    "editor",
    "ocr",
    "tiptap",
    "wasm"
  ],
  "dependencies": {
    "@tiptap/core": "3.10.2"
  }
}
```


### `packages/editor-ext-ocr/src/engine/OcrEngine.ts`

```ts
// packages/editor-ext-ocr/src/engine/OcrEngine.ts

import type { OcrImageSource, OcrOptions, OcrResult } from '../types'

export interface OcrEngineInitOptions {
  defaultLang?: string
}

export interface OcrEngine {
  readonly isInitialized: boolean
  init(options?: OcrEngineInitOptions): Promise<void>
  recognize(image: OcrImageSource, options?: OcrOptions): Promise<OcrResult>
  terminate(): Promise<void>
}

/**
 * Implementación stub inicial: NO hace OCR real,
 * solo devuelve un mensaje de prueba.
 */
class StubOcrEngine implements OcrEngine {
  private _initialized = false
  private _defaultLang: string | undefined

    get isInitialized(): boolean {
      return this._initialized
    }

    async init(options?: OcrEngineInitOptions): Promise<void> {
      this._initialized = true
      this._defaultLang = options?.defaultLang
    }

    async recognize(
      _image: OcrImageSource,
      options?: OcrOptions,
    ): Promise<OcrResult> {
      if (!this._initialized) {
        await this.init()
      }

      const lang = options?.lang ?? this._defaultLang

      const text =
      '[Disertare OCR] El motor OCR aún no está implementado. ' +
      'Esta es una respuesta de prueba del StubOcrEngine.'

      return {
        text,
        blocks: [
          {
            text,
            confidence: 1,
          },
        ],
        lang,
      }
    }

    async terminate(): Promise<void> {
      this._initialized = false
    }
}

export function createOcrEngine(
  initOptions?: OcrEngineInitOptions,
): OcrEngine {
  const engine = new StubOcrEngine()
  if (initOptions) {
    void engine.init(initOptions)
  }
  return engine
}
```


### `packages/editor-ext-ocr/src/engine/OcrWorker.ts`

```ts
// packages/editor-ext-ocr/src/engine/OcrWorker.ts

export type OcrWorkerRequestType = 'init' | 'recognize' | 'terminate'

export interface OcrWorkerRequestBase {
  id: string
  type: OcrWorkerRequestType
}

export interface OcrWorkerInitRequest extends OcrWorkerRequestBase {
  type: 'init'
  payload: {
    defaultLang?: string
  }
}

export interface OcrWorkerRecognizeRequest extends OcrWorkerRequestBase {
  type: 'recognize'
  payload: {
    imageData: ArrayBuffer
    lang?: string
  }
}

export interface OcrWorkerTerminateRequest extends OcrWorkerRequestBase {
  type: 'terminate'
  payload?: undefined
}

export type OcrWorkerRequest =
| OcrWorkerInitRequest
| OcrWorkerRecognizeRequest
| OcrWorkerTerminateRequest

export interface OcrWorkerResponse {
  id: string
  ok: boolean
  error?: string
  payload?: unknown
}

/**
 * Factory para el WebWorker de OCR.
 * En F2.4 (inicio) aún no está implementado.
 */
export function createOcrWorker(): Worker {
  throw new Error(
    '[Disertare OCR] createOcrWorker() no está implementado todavía. ' +
    'Se implementará cuando integremos el motor WASM real.',
  )
}
```


### `packages/editor-ext-ocr/src/engine/wasm-loader.ts`

```ts
// packages/editor-ext-ocr/src/engine/wasm-loader.ts

export interface OcrWasmModule {
  // Placeholder hasta que definamos el motor concreto
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly instance: any
}

export async function loadOcrWasmModule(): Promise<OcrWasmModule> {
  throw new Error(
    '[Disertare OCR] loadOcrWasmModule() no está implementado todavía. ' +
    'Se implementará cuando integremos el motor WASM real.',
  )
}
```


### `packages/editor-ext-ocr/src/index.ts`

```ts
// packages/editor-ext-ocr/src/index.ts

import { Extension } from '@tiptap/core'
import type {
  OcrImageSource,
  OcrOptions,
  OcrResult,
  OcrResultBlock,
} from './types'
import {
  createOcrEngine,
  type OcrEngine,
  type OcrEngineInitOptions,
} from './engine/OcrEngine'

export interface OcrExtensionOptions {
  defaultLang?: string
}

export const OcrExtension = Extension.create<OcrExtensionOptions>({
  name: 'ocr',

  addOptions() {
    return {
      defaultLang: 'es',
    }
  },
})

export { createOcrEngine }

export type {
  OcrEngine,
  OcrEngineInitOptions,
  OcrResult,
  OcrResultBlock,
  OcrOptions,
  OcrImageSource,
}

export default OcrExtension
```


### `packages/editor-ext-ocr/src/types.ts`

```ts
// packages/editor-ext-ocr/src/types.ts

export type OcrImageSource =
| Blob
| ArrayBuffer
| Uint8Array
| string // data URL o URL de imagen ya accesible en el navegador

export interface OcrOptions {
  /**
   * Código de idioma (ej. 'es', 'en').
   * Si no se especifica, se usará el idioma por defecto que configure el motor.
   */
  lang?: string
}

export interface OcrResultBlock {
  text: string
  confidence?: number
  bbox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface OcrResult {
  text: string
  blocks?: OcrResultBlock[]
  lang?: string
}
```


## Paquete `editor-ext-page-section`


### `packages/editor-ext-page-section/package.json`

```json
{
  "name": "@disertare/editor-ext-page-section",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  },
  "license": "MIT",
  "description": "Extensión de secciones de página y encabezados/pies 1:1 para el editor Disertare (F2.5)."
}
```


### `packages/editor-ext-page-section/src/index.ts`

```ts
// packages/editor-ext-page-section/src/index.ts

import PageSectionExtension, {
  type PageSectionExtensionOptions,
} from './PageSectionExtension'

export * from './types'

export { PageSectionExtension }

export type { PageSectionExtensionOptions }

export default PageSectionExtension
```


### `packages/editor-ext-page-section/src/PageSectionExtension.ts`

```ts
import { Extension } from '@tiptap/core'
import type {
  PageHeaderFooterTemplate,
  PageSectionBreak,
  PageSectionConfig,
  PageSectionState,
  SectionLayoutConfig,
} from './types'

/**
 * Opciones de la extensión. En F2.5 solo necesitamos
 * una plantilla por defecto opcional.
 *
 * Los metadatos reales del documento (TITLE, AUTHOR, DATE, SECTION)
 * se resolverán desde el frontend usando composables,
 * no desde esta extensión.
 */
export interface PageSectionExtensionOptions {
  defaultTemplate?: PageHeaderFooterTemplate
}

// Declaración de comandos TipTap para esta extensión.
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageSection: {
      /**
       * Inserta o actualiza un corte de sección en la posición actual
       * de la selección. Si no se pasa `sectionConfig.id`, se genera
       * uno del tipo `section-1`, `section-2`, etc.
       */
      setPageSectionBreak: (sectionConfig?: Partial<PageSectionConfig>) => ReturnType

      /**
       * Actualiza la configuración de una sección existente.
       */
      updatePageSection: (
        sectionId: string,
        patch: Partial<PageSectionConfig>,
      ) => ReturnType

      /**
       * Elimina una sección y todos sus cortes asociados.
       */
      removePageSection: (sectionId: string) => ReturnType

      /**
       * Limpia todas las secciones y cortes.
       * Útil para pruebas o para resetear el documento.
       */
      clearPageSections: () => ReturnType

      /**
       * Fija o actualiza el número de columnas lógicas de una sección (F2.19).
       *
       * Si `columns` es null/undefined se interpreta como 1 columna
       * y se normaliza a `null` en el storage para mantener simple
       * la compatibilidad hacia atrás.
       */
      setSectionColumns: (sectionId: string, columns: number | null | undefined) => ReturnType

      /**
       * Fija o actualiza los contenedores de texto asociados a una sección (F2.19).
       *
       * No realiza validaciones geométricas: solo persiste los metadatos.
       * El motor de layout y la exportación decidirán cómo usarlos.
       */
      setSectionLayoutContainers: (
        sectionId: string,
        containers: SectionLayoutConfig['containers'],
      ) => ReturnType
    }
  }
}

/**
 * Extensión ligera que modela secciones de página y su
 * configuración de encabezados/pies y layout (F2.19).
 *
 * No modifica el contenido del documento ni añade nodos visibles;
 * solo mantiene metadatos que luego usará F2.5/F2.19 en la vista paginada
 * y en la exportación DOCX/PDF.
 */
export const PageSectionExtension = Extension.create<PageSectionExtensionOptions>({
  name: 'pageSection',

  addOptions() {
    return {
      defaultTemplate: undefined,
    }
  },

  /**
   * Storage por extensión.
   * Se expone en `editor.storage.pageSection`.
   */
  addStorage() {
    const initialState: PageSectionState = {
      sections: [],
      breaks: [],
    }

    return initialState
  },

  addCommands() {
    return {
      setPageSectionBreak:
      (sectionConfig?: Partial<PageSectionConfig>) =>
      ({ state }) => {
        const storage = this.storage as PageSectionState

        const { from } = state.selection

        // Generar o reutilizar id de sección
        const id =
        sectionConfig?.id ??
        `section-${storage.sections.length + 1}`

        let section = storage.sections.find(s => s.id === id)

        if (!section) {
          section = {
            id,
            name: sectionConfig?.name,
            templateId: sectionConfig?.templateId,
            firstPageDifferent: sectionConfig?.firstPageDifferent,
            oddEvenDifferent: sectionConfig?.oddEvenDifferent,
            firstPageHeader: sectionConfig?.firstPageHeader,
            firstPageFooter: sectionConfig?.firstPageFooter,
            oddHeader: sectionConfig?.oddHeader,
            oddFooter: sectionConfig?.oddFooter,
            evenHeader: sectionConfig?.evenHeader,
            evenFooter: sectionConfig?.evenFooter,
            header: sectionConfig?.header,
            footer: sectionConfig?.footer,
            layout: sectionConfig?.layout,
          }

          storage.sections.push(section)
        } else if (sectionConfig) {
          Object.assign(section, sectionConfig)
        }

        // Registrar corte de sección en la posición actual
        const existingBreak = storage.breaks.find(b => b.pos === from)

        if (existingBreak) {
          existingBreak.sectionId = id
        } else {
          const newBreak: PageSectionBreak = {
            pos: from,
            sectionId: id,
          }

          storage.breaks.push(newBreak)
          storage.breaks.sort((a, b) => a.pos - b.pos)
        }

        // No modifica el documento, solo storage -> devolver true
        return true
      },

      updatePageSection:
      (sectionId: string, patch: Partial<PageSectionConfig>) =>
      () => {
        const storage = this.storage as PageSectionState
        const section = storage.sections.find(s => s.id === sectionId)

        if (!section)
          return false

          Object.assign(section, patch)
          return true
      },

      removePageSection:
      (sectionId: string) =>
      () => {
        const storage = this.storage as PageSectionState

        storage.sections = storage.sections.filter(s => s.id !== sectionId)
        storage.breaks = storage.breaks.filter(b => b.sectionId !== sectionId)

        return true
      },

      clearPageSections:
      () =>
      () => {
        const storage = this.storage as PageSectionState

        storage.sections = []
        storage.breaks = []

        return true
      },

      setSectionColumns:
      (sectionId: string, columns: number | null | undefined) =>
      () => {
        const storage = this.storage as PageSectionState
        const section = storage.sections.find(s => s.id === sectionId)

        if (!section)
          return false

          const normalizedColumns =
          columns == null || columns <= 1
          ? null
          : columns

          if (!section.layout) {
            section.layout = {
              columns: normalizedColumns,
              containers: null,
            }
          } else {
            section.layout.columns = normalizedColumns
          }

          return true
      },

      setSectionLayoutContainers:
      (sectionId: string, containers: SectionLayoutConfig['containers']) =>
      () => {
        const storage = this.storage as PageSectionState
        const section = storage.sections.find(s => s.id === sectionId)

        if (!section)
          return false

          if (!section.layout) {
            section.layout = {
              columns: null,
              containers: containers ?? null,
            }
          } else {
            section.layout.containers = containers ?? null
          }

          return true
      },
    }
  },
})

export default PageSectionExtension
```


### `packages/editor-ext-page-section/src/types.ts`

```ts
/**
 * Plantilla de encabezado/pie que puede usarse en varias secciones.
 * No hace nada "mágico": son simplemente strings con placeholders
 * como {PAGE}, {PAGES}, {TITLE}, {DATE}, {AUTHOR}, {SECTION}.
 *
 * La resolución de esos placeholders la hará el frontend (F2.5)
 * usando los metadatos del documento y la información de paginado.
 */
export interface PageHeaderFooterTemplate {
  id: string
  name: string
  header?: string
  footer?: string
}

/**
 * Forma geométrica de un contenedor de texto.
 * Se usan coordenadas normalizadas (0–1) relativas al ancho/alto
 * del recurso asociado (imagen raster o SVG).
 *
 * Esto permite que F3.x pueda reutilizar la misma definición
 * en distintos tamaños de página / resolución.
 */
export interface TextContainerShape {
  /**
   * Tipo de figura utilizada para el contenedor.
   * En F2.19 se soportan rectángulos y polígonos generales.
   */
  kind: 'rect' | 'polygon'

  /**
   * Lista de puntos que definen la figura.
   * Para 'rect' se esperarán 2 o 4 puntos (según la implementación
   * futura del motor); para 'polygon', 3 o más puntos.
   *
   * Las coordenadas están normalizadas:
   *  - x en [0, 1] relativo al ancho del recurso
   *  - y en [0, 1] relativo al alto del recurso
   */
  points: { x: number; y: number }[]
}

/**
 * Región de contenedor de texto asociada a un recurso gráfico
 * (imagen raster o SVG).
 *
 * No impone cómo se resuelve el recurso: solo guarda
 * un identificador estable (`resourceId`) que deberá
 * ser resuelto por el dominio de imágenes/SVG.
 */
export interface TextContainerRegion {
  /**
   * Identificador único de la región dentro de la sección.
   */
  id: string

  /**
   * Identificador del recurso gráfico al que está anclada
   * esta región (por ejemplo, un nodo de imagen o SVG).
   */
  resourceId: string

  /**
   * Figura geométrica que define el área de texto.
   */
  shape: TextContainerShape
}

/**
 * Configuración de layout asociada a una sección.
 *
 * En F2.19 se modelan:
 *  - número de columnas lógicas para el flujo de texto
 *  - contenedores de texto ligados a recursos gráficos
 *
 * El motor de paginado (F2.5/F2.19) y la exportación se apoyarán
 * en estos metadatos sin duplicar contenido lógico.
 */
export interface SectionLayoutConfig {
  /**
   * Número de columnas lógicas de la sección.
   * Si es null/undefined, se asume 1 columna.
   */
  columns?: number | null

  /**
   * Conjunto opcional de contenedores de texto asociados
   * a la sección.
   *
   * F2.19 solo define la estructura; la lógica completa
   * de distribución de texto puede evolucionar en F3.x.
   */
  containers?: TextContainerRegion[] | null
}

/**
 * Configuración de una sección de página.
 * Permite modelar:
 *  - Primera página diferente (firstPageDifferent)
 *  - Encabezados/pies distintos para páginas impares/pares (oddEvenDifferent)
 *  - Layout de columnas y contenedores de texto (F2.19)
 */
export interface PageSectionConfig {
  id: string
  name?: string

  /**
   * Referencia a una plantilla base opcional.
   * Útil para cuando en el futuro existan plantillas globales por formato.
   */
  templateId?: string

  /**
   * Si true, la primera página de la sección puede tener
   * encabezado/pie específicos.
   */
  firstPageDifferent?: boolean

  /**
   * Si true, se pueden definir encabezados/pies distintos
   * para páginas impares y pares dentro de la sección.
   */
  oddEvenDifferent?: boolean

  // Overrides opcionales de encabezado/pie

  firstPageHeader?: string
  firstPageFooter?: string

  oddHeader?: string
  oddFooter?: string

  evenHeader?: string
  evenFooter?: string

  /**
   * Header/footer "general" (si no aplica first/odd/even
   * o si no se quieren distinguir).
   */
  header?: string
  footer?: string

  /**
   * Configuración de layout de la sección (F2.19).
   * Es opcional para mantener compatibilidad con documentos
   * anteriores a F2.19.
   */
  layout?: SectionLayoutConfig
}

/**
 * Punto de ruptura de sección: a partir de `pos` (posición en el doc TipTap)
 * comienza la sección indicada por `sectionId`.
 */
export interface PageSectionBreak {
  pos: number
  sectionId: string
}

/**
 * Estado completo gestionado por la extensión.
 * Se guarda en `editor.storage.pageSection` y se puede leer
 * desde los composables del frontend.
 */
export interface PageSectionState {
  sections: PageSectionConfig[]
  breaks: PageSectionBreak[]
}
```


## Paquete `editor-ext-prism`


### `packages/editor-ext-prism/package.json`

```json
{
  "name": "@disertare/editor-ext-prism",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  },
  "dependencies": {
    "prismjs": "^1.29.0"
  }
}
```


### `packages/editor-ext-prism/src/index.ts`

```ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { PrismNodeView } from './PrismNodeView'

export const Prism = Node.create({
  name: 'prism',
  content: 'text*',
  group: 'block',
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      language: {
        default: 'plaintext',
          parseHTML: element => element.getAttribute('data-language'),
                                 renderHTML: attributes => {
                                   return { 'data-language': attributes.language }
                                 },
      },
      content: {
        default: '',
          parseHTML: element => element.getAttribute('data-content'),
                                 renderHTML: attributes => {
                                   return { 'data-content': attributes.content }
                                 },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-prism]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-prism': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setPrism:
      attrs =>
      ({ chain }) => {
        return chain()
        .insertContent({
          type: this.name,
          attrs: {
            language: attrs.language || 'plaintext',
            content: attrs.content || '',
          },
        })
        .run()
      },
    }
  },

  addNodeView() {
    return PrismNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('prismDropHandler'),
                 props: {
                   handleDOMEvents: {
                     drop(view, event) {
                       const files = Array.from(event.dataTransfer?.files || [])
                       const prismFile = files.find(f => f.name.toLowerCase().endsWith('.txt') || f.name.toLowerCase().endsWith('.js') || f.name.toLowerCase().endsWith('.py'))
                       if (!prismFile) return false

                         event.preventDefault()
                         const reader = new FileReader()
                         reader.onload = () => {
                           const content = reader.result as string
                           const { schema, dispatch } = view.state

                           const node = schema.nodes.prism.create({
                             language: 'plaintext',
                             content,
                           })

                           const transaction = view.state.tr.replaceSelectionWith(node)
                           dispatch(transaction)
                         }
                         reader.readAsText(prismFile)
                         return true
                     },
                   },
                 },
      }),
    ]
  },
})
```


### `packages/editor-ext-prism/src/PrismNodeView.ts`

```ts
// packages/editor-ext-prism/src/PrismNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import PrismNodeViewComponent from './PrismNodeView.vue'

export const PrismNodeView: NodeViewRenderer =
VueNodeViewRenderer(PrismNodeViewComponent)
```


### `packages/editor-ext-prism/src/PrismNodeView.vue`

```vue
<!-- packages/editor-ext-prism/src/PrismNodeView.vue -->
<template>
  <NodeViewWrapper class="prism-node" :aria-label="t('editor.ext.prism.code_block')">
    <select
      v-model="selectedLanguage"
      class="prism-language-select"
      :aria-label="t('editor.ext.prism.select_language')"
      @change="updateLanguage"
    >
      <option value="javascript">JavaScript</option>
      <option value="typescript">TypeScript</option>
      <option value="python">Python</option>
      <option value="java">Java</option>
      <option value="c">C</option>
      <option value="cpp">C++</option>
      <option value="csharp">C#</option>
      <option value="go">Go</option>
      <option value="rust">Rust</option>
      <option value="php">PHP</option>
      <option value="ruby">Ruby</option>
      <option value="swift">Swift</option>
    </select>

    <pre ref="codeBlock" class="prism-code">
      <code class="language-{{ selectedLanguage }}">{{ codeText }}</code>
    </pre>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()
const codeBlock = ref<HTMLPreElement | null>(null)
const selectedLanguage = ref<string>(props.node.attrs.language || 'javascript')
const codeText = ref<string>(props.node.textContent)

// Placeholder i18n
const t = (key: string) => key

declare global {
  interface Window {
    __prismPromise?: Promise<any>
  }
}

const loadPrism = async () => {
  if (window.__prismPromise) return window.__prismPromise

  window.__prismPromise = import('prismjs')
    .then(async mod => {
      if (!document.getElementById('prism-stylesheet')) {
        const link = document.createElement('link')
        link.id = 'prism-stylesheet'
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css'
        document.head.appendChild(link)
      }

      await import('prismjs/components/prism-typescript')
      await import('prismjs/components/prism-python')
      await import('prismjs/components/prism-java')
      await import('prismjs/components/prism-c')
      await import('prismjs/components/prism-cpp')
      await import('prismjs/components/prism-csharp')
      await import('prismjs/components/prism-go')
      await import('prismjs/components/prism-rust')
      await import('prismjs/components/prism-php')
      await import('prismjs/components/prism-ruby')
      await import('prismjs/components/prism-swift')

      return mod
    })
    .catch(err => {
      console.error('Failed to load Prism:', err)
      throw err
    })

  return window.__prismPromise
}

const updateLanguage = () => {
  props.updateAttributes({ language: selectedLanguage.value })
  highlight()
}

const highlight = async () => {
  if (!codeBlock.value) return
  try {
    const { default: Prism } = await loadPrism()
    const codeEl = codeBlock.value.querySelector('code')
    if (codeEl) {
      codeEl.textContent = codeText.value
      Prism.highlightElement(codeEl)
    }
  } catch (err) {
    console.error('Prism highlight failed:', err)
  }
}

onMounted(() => {
  highlight()
})

watch(
  () => props.node.textContent,
  newText => {
    codeText.value = newText || ''
    highlight()
  },
)
</script>

<style scoped>
.prism-node {
  position: relative;
  margin: 1em 0;
}

.prism-language-select {
  margin-bottom: 4px;
  padding: 2px 4px;
  font-size: 12px;
}

.prism-code {
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}
</style>
```


## Paquete `editor-ext-slides`


### `packages/editor-ext-slides/package.json`

```json
{
  "name": "@disertare/editor-ext-slides",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  }
}
```


### `packages/editor-ext-slides/src/index.ts`

```ts
// packages/editor-ext-slides/src/index.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { SlidesNodeView } from './SlidesNodeView'
import type { SlideDto, SlidesThemeId } from './types'

export * from './types'

export interface SlidesOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    slides: {
      /**
       * Inserta una presentación editable tipo PowerPoint.
       */
      setSlides: (attrs?: {
        title?: string
        theme?: SlidesThemeId
        slides?: SlideDto[]
      }) => ReturnType
    }
  }
}

export const Slides = Node.create<SlidesOptions>({
  name: 'slides',
  group: 'block',
  content: 'text*',
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      /**
       * Título general del deck (no de la diapositiva actual).
       */
      title: {
        default: 'Presentación sin título',
          parseHTML: element => element.getAttribute('data-title'),
                                                 renderHTML: attrs =>
                                                 attrs.title
                                                 ? {
                                                   'data-title': attrs.title,
                                                 }
                                                 : {},
      },

      /**
       * Tema visual (plantilla de diseño ligera).
       */
      theme: {
        default: 'default' as SlidesThemeId,
          parseHTML: element =>
          (element.getAttribute('data-theme') as SlidesThemeId | null) ??
          'default',
          renderHTML: attrs =>
          attrs.theme && attrs.theme !== 'default'
? {
  'data-theme': attrs.theme,
}
: {},
      },

      /**
       * Representación JSON del deck (SlideDto[]).
       * Se usa para exportación PPTX / futura exportación PDF.
       */
      slides: {
        default: null as string | null,
          parseHTML: element => element.getAttribute('data-slides'),
                                                 renderHTML: attrs =>
                                                 attrs.slides
                                                 ? {
                                                   'data-slides': attrs.slides,
                                                 }
                                                 : {},
      },

      /**
       * Representación legacy en texto plano (F2.x):
       * Slide1\nBody1\n---\nSlide2\nBody2...
       * Se mantiene por compatibilidad y como fallback.
       */
      content: {
        default: '',
          parseHTML: element => element.getAttribute('data-content') ?? '',
                                                 renderHTML: attrs =>
                                                 attrs.content
                                                 ? {
                                                   'data-content': attrs.content,
                                                 }
                                                 : {},
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-slides]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-slides': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setSlides:
      attrs =>
      ({ chain }) => {
        const slidesJson =
        attrs?.slides && attrs.slides.length
        ? JSON.stringify(attrs.slides)
        : null

        return chain()
        .insertContent({
          type: this.name,
          attrs: {
            title: attrs?.title || 'Presentación sin título',
            theme: attrs?.theme || 'default',
            slides: slidesJson,
            content: '',
          },
        })
        .run()
      },
    }
  },

  addNodeView() {
    return SlidesNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('slidesHandler'),
                 props: {
                   // En F2.x no hay handler especial de pegado.
                   // Fases posteriores podrán enganchar aquí importaciones PPTX → Slides.
                 },
      }),
    ]
  },
})

export default Slides
```


### `packages/editor-ext-slides/src/SlidesNodeView.ts`

```ts
// packages/editor-ext-slides/src/SlidesNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import SlidesNodeViewComponent from './SlidesNodeView.vue'

export const SlidesNodeView: NodeViewRenderer =
VueNodeViewRenderer(SlidesNodeViewComponent)
```


### `packages/editor-ext-slides/src/SlidesNodeView.vue`

```vue
<!-- packages/editor-ext-slides/src/SlidesNodeView.vue -->
<template>
  <NodeViewWrapper
    class="slides-node"
    :class="[`slides-theme-${theme}`]"
    :aria-label="'Deck de diapositivas'"
  >
    <div
      class="slides-frame"
      :class="{ 'slides-selected': selected }"
      @click.stop="selectNode"
    >
      <header class="slides-header">
        <div class="slides-title-block">
          <span class="slides-label">SLIDES</span>
          <span class="slides-title-text">
            {{ deckTitle || 'Presentación sin título' }}
          </span>
        </div>
        <span class="slides-counter">
          {{ currentIndex + 1 }} / {{ slides.length || 0 }}
        </span>
      </header>

      <div class="slides-body">
        <div
          v-if="slides.length"
          class="slides-viewport"
        >
          <div class="slide-main">
            <div class="slide-main-layout">
              <span class="slide-layout-chip">
                {{ humanLayout }}
              </span>
            </div>

            <h3
              v-if="currentSlideTitle"
              class="slide-main-title"
            >
              {{ currentSlideTitle }}
            </h3>

            <p
              v-if="currentSlideBody && layout !== 'blank'"
              class="slide-main-content"
            >
              {{ currentSlideBody }}
            </p>

            <div
              v-if="layout === 'title-image' && currentImageUrl"
              class="slide-main-image"
            >
              <div class="slide-main-image-inner">
                <!-- Imagen representativa (no editable desde aquí) -->
                <div class="slide-main-image-thumb" />
                <span class="slide-main-image-caption">
                  Imagen vinculada
                </span>
              </div>
            </div>
          </div>

          <div class="slide-strip">
            <button
              v-for="(slide, index) in slides"
              :key="slide.id"
              type="button"
              class="strip-slide"
              :class="{ 'strip-slide-active': index === currentIndex }"
              @click.stop="setIndex(index)"
            >
              <span class="strip-slide-index">{{ index + 1 }}</span>
            </button>
          </div>
        </div>

        <div
          v-else
          class="slides-empty-preview"
        >
          <p class="slides-empty-title">
            Sin diapositivas
          </p>
          <p class="slides-empty-text">
            Usa el panel <strong>Presentaciones</strong> para crear el deck.
          </p>
        </div>
      </div>

      <footer class="slides-footer">
        <span v-if="deckId" class="slides-deck-id">
          Deck: {{ deckId }}
        </span>
        <span class="slides-hint">
          Haz clic para seleccionar el bloque. El Canvas lateral controla
          diapositivas, diseño e imágenes.
        </span>
      </footer>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'
import type { SlideDto, SlideLayout } from './types'

const props = defineProps<NodeViewProps>()

const selected = ref(false)
const currentIndex = ref(0)

const deckTitle = computed(
  () => (props.node.attrs.title as string | undefined) ?? '',
)

const theme = computed(
  () => (props.node.attrs.theme as string | undefined) ?? 'default',
)

const deckId = computed(
  () => (props.node.attrs.deckId as string | undefined) ?? '',
)

/**
 * Intenta leer attrs.slides (JSON) y, si no existe o falla, cae
 * al formato legacy attrs.content (texto con "\n---\n").
 */
type SlideInternal = {
  id: string
  title: string
  body: string
  layout: SlideLayout
  imageUrl?: string
}

function createId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  const time = Date.now().toString(36)
  return `${prefix}-${time}-${rand}`
}

const slides = computed<SlideInternal[]>(() => {
  const rawSlides = props.node.attrs.slides as string | null | undefined

  // 1) JSON (F2.12)
  if (rawSlides) {
    try {
      const dto = JSON.parse(rawSlides) as SlideDto[]
      if (Array.isArray(dto)) {
        return dto.map((s, index) => ({
          id: createId('slide'),
          title: (s.title ?? '').trim() || `Diapositiva ${index + 1}`,
          body: s.body ?? '',
          layout: (s.layout as SlideLayout) || 'title-content',
          imageUrl: s.imageUrl,
        }))
      }
    } catch {
      // Si falla, continuamos con legacy.
    }
  }

  // 2) Legacy: attrs.content usando "\n---\n"
  const rawContent =
    (props.node.attrs.content as string | undefined) ??
    'Slide 1\n---\nSlide 2\n---\nSlide 3'

  const chunks = rawContent.split(/\n---\n/g)
  if (!chunks.length) {
    return []
  }

  return chunks.map((chunk, index) => {
    const lines = chunk.split('\n')
    const firstLine = (lines[0] || '').trim()
    const rest = lines.slice(1).join('\n')

    return {
      id: createId('slide'),
      title: firstLine || `Diapositiva ${index + 1}`,
      body: rest,
      layout: 'title-content' as SlideLayout,
    }
  })
})

const currentSlide = computed<SlideInternal | null>(() => {
  if (!slides.value.length) return null
  if (currentIndex.value < 0 || currentIndex.value >= slides.value.length) {
    return slides.value[0]
  }
  return slides.value[currentIndex.value]
})

const currentSlideTitle = computed(() => currentSlide.value?.title ?? '')
const currentSlideBody = computed(() => currentSlide.value?.body ?? '')
const currentImageUrl = computed(() => currentSlide.value?.imageUrl ?? '')

const layout = computed<SlideLayout>(() => currentSlide.value?.layout ?? 'title-content')

const humanLayout = computed(() => {
  switch (layout.value) {
    case 'title':
      return 'Solo título'
    case 'title-image':
      return 'Título + imagen'
    case 'blank':
      return 'En blanco'
    default:
      return 'Título + contenido'
  }
})

function clampIndex() {
  if (currentIndex.value >= slides.value.length) {
    currentIndex.value = slides.value.length - 1
  }
  if (currentIndex.value < 0) {
    currentIndex.value = 0
  }
}

function setIndex(idx: number) {
  currentIndex.value = idx
  clampIndex()
}

function selectNode() {
  selected.value = true
  clampIndex()
  props.editor.commands.setNodeSelection(props.getPos() as number)
}
</script>

<style scoped>
.slides-node {
  display: block;
  margin: 1em 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
}

/* Tema base */
.slides-frame {
  border-radius: 8px;
  border: 1px dashed rgba(106, 90, 249, 0.4);
  background: rgba(106, 90, 249, 0.02);
  padding: 8px 10px;
  cursor: pointer;
}

.slides-selected {
  box-shadow: 0 0 0 2px rgba(106, 90, 249, 0.5);
}

.slides-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}

.slides-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slides-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #6a5af9;
}

.slides-title-text {
  font-size: 13px;
  font-weight: 500;
}

.slides-counter {
  font-size: 11px;
  color: #555;
}

.slides-body {
  margin-bottom: 4px;
}

/* Vista principal */
.slides-viewport {
  display: flex;
  gap: 6px;
  align-items: flex-start;
}

.slide-main {
  flex: 1;
  border-radius: 4px;
  border: 1px solid #e0d6ff;
  background: #ffffff;
  padding: 8px;
  min-height: 120px;
  box-sizing: border-box;
}

.slide-main-layout {
  display: flex;
  justify-content: flex-end;
}

.slide-layout-chip {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4b3f72;
}

.slide-main-title {
  font-size: 12px;
  font-weight: 600;
  margin: 4px 0;
  background: #f3efff;
  padding: 3px 4px;
  border-radius: 3px;
}

.slide-main-content {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Imagen */
.slide-main-image {
  margin-top: 6px;
}

.slide-main-image-inner {
  border-radius: 4px;
  border: 1px dashed #d4d4d8;
  padding: 4px;
  background: #faf5ff;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.slide-main-image-thumb {
  width: 100%;
  height: 48px;
  border-radius: 3px;
  background: linear-gradient(
    135deg,
    rgba(148, 163, 184, 0.4),
    rgba(129, 140, 248, 0.5)
  );
}

.slide-main-image-caption {
  color: #4b5563;
}

/* Tira de miniaturas */
.slide-strip {
  width: 42px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.strip-slide {
  border-radius: 3px;
  border: 1px solid #e0d6ff;
  background: #f8f6ff;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
  padding: 0;
}

.strip-slide-active {
  background: #6a5af9;
  color: #fff;
  border-color: #6a5af9;
}

.strip-slide-index {
  font-weight: 600;
}

/* Vacío */
.slides-empty-preview {
  padding: 8px;
  border-radius: 4px;
  border: 1px dashed #e5e7eb;
  background: #f9fafb;
  font-size: 12px;
  color: #4b5563;
}

.slides-empty-title {
  margin: 0 0 2px;
  font-weight: 600;
}

.slides-empty-text {
  margin: 0;
}

/* Footer */
.slides-footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 11px;
  color: #555;
  margin-top: 4px;
}

.slides-deck-id {
  color: #555;
}

.slides-hint {
  color: #777;
}

/* Variantes de tema muy ligeras */
.slides-theme-thesis .slides-frame {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.03);
}

.slides-theme-conference .slides-frame {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.04);
}

.slides-theme-dark .slides-frame {
  border-color: rgba(15, 23, 42, 0.7);
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
}

.slides-theme-dark .slides-label {
  color: #a5b4fc;
}
</style>
```


### `packages/editor-ext-slides/src/types.ts`

```ts
// packages/editor-ext-slides/src/types.ts

/**
 * Layouts soportados en F2.12
 *
 * - title-content : título + cuerpo de texto
 * - title         : solo título centrado
 * - title-image   : título + imagen principal
 * - blank         : diapositiva en blanco
 */
export type SlideLayout =
  | 'title-content'
  | 'title'
  | 'title-image'
  | 'blank'

/**
 * DTO minimalista por diapositiva.
 * Se almacena como JSON en attrs.slides del nodo `slides`.
 */
export interface SlideDto {
  title?: string
  body?: string
  layout?: SlideLayout
  imageUrl?: string
  notes?: string
}

/**
 * DTO de deck completo, útil para exportaciones.
 */
export interface SlidesDeckDto {
  title?: string
  theme?: SlidesThemeId
  slides: SlideDto[]
}

/**
 * Tema visual simple (plantillas de diseño “lightweight” para F2.12).
 * Más adelante se podrá mapear a temas de PPTX y a estilos personalizados.
 */
export type SlidesThemeId =
  | 'default'
  | 'thesis'
  | 'conference'
  | 'dark'
```


## Paquete `editor-ext-stats-adv`


### `packages/editor-ext-stats-adv/package.json`

```json
{
  "name": "@disertare/editor-ext-stats-adv",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "module": "src/index.ts",
  "types": "src/index.ts",
  "license": "MIT",
  "sideEffects": false,
  "dependencies": {},
  "peerDependencies": {}
}
```


### `packages/editor-ext-stats-adv/src/datasets/index.ts`

```ts
// packages/editor-ext-stats-adv/src/datasets/index.ts
import type { StatsDataset } from '../types'

const registry = new Map<string, StatsDataset>()

export function registerDataset(dataset: StatsDataset): void {
  registry.set(dataset.id, dataset)
}

export function getDataset(id: string): StatsDataset | undefined {
  return registry.get(id)
}

export function listDatasets(): StatsDataset[] {
  return Array.from(registry.values())
}

export function removeDataset(id: string): void {
  registry.delete(id)
}

export function clearDatasets(): void {
  registry.clear()
}
```


### `packages/editor-ext-stats-adv/src/engine/index.ts`

```ts
// packages/editor-ext-stats-adv/src/engine/index.ts
import type {
  StatsBuiltSpecResult,
  StatsChartConfig,
  StatsDataset,
} from '../types'

export function buildVegaLiteSpec(
  config: StatsChartConfig,
  dataset: StatsDataset,
): StatsBuiltSpecResult {
  const enc: Record<string, any> = {}

  for (const channelDef of config.encodings) {
    const { channel, field, type, bin, aggregate } = channelDef

    enc[channel] = {
      field,
      type,
      ...(bin ? { bin: true } : {}),
      ...(aggregate ? { aggregate } : {}),
    }
  }

  const mark =
  config.mark === 'histogram'
  ? { type: 'bar' }
  : config.mark === 'boxplot'
  ? { type: 'boxplot' }
  : { type: config.mark }

  const spec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: dataset.rows,
    },
    mark,
    encoding: enc,
  }

  if (config.title) spec.title = config.title
    if (config.description) spec.description = config.description

      return {
        spec,
        dataset,
      }
}
```


### `packages/editor-ext-stats-adv/src/index.ts`

```ts
// packages/editor-ext-stats-adv/src/index.ts

export * from './types'
export * from './datasets'
export * from './engine'
export * from './syntax'
```


### `packages/editor-ext-stats-adv/src/syntax/index.ts`

```ts
// packages/editor-ext-stats-adv/src/syntax/index.ts
import type {
  EncodingChannel,
  EncodingDataType,
  StatsChartConfig,
  StatsMark,
} from '../types'

/**
 * Resultado del parser de mini-lenguaje.
 */
export interface ParsedStatsCommand {
  config: StatsChartConfig
}

/**
 * Determina un tipo de dato por defecto a partir del nombre del campo.
 */
function inferTypeFromFieldName(field: string): EncodingDataType {
  const lower = field.toLowerCase()

  // Fechas / tiempos
  if (/(fecha|date|hora|hour|time|timestamp|día|dia|mes|año|anio|year)/.test(lower)) {
    return 'temporal'
  }

  // Identificadores y categóricos típicos
  if (/^(id|clave|codigo|código)$/.test(lower)) {
    return 'nominal'
  }

  if (
    /(categoria|categoría|grupo|sexo|tipo|nivel|region|región|ciudad|escuela|facultad|carrera)/
    .test(lower)
  ) {
    return 'nominal'
  }

  // Nombres típicamente numéricos
  if (
    /(edad|valor|monto|importe|precio|costo|cantidad|score|puntuacion|puntuación|indice|índice|peso|altura|talla|ingreso|gasto)/
    .test(lower)
  ) {
    return 'quantitative'
  }

  // Por defecto asumimos categórico (más seguro)
  return 'nominal'
}

/**
 * Normaliza la marca de texto → StatsMark.
 */
function normalizeMark(token: string): StatsMark {
  const t = token.toLowerCase()
  if (t === 'line' || t === 'línea') return 'line'
    if (t === 'point' || t === 'punto' || t === 'scatter') return 'point'
      if (t === 'area' || t === 'área') return 'area'
        if (t === 'boxplot' || t === 'box') return 'boxplot'
          if (t === 'hist' || t === 'histograma') return 'histogram'
            return 'bar'
}

/**
 * Parser de receta simple:
 *
 *   "<mark> canal=campo canal=campo ..."
 *
 * Canales admitidos: x, y, color, size, shape, row, column.
 */
export function parseStatsMiniLanguage(
  input: string,
  datasetId: string,
): ParsedStatsCommand | null {
  const trimmed = input.trim()
  if (!trimmed) return null

    const tokens = trimmed.split(/\s+/)
    if (tokens.length === 0) return null

      const [markToken, ...restTokens] = tokens
      const mark = normalizeMark(markToken)

      const encodings: StatsChartConfig['encodings'] = []

      for (const token of restTokens) {
        const [channelRaw, fieldRaw] = token.split('=')
        if (!channelRaw || !fieldRaw) continue

          const channel = channelRaw.toLowerCase() as EncodingChannel
          const field = fieldRaw

          if (!['x', 'y', 'color', 'size', 'shape', 'column', 'row'].includes(channel))
            continue

            const type = inferTypeFromFieldName(field)

            encodings.push({
              channel,
              field,
              type,
              aggregate: null,
            })
      }

      if (encodings.length === 0) return null

        const config: StatsChartConfig = {
          datasetId,
          mark,
          encodings,
          measures: [],
          title: null,
          description: null,
        }

        return { config }
}
```


### `packages/editor-ext-stats-adv/src/types.ts`

```ts
// packages/editor-ext-stats-adv/src/types.ts
export type StatsPrimitive = number | string | boolean | null
export type StatsRow = Record<string, StatsPrimitive>

export type StatsColumnKind = 'numeric' | 'categorical' | 'datetime'

export interface StatsFieldDef {
  key: string
  label: string
  kind: StatsColumnKind
}

export interface StatsDataset {
  id: string
  label: string
  description?: string
  rows: StatsRow[]
  fields: StatsFieldDef[]
}

export type AggregateOp =
| 'count'
| 'sum'
| 'mean'
| 'median'
| 'min'
| 'max'

export interface StatsMeasure {
  field: string
  op: AggregateOp
  as: string
}

export type EncodingChannel =
| 'x'
| 'y'
| 'color'
| 'size'
| 'shape'
| 'column'
| 'row'

export type EncodingDataType =
| 'quantitative'
| 'nominal'
| 'temporal'
| 'ordinal'

export interface StatsEncodingField {
  channel: EncodingChannel
  field: string
  type: EncodingDataType
  bin?: boolean
  aggregate?: AggregateOp | null
}

export type StatsMark =
| 'bar'
| 'line'
| 'point'
| 'area'
| 'boxplot'
| 'histogram'

export interface StatsChartConfig {
  datasetId: string
  mark: StatsMark
  encodings: StatsEncodingField[]
  measures?: StatsMeasure[]
  title?: string | null
  description?: string | null
}

export interface StatsBuiltSpecResult {
  spec: any
  dataset: StatsDataset
}
```


## Paquete `editor-ext-stats`


### `packages/editor-ext-stats/package.json`

```json
{
  "name": "@disertare/editor-ext-stats",
  "version": "0.0.0",
  "main": "src/index.ts",
  "license": "MIT",
  "peerDependencies": {
    "@tiptap/core": "^3.10.2",
    "@tiptap/vue-3": "^3.10.2",
    "vue": "^3.5.0"
  },
  "dependencies": {
    "vega-lite": "^5.20.0",
    "vega-embed": "^6.26.0"
  }
}
```


### `packages/editor-ext-stats/src/index.ts`

```ts
// packages/editor-ext-stats/src/index.ts
export * from './StatsChartNode'
```


### `packages/editor-ext-stats/src/StatsChartNode.ts`

```ts
// packages/editor-ext-stats/src/StatsChartNode.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import StatsChartNodeView from './StatsChartNodeView.vue'

export type StatsFieldKind = 'numeric' | 'categorical' | 'datetime'

export interface StatsChartFieldMeta {
  key: string
  kind: StatsFieldKind
}

export interface StatsChartAttrs {
  id: string
  title?: string | null
  spec: any | null
  /**
   * F2.17 — dataset origen de la gráfica (id registrado en stats-adv).
   */
  datasetId?: string | null
  /**
   * F2.17 — receta textual (mini-lenguaje) usada para generar el gráfico.
   * Para F2.6 se deja en null.
   */
  recipe?: string | null
  /**
   * F2.17 — metadatos de campos implicados en el análisis.
   */
  fields?: StatsChartFieldMeta[] | null
  /**
   * ISO-8601 de creación del gráfico (para auditoría básica).
   */
  createdAt?: string | null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    statsChart: {
      /**
       * Inserta un gráfico estadístico (Vega-Lite) como nodo bloque.
       *
       * - F2.6: datos pequeños embebidos en el spec.
       * - F2.17: admite datasetId, recipe y fields para trazabilidad.
       */
      insertStatsChart: (attrs: Partial<StatsChartAttrs>) => ReturnType
    }
  }
}

function createId() {
  return `stats-${Math.random().toString(36).slice(2, 10)}`
}

export const StatsChartNode = Node.create({
  name: 'statsChart',

  group: 'block',
  atom: true,

  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      title: {
        default: null,
      },
      spec: {
        default: null,
      },
      datasetId: {
        default: null,
      },
      recipe: {
        default: null,
      },
      fields: {
        default: null,
      },
      createdAt: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-stats-chart]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(
        {
          'data-stats-chart': 'true',
          'data-stats-chart-id': HTMLAttributes.id,
          ...(HTMLAttributes.datasetId
          ? { 'data-stats-chart-dataset': HTMLAttributes.datasetId }
          : {}),
        },
        HTMLAttributes,
      ),
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(StatsChartNodeView)
  },

  addCommands() {
    return {
      insertStatsChart:
      (attrs: Partial<StatsChartAttrs>) =>
      ({ chain }) => {
        const id = attrs.id ?? createId()
        const now =
        attrs.createdAt ??
        new Date().toISOString()

        return chain()
        .focus()
        .insertContent({
          type: this.name,
          attrs: {
            id,
            title: attrs.title ?? null,
            spec: attrs.spec ?? null,
            datasetId: attrs.datasetId ?? null,
            recipe: attrs.recipe ?? null,
            fields: attrs.fields ?? null,
            createdAt: now,
          },
        })
        .run()
      },
    }
  },

  /**
   * Opcional: evita que ProseMirror colapse atributos al pegar/serializar.
   */
  addProseMirrorPlugins() {
    return []
  },

  /**
   * Utilidad interna para localizar nodos de tipo statsChart.
   */
  findStatsNodes(doc: ProseMirrorNode) {
    const nodes: { node: ProseMirrorNode; pos: number }[] = []
    doc.descendants((node, pos) => {
      // @ts-ignore
      if (node.type?.name === this.name) {
        nodes.push({ node, pos })
      }
    })
    return nodes
  },
})
```


### `packages/editor-ext-stats/src/StatsChartNodeView.vue`

```vue
<!-- packages/editor-ext-stats/src/StatsChartNodeView.vue -->
<template>
  <NodeViewWrapper
    as="figure"
    class="stats-chart-node"
    :data-stats-chart="attrs.id"
  >
    <figcaption
      v-if="attrs.title"
      class="stats-chart-title"
      data-stats-chart-title="true"
    >
      {{ attrs.title }}
    </figcaption>

    <div
      ref="chartEl"
      class="stats-chart-container"
      role="img"
      :aria-label="ariaLabel"
      data-stats-chart-content="true"
    />

    <p
      v-if="!attrs.spec"
      class="stats-chart-empty"
    >
      Sin configuración de gráfica. Usa el panel de Estadística para crear una.
    </p>

    <!-- F2.17: Metadatos mínimos de análisis (dataset + receta) -->
    <footer
      v-if="hasMeta"
      class="stats-chart-meta"
    >
      <span
        v-if="attrs.datasetId"
        class="stats-chart-meta-badge"
      >
        Dataset: {{ attrs.datasetId }}
      </span>

      <span
        v-if="attrs.recipe"
        class="stats-chart-meta-recipe"
      >
        {{ recipePreview }}
      </span>
    </footer>
  </NodeViewWrapper>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/vue-3'
import vegaEmbed, {
  type VisualizationSpec,
  type EmbedOptions,
} from 'vega-embed'

const props = defineProps<NodeViewProps>()

const chartEl = ref<HTMLElement | null>(null)
let view: any = null

const attrs = computed(() => props.node.attrs as {
  id: string
  title?: string | null
  spec: any | null
  datasetId?: string | null
  recipe?: string | null
  fields?: { key: string; kind: 'numeric' | 'categorical' | 'datetime' }[] | null
  createdAt?: string | null
})

const ariaLabel = computed(
  () => attrs.value.title || 'Gráfico estadístico generado en Disertare',
)

const hasMeta = computed(() => {
  return Boolean(attrs.value.datasetId || attrs.value.recipe)
})

const recipePreview = computed(() => {
  const r = attrs.value.recipe
  if (!r) return ''
  const trimmed = r.trim()
  if (trimmed.length <= 80) return trimmed
  return `${trimmed.slice(0, 77)}…`
})

function getPlainSpec(): VisualizationSpec | null {
  const raw = attrs.value.spec
  if (!raw) return null

  try {
    if (typeof raw === 'string') {
      return JSON.parse(raw) as VisualizationSpec
    }
    // Fallback defensivo: clonar para evitar mutaciones
    return JSON.parse(JSON.stringify(raw)) as VisualizationSpec
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Spec de estadística inválido:', e)
    return null
  }
}

async function renderChart() {
  if (!chartEl.value) return
  const spec = getPlainSpec()
  if (!spec) return

  if (view) {
    try {
      view.finalize()
    } catch {
      // ignoramos errores de finalización
    }
    view = null
  }

  const options: EmbedOptions = {
    actions: false,
    renderer: 'canvas',
  }

  try {
    const result = await vegaEmbed(chartEl.value, spec, options)
    view = result.view
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error al renderizar gráfico Vega-Lite:', e)
  }
}

onMounted(() => {
  void renderChart()
})

watch(
  () => attrs.value.spec,
  () => {
    void renderChart()
  },
)

onBeforeUnmount(() => {
  if (view) {
    try {
      view.finalize()
    } catch {
      // ignoramos errores
    }
  }
})
</script>

<style scoped>
.stats-chart-node {
  margin: 1.5rem 0;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e0e0f5;
  background: #faf9ff;
}

.stats-chart-title {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b3f72;
}

.stats-chart-container {
  width: 100%;
  min-height: 220px;
  max-height: 480px;
  overflow: hidden;
}

.stats-chart-empty {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #777;
}

/* F2.17: metadata del gráfico */
.stats-chart-meta {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 0.75rem;
  color: #4b5563;
}

.stats-chart-meta-badge {
  padding: 2px 6px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 500;
}

.stats-chart-meta-recipe {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  padding: 2px 4px;
  border-radius: 4px;
  background: #f3f4ff;
}
</style>
```


## Paquete `editor-ext-svg`


### `packages/editor-ext-svg/package.json`

```json
{
  "name": "@disertare/editor-ext-svg",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@tiptap/core": "^2.0.0",
    "@tiptap/vue-3": "^2.0.0"
  }
}
```


### `packages/editor-ext-svg/src/index.ts`

```ts
// packages/editor-ext-svg/src/index.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import SvgNodeView from './SvgNodeView.vue'
import type { SvgAttributes, SvgViewSettings } from './types'

export const SvgExtension = Node.create({
  name: 'svgAdv',

  group: 'block',
  draggable: true,
  atom: true,

  addAttributes() {
    const defaultView: SvgViewSettings = {
      zoom: 1,
      panX: 0,
      panY: 0,
      showGrid: true,
      showGuides: true,
      snapToGrid: true,
      snapToGuides: true,
    }

    return {
      svgMarkup: {
        default: null,
      },
      viewBox: {
        default: null,
      },
      layers: {
        default: [],
      },
      activeLayerId: {
        default: null,
      },
      selection: {
        default: {
          type: null,
          ids: [],
        },
      },
      view: {
        default: defaultView,
      },
      lastBoolOp: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="svg-adv"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'svg-adv',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setSvgAdv:
        (attrs: Partial<SvgAttributes>) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run()
        },
      updateSvgMarkup:
        (svgMarkup: string) =>
        ({ state, tr, dispatch }) => {
          const { selection } = state
          const node = selection.node
          if (!node || node.type.name !== this.name) return false

          const pos = selection.$from.pos
          const newAttrs = {
            ...node.attrs,
            svgMarkup,
          }

          if (dispatch) {
            dispatch(tr.setNodeMarkup(pos, node.type, newAttrs))
          }

          return true
        },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(SvgNodeView)
  },
})

export { SvgNodeView }
export * from './types'
```


### `packages/editor-ext-svg/src/SvgNodeView.vue`

```vue
<!-- packages/editor-ext-svg/src/SvgNodeView.vue -->
<template>
  <NodeViewWrapper class="svg-adv-node">
    <header class="svg-adv-toolbar">
      <div class="svg-adv-toolbar-left">
        <button type="button" class="svg-adv-btn" @click="onEditMarkup">
          {{ t('editor.ext.svg.edit_markup') }}
        </button>

        <button type="button" class="svg-adv-btn" @click="onPasteMarkup">
          {{ t('editor.ext.svg.paste_markup') }}
        </button>
      </div>

      <div class="svg-adv-toolbar-right">
        <label class="svg-adv-zoom">
          {{ t('editor.ext.svg.zoom') }}
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.05"
            v-model.number="zoomLocal"
            @input="onZoomChange"
          />
          <span class="svg-adv-zoom-value">
            {{ (zoomLocal * 100).toFixed(0) }}%
          </span>
        </label>
      </div>
    </header>

    <section class="svg-adv-canvas-container">
      <div class="svg-adv-canvas-inner" :style="{ transform: `scale(${zoomLocal})` }">
        <!-- Placeholder F2.19: indicador cuando el nodo tiene contenedores -->
        <div v-if="hasContainers" class="svg-container-indicator">
          Contenedores activos
        </div>

        <div v-if="!svgMarkup">
          <p class="svg-adv-empty">
            {{ t('editor.ext.svg.empty_placeholder') }}
          </p>
        </div>

        <div v-else class="svg-adv-svg-wrapper" v-html="safeMarkup" />
      </div>
    </section>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import type { SvgAttributes } from './types'

const props = defineProps(nodeViewProps)

const t = (key: string) => key

// --- NUEVO: resourceId
const svgAttrs = computed(() => props.node?.attrs as SvgAttributes)

if (!svgAttrs.value.resourceId && props.updateAttributes) {
  props.updateAttributes({
    ...svgAttrs.value,
    resourceId: `svg-${Math.random().toString(36).slice(2, 10)}`,
  })
}

const resourceId = computed(() => svgAttrs.value.resourceId)

// --- NUEVO F2.19: atributo booleano para mostrar contenedores
const hasContainers = computed(() => Boolean((props.node?.attrs as any).hasContainers))

// --- Rendering existente
const svgMarkup = computed(() => svgAttrs.value?.svgMarkup ?? null)
const safeMarkup = computed(() => svgMarkup.value ?? '')

const zoomLocal = ref(1)

watch(
  () => svgAttrs.value?.view?.zoom,
  (zoom) => {
    if (typeof zoom === 'number' && zoom > 0) {
      zoomLocal.value = zoom
    }
  },
  { immediate: true },
)

function updateAttributes(partial: Partial<SvgAttributes>) {
  props.updateAttributes?.({
    ...(props.node?.attrs ?? {}),
    ...partial,
  })
}

function onZoomChange() {
  const current = svgAttrs.value
  if (!current) return

  updateAttributes({
    ...current,
    view: {
      ...current.view,
      zoom: zoomLocal.value,
    },
  })
}

function onEditMarkup() {
  const current = svgMarkup.value ?? ''
  const edited = window.prompt('Editar SVG:', current)
  if (edited == null) return

  updateAttributes({
    ...svgAttrs.value,
    svgMarkup: edited,
  })
}

function onPasteMarkup() {
  const pasted = window.prompt('Pega SVG:')
  if (!pasted) return

  updateAttributes({
    ...svgAttrs.value,
    svgMarkup: pasted,
  })
}
</script>

<style scoped>
/* existentes */

.svg-container-indicator {
  position: absolute;
  background: #6a5af9dd;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  top: -20px;
  left: 0;
}
</style>
```


### `packages/editor-ext-svg/src/types.ts`

```ts
// packages/editor-ext-svg/src/types.ts

export type SvgBoolOp = 'union' | 'intersect' | 'subtract' | 'exclude'

export interface SvgLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  order: number
}

export interface SvgSelection {
  type: 'node' | 'path' | 'group' | null
  ids: string[]
}

export interface SvgViewSettings {
  zoom: number
  panX: number
  panY: number
  showGrid: boolean
  showGuides: boolean
  snapToGrid: boolean
  snapToGuides: boolean
}

export interface SvgAttributes {
  /** F2.19 — Identificador estable del recurso */
  resourceId?: string | null

  svgMarkup: string | null
  viewBox?: { x: number; y: number; width: number; height: number } | null

  layers: SvgLayer[]
  activeLayerId: string | null

  selection: SvgSelection

  view: SvgViewSettings

  lastBoolOp?: SvgBoolOp | null
}
```


## Paquete `editor-ext-tables`


### `packages/editor-ext-tables/package.json`

```json
{
  "name": "@disertare/editor-ext-tables",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  }
}
```


### `packages/editor-ext-tables/src/index.ts`

```ts
import { Table as TiptapTable } from '@tiptap/extension-table'
import TableRowBase from '@tiptap/extension-table-row'
import TableHeaderBase from '@tiptap/extension-table-header'
import TableCellBase from '@tiptap/extension-table-cell'
import type { NodeViewRenderer } from '@tiptap/core'
import { TableNodeView } from './TableNodeView'

/**
 * Nodo principal de tabla.
 *
 * Mantiene el nombre de exportación `Table` porque así lo importa Editor.vue:
 *
 *   import { Table } from '@disertare/editor-ext-tables'
 */
export const Table = TiptapTable.extend({
  group: 'block',

  addAttributes() {
    return {
      ...this.parent?.(),
                                        rows: {
                                          default: 3,
                                        },
                                        cols: {
                                          default: 3,
                                        },
                                        hasHeader: {
                                          default: true,
                                        },
    }
  },

  addNodeView(): NodeViewRenderer {
    return TableNodeView
  },
})

/**
 * Fila y encabezado se dejan sin cambios por ahora.
 * Si más adelante se quieren attrs extra, se pueden extender aquí.
 */
export const TableRow = TableRowBase
export const TableHeader = TableHeaderBase

/**
 * Celda de tabla extendida con attrs para F2.1:
 * - formula: string | null → fórmula original (si empieza con "=")
 * - value:   string | null → valor calculado o literal
 * - error:   string | null → código de error tipo "#REF!", "#DIV/0!", etc.
 *
 * Las tablas sin fórmulas siguen funcionando porque estos attrs
 * son opcionales y con default null.
 */
export const TableCell = TableCellBase.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
                                              formula: {
                                          default: null,
                                              },
                                              value: {
                                          default: null,
                                              },
                                              error: {
                                          default: null,
                                              },
    }
  },
})

/**
 * Export por defecto conveniente si quieres registrar todo el paquete
 * de golpe en el Editor:
 *
 *   import TablesExtensions from '@disertare/editor-ext-tables'
 *   ...
 *   extensions: [
 *     StarterKit,
 *     ...TablesExtensions,
 *   ]
 */
export default [Table, TableRow, TableHeader, TableCell]
```


### `packages/editor-ext-tables/src/TableNodeView.ts`

```ts
// packages/editor-ext-tables/src/TableNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TableNodeViewComponent from './TableNodeView.vue'

export const TableNodeView: NodeViewRenderer =
VueNodeViewRenderer(TableNodeViewComponent)
```


### `packages/editor-ext-tables/src/TableNodeView.vue`

```vue
<template>
  <NodeViewWrapper
    class="table-node"
    :aria-label="t('editor.ext.tables.edit_table')"
  >
    <div class="table-toolbar">
      <button
        @click="addRow"
        :aria-label="t('editor.ext.tables.add_row')"
      >
        + Fila
      </button>
      <button
        @click="addColumn"
        :aria-label="t('editor.ext.tables.add_column')"
      >
        + Col
      </button>
      <button
        @click="deleteRow"
        :aria-label="t('editor.ext.tables.delete_row')"
      >
        - Fila
      </button>
      <button
        @click="deleteColumn"
        :aria-label="t('editor.ext.tables.delete_column')"
      >
        - Col
      </button>
      <button
        @click="toggleHeader"
        :aria-label="t('editor.ext.tables.toggle_header')"
      >
        {{ hasHeader ? 'Sin encabezado' : 'Con encabezado' }}
      </button>
      <input
        v-model="formulaInput"
        type="text"
        class="formula-bar"
        :placeholder="t('editor.ext.tables.formula_placeholder')"
        @focus="onFormulaFocus"
        @keydown.enter.prevent="applyFormula"
      />
    </div>

    <div class="table-frame">
      <table>
        <thead v-if="hasHeader">
          <tr>
            <th
              v-for="col in numCols"
              :key="'header-' + col"
              scope="col"
              @click="handleHeaderClick(col - 1, $event)"
            >
              {{ getHeaderLabel(col) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in numRows"
            :key="'row-' + row"
          >
            <td
              v-for="col in numCols"
              :key="'cell-' + row + '-' + col"
              :class="{ selected: isSelected(row - 1, col - 1) }"
              contenteditable="true"
              :data-row="row - 1"
              :data-col="col - 1"
              @blur="commitCellOnBlur(row - 1, col - 1, $event)"
              @keydown.enter.prevent="commitCellOnEnter(row - 1, col - 1, $event)"
              @click="handleCellClick(row - 1, col - 1, $event)"
              v-text="getCellDisplay(row - 1, col - 1)"
            />
          </tr>
        </tbody>
      </table>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

// ---------------------------------------------------------------------------
// Estado base
// ---------------------------------------------------------------------------

const hasHeader = computed<boolean>(() => props.node.attrs.hasHeader ?? true)

const numRows = ref<number>(props.node.attrs.rows ?? 3)
const numCols = ref<number>(props.node.attrs.cols ?? 3)

const cellValue = ref<string[][]>([])
const cellFormula = ref<(string | null)[][]>([])
const cellError = ref<(string | null)[][]>([])

const selectedCell = ref<{ row: number; col: number } | null>(null)

const formulaInput = ref('')
const formulaTarget = ref<{ row: number; col: number } | null>(null)
const formulaAnchor = ref<{ row: number; col: number } | null>(null)

const t = (key: string) => key

const isBuildingFormula = computed(() =>
  formulaInput.value.trim().startsWith('='),
)

// ---------------------------------------------------------------------------
// Inicialización desde el nodo ProseMirror
// ---------------------------------------------------------------------------

const initTable = () => {
  const suggestedRows =
    props.node.attrs.rows ?? props.node.content.childCount ?? 3

  const firstRowNode = props.node.content.childCount
    ? props.node.content.child(0)
    : null

  const suggestedCols =
    props.node.attrs.cols ??
    (firstRowNode && firstRowNode.content
      ? firstRowNode.content.childCount
      : 3)

  numRows.value = suggestedRows || 3
  numCols.value = suggestedCols || 3

  const values: string[][] = []
  const formulas: (string | null)[][] = []
  const errors: (string | null)[][] = []

  for (let r = 0; r < numRows.value; r++) {
    const rowNode =
      r < props.node.content.childCount
        ? props.node.content.child(r)
        : null

    const rowValues: string[] = []
    const rowFormulas: (string | null)[] = []
    const rowErrors: (string | null)[] = []

    for (let c = 0; c < numCols.value; c++) {
      const cellNode =
        rowNode && c < rowNode.content.childCount
          ? rowNode.content.child(c)
          : null

      const rawText = cellNode?.textContent ?? ''
      const normalizedText = rawText.replace(/\u00A0/g, ' ').trim()

      const formulaAttr =
        (cellNode?.attrs && (cellNode.attrs as any).formula) ?? null
      const valueAttr =
        (cellNode?.attrs && (cellNode.attrs as any).value) ?? null
      const errorAttr =
        (cellNode?.attrs && (cellNode.attrs as any).error) ?? null

      const effectiveValue =
        typeof valueAttr === 'string' && valueAttr.length > 0
          ? valueAttr
          : normalizedText

      rowValues.push(effectiveValue)
      rowFormulas.push(
        typeof formulaAttr === 'string' && formulaAttr.length > 0
          ? formulaAttr
          : null,
      )
      rowErrors.push(
        typeof errorAttr === 'string' && errorAttr.length > 0
          ? errorAttr
          : null,
      )
    }

    values.push(rowValues)
    formulas.push(rowFormulas)
    errors.push(rowErrors)
  }

  cellValue.value = values
  cellFormula.value = formulas
  cellError.value = errors
}

initTable()

onMounted(() => {
  initTable()
})

watch(
  () => props.node.attrs,
  () => {
    initTable()
  },
)

// ---------------------------------------------------------------------------
// Helpers de vista
// ---------------------------------------------------------------------------

const getHeaderLabel = (col: number) => {
  let n = col - 1
  let label = ''
  while (n >= 0) {
    label = String.fromCharCode((n % 26) + 65) + label
    n = Math.floor(n / 26) - 1
  }
  return label
}

const cellRefFromCoords = (row: number, col: number) =>
  `${getHeaderLabel(col + 1)}${row + 1}`

const isSelected = (row: number, col: number) =>
  selectedCell.value?.row === row && selectedCell.value?.col === col

const selectCell = (row: number, col: number) => {
  selectedCell.value = { row, col }
  const formula = cellFormula.value[row]?.[col] ?? null
  const value = cellValue.value[row]?.[col] ?? ''
  formulaInput.value = formula ?? value
}

const getCellDisplay = (row: number, col: number) => {
  const error = cellError.value[row]?.[col]
  if (error) return error
  return cellValue.value[row]?.[col] ?? ''
}

// ---------------------------------------------------------------------------
// Edición básica (literal vs fórmula) + comportamiento de Enter
// ---------------------------------------------------------------------------

const ensureCellExists = (row: number, col: number) => {
  if (!cellValue.value[row]) {
    for (let r = cellValue.value.length; r <= row; r++) {
      cellValue.value[r] = Array(numCols.value).fill('')
      cellFormula.value[r] = Array(numCols.value).fill(null)
      cellError.value[r] = Array(numCols.value).fill(null)
    }
  }

  if (cellValue.value[row][col] === undefined) {
    for (let c = cellValue.value[row].length; c <= col; c++) {
      cellValue.value[row][c] = ''
      cellFormula.value[row][c] = null
      cellError.value[row][c] = null
    }
  }
}

const commitCellCore = (row: number, col: number, text: string) => {
  ensureCellExists(row, col)

  if (text.startsWith('=')) {
    cellFormula.value[row][col] = text.trim()
    // valor y error se recalculan globalmente
  } else {
    cellFormula.value[row][col] = null
    cellValue.value[row][col] = text
    cellError.value[row][col] = null
  }

  recalculateAll()
}

const commitCellOnBlur = (row: number, col: number, event: FocusEvent) => {
  const target = event.target as HTMLTableCellElement
  const raw = target.innerText ?? ''
  const text = raw.replace(/\u00A0/g, ' ').trim()
  commitCellCore(row, col, text)
}

const moveFocusDown = (
  row: number,
  col: number,
  currentTd: HTMLTableCellElement,
) => {
  const table = currentTd.closest('table')
  if (!table) return

  // si hay fila siguiente, enfocamos la misma columna en la fila de abajo
  if (row + 1 < numRows.value) {
    const nextRow = row + 1
    const selector = `td[data-row="${nextRow}"][data-col="${col}"]`
    const nextTd =
      table.querySelector<HTMLTableCellElement>(selector)
    if (nextTd) {
      nextTd.focus()
      selectCell(nextRow, col)
      return
    }
  }

  // si no hay fila siguiente, simplemente salimos del modo edición
  currentTd.blur()
}

const commitCellOnEnter = (row: number, col: number, event: KeyboardEvent) => {
  const target = event.target as HTMLTableCellElement
  const raw = target.innerText ?? ''
  const text = raw.replace(/\u00A0/g, ' ').trim()
  commitCellCore(row, col, text)
  moveFocusDown(row, col, target)
}

// ---------------------------------------------------------------------------
// Barra de fórmulas y construcción con el mouse
// ---------------------------------------------------------------------------

const onFormulaFocus = () => {
  formulaTarget.value = selectedCell.value ? { ...selectedCell.value } : null
  formulaAnchor.value = formulaTarget.value
}

const insertRefIntoFormula = (ref: string, replaceLastRange = false) => {
  let value = formulaInput.value || ''

  if (!value) {
    formulaInput.value = `=${ref}`
    return
  }

  if (replaceLastRange) {
    formulaInput.value = value.replace(
      /([A-Z]+[0-9]+(:[A-Z]+[0-9]+)?)$/i,
      ref,
    )
    return
  }

  const lastChar = value[value.length - 1]
  if (lastChar === '(' || lastChar === ',' || lastChar === '=') {
    formulaInput.value = value + ref
  } else {
    formulaInput.value = value + ref
  }
}

const handleCellClick = (row: number, col: number, event: MouseEvent) => {
  if (isBuildingFormula.value) {
    const ref = cellRefFromCoords(row, col)

    if (event.shiftKey && (formulaAnchor.value || formulaTarget.value)) {
      const anchor = formulaAnchor.value ?? formulaTarget.value!
      const rowStart = Math.min(anchor.row, row)
      const rowEnd = Math.max(anchor.row, row)
      const colStart = Math.min(anchor.col, col)
      const colEnd = Math.max(anchor.col, col)

      const startRef = cellRefFromCoords(rowStart, colStart)
      const endRef = cellRefFromCoords(rowEnd, colEnd)
      const rangeRef = `${startRef}:${endRef}`

      insertRefIntoFormula(rangeRef, true)
    } else {
      formulaAnchor.value = { row, col }
      insertRefIntoFormula(ref, false)
    }
  } else {
    selectCell(row, col)
  }
}

const handleHeaderClick = (col: number, event: MouseEvent) => {
  if (!isBuildingFormula.value) return

  const startRef = cellRefFromCoords(0, col)
  const endRef = cellRefFromCoords(numRows.value - 1, col)
  const rangeRef = `${startRef}:${endRef}`

  insertRefIntoFormula(rangeRef, event.shiftKey)
}

const applyFormula = () => {
  const target = formulaTarget.value ?? selectedCell.value
  if (!target) return

  const { row, col } = target
  ensureCellExists(row, col)

  const txt = formulaInput.value.trim()
  if (txt.startsWith('=')) {
    cellFormula.value[row][col] = txt
  } else {
    cellFormula.value[row][col] = null
    cellValue.value[row][col] = txt
    cellError.value[row][col] = null
  }

  recalculateAll()

  formulaTarget.value = null
  formulaAnchor.value = null
}

// ---------------------------------------------------------------------------
// Motor de fórmulas: helpers generales
// ---------------------------------------------------------------------------

type FormulaFn = 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT'

const columnLabelToIndex = (label: string): number => {
  let result = 0
  const upper = label.toUpperCase()
  for (let i = 0; i < upper.length; i++) {
    const code = upper.charCodeAt(i)
    if (code < 65 || code > 90) return -1
    result = result * 26 + (code - 65 + 1)
  }
  return result - 1
}

const parseCellRef = (ref: string) => {
  const match = /^([A-Z]+)(\d+)$/.exec(ref.trim().toUpperCase())
  if (!match) return null
  const col = columnLabelToIndex(match[1])
  const row = Number.parseInt(match[2], 10) - 1
  if (Number.isNaN(row) || row < 0 || col < 0) return null
  return { row, col }
}

// rangos tipo A1:B3
const parseRange = (expr: string) => {
  const trimmed = expr.trim().toUpperCase()
  if (!trimmed) return [] as { row: number; col: number }[]

  const parts = trimmed.split(':')
  if (parts.length === 1) {
    const single = parseCellRef(parts[0])
    return single ? [single] : []
  }
  if (parts.length !== 2) return []

  const start = parseCellRef(parts[0])
  const end = parseCellRef(parts[1])
  if (!start || !end) return []

  const rowStart = Math.min(start.row, end.row)
  const rowEnd = Math.max(start.row, end.row)
  const colStart = Math.min(start.col, end.col)
  const colEnd = Math.max(start.col, end.col)

  const cells: { row: number; col: number }[] = []
  for (let r = rowStart; r <= rowEnd; r++) {
    for (let c = colStart; c <= colEnd; c++) {
      cells.push({ row: r, col: c })
    }
  }
  return cells
}

const collectCellsFromArg = (arg: string) => {
  const segments = arg
    .split(/[;,]/)
    .map(part => part.trim())
    .filter(Boolean)

  const all: { row: number; col: number }[] = []
  for (const segment of segments) {
    all.push(...parseRange(segment))
  }
  return all
}

const getNumericValueFromCell = (row: number, col: number) => {
  const raw = cellValue.value[row]?.[col] ?? ''
  if (!raw) return { value: NaN, isEmpty: true }

  if (raw.startsWith('#')) {
    return { value: NaN, isEmpty: false }
  }

  const normalized = raw.replace(',', '.')
  const num = Number.parseFloat(normalized)
  return { value: num, isEmpty: false }
}

// ---------------------------------------------------------------------------
// Parser aritmético + evaluación con errores diferenciados
// ---------------------------------------------------------------------------

type ArithTokenType = 'number' | 'cell' | 'op' | 'paren'
interface ArithToken {
  type: ArithTokenType
  value: string
}

type ExprNode =
  | { type: 'number'; value: number }
  | { type: 'cell'; row: number; col: number }
  | { type: 'unary'; op: '+' | '-'; arg: ExprNode }
  | {
      type: 'binary'
      op: '+' | '-' | '*' | '/' | '^'
      left: ExprNode
      right: ExprNode
    }

type EvalKind = 'ok' | 'div0' | 'value'
interface EvalResultOk {
  kind: 'ok'
  value: number
}
interface EvalResultErr {
  kind: 'div0' | 'value'
}
type EvalResult = EvalResultOk | EvalResultErr

const tokenizeArithmetic = (expr: string): ArithToken[] | null => {
  const tokens: ArithToken[] = []
  let i = 0
  const s = expr

  while (i < s.length) {
    const ch = s[i]

    if (/\s/.test(ch)) {
      i++
      continue
    }

    if ('+-*/^'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch })
      i++
      continue
    }

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = ''
      while (i < s.length) {
        const c = s[i]
        if ((c >= '0' && c <= '9') || c === '.') {
          numStr += c
          i++
        } else break
      }
      if (!numStr) return null
      tokens.push({ type: 'number', value: numStr })
      continue
    }

    if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) {
      let colPart = ''
      while (i < s.length) {
        const c = s[i]
        if (
          (c >= 'A' && c <= 'Z') ||
          (c >= 'a' && c <= 'z')
        ) {
          colPart += c
          i++
        } else break
      }
      let rowPart = ''
      while (i < s.length) {
        const c = s[i]
        if (c >= '0' && c <= '9') {
          rowPart += c
          i++
        } else break
      }
      if (!rowPart) return null
      tokens.push({ type: 'cell', value: `${colPart}${rowPart}`.toUpperCase() })
      continue
    }

    return null
  }

  return tokens
}

const evaluateArithmeticExpression = (expr: string): EvalResult => {
  const tokens = tokenizeArithmetic(expr)
  if (!tokens || !tokens.length) return { kind: 'value' }

  let index = 0
  const peek = () => tokens[index]
  const consume = () => tokens[index++]

  const parsePrimary = (): ExprNode | null => {
    const tok = peek()
    if (!tok) return null

    if (tok.type === 'number') {
      consume()
      const value = Number.parseFloat(tok.value)
      if (Number.isNaN(value)) return null
      return { type: 'number', value }
    }

    if (tok.type === 'cell') {
      consume()
      const ref = parseCellRef(tok.value)
      if (!ref) return null
      return { type: 'cell', row: ref.row, col: ref.col }
    }

    if (tok.type === 'paren' && tok.value === '(') {
      consume()
      const node = parseExpression()
      const closing = peek()
      if (!closing || closing.type !== 'paren' || closing.value !== ')') {
        return null
      }
      consume()
      return node
    }

    return null
  }

  const parseUnary = (): ExprNode | null => {
    const tok = peek()
    if (tok && tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
      consume()
      const arg = parseUnary()
      if (!arg) return null
      return { type: 'unary', op: tok.value as '+' | '-', arg }
    }
    return parsePrimary()
  }

  const parsePower = (): ExprNode | null => {
    let node = parseUnary()
    if (!node) return null

    while (true) {
      const tok = peek()
      if (!tok || tok.type !== 'op' || tok.value !== '^') break
      consume()
      const right = parseUnary()
      if (!right) return null
      node = { type: 'binary', op: '^', left: node, right }
    }

    return node
  }

  const parseMulDiv = (): ExprNode | null => {
    let node = parsePower()
    if (!node) return null

    while (true) {
      const tok = peek()
      if (
        !tok ||
        tok.type !== 'op' ||
        (tok.value !== '*' && tok.value !== '/')
      ) {
        break
      }
      const op = tok.value as '*' | '/'
      consume()
      const right = parsePower()
      if (!right) return null
      node = { type: 'binary', op, left: node, right }
    }

    return node
  }

  const parseExpression = (): ExprNode | null => {
    let node = parseMulDiv()
    if (!node) return null

    while (true) {
      const tok = peek()
      if (
        !tok ||
        tok.type !== 'op' ||
        (tok.value !== '+' && tok.value !== '-')
      ) {
        break
      }
      const op = tok.value as '+' | '-'
      consume()
      const right = parseMulDiv()
      if (!right) return null
      node = { type: 'binary', op, left: node, right }
    }

    return node
  }

  const ast = parseExpression()
  if (!ast || index !== tokens.length) return { kind: 'value' }

  const evalNode = (node: ExprNode): EvalResult => {
    switch (node.type) {
      case 'number':
        return { kind: 'ok', value: node.value }
      case 'cell': {
        const { value } = getNumericValueFromCell(node.row, node.col)
        if (Number.isNaN(value)) return { kind: 'value' }
        return { kind: 'ok', value }
      }
      case 'unary': {
        const res = evalNode(node.arg)
        if (res.kind !== 'ok') return res
        return { kind: 'ok', value: node.op === '-' ? -res.value : res.value }
      }
      case 'binary': {
        const left = evalNode(node.left)
        if (left.kind !== 'ok') return left
        const right = evalNode(node.right)
        if (right.kind !== 'ok') return right
        switch (node.op) {
          case '+':
            return { kind: 'ok', value: left.value + right.value }
          case '-':
            return { kind: 'ok', value: left.value - right.value }
          case '*':
            return { kind: 'ok', value: left.value * right.value }
          case '/':
            if (right.value === 0) return { kind: 'div0' }
            return { kind: 'ok', value: left.value / right.value }
          case '^':
            return { kind: 'ok', value: left.value ** right.value }
          default:
            return { kind: 'value' }
        }
      }
      default:
        return { kind: 'value' }
    }
  }

  return evalNode(ast)
}

// eval de funciones + aritmética, sin REF ni CYCLE (se manejan afuera)
const evaluateFormulaCore = (raw: string): EvalResult => {
  let expr = raw.trim()
  if (!expr) return { kind: 'value' }
  if (expr.startsWith('=')) expr = expr.slice(1)

  const upper = expr.toUpperCase()
  const fnMatch = /^([A-Z]+)\((.+)\)$/.exec(upper)

  if (fnMatch) {
    const fn = fnMatch[1] as FormulaFn
    const arg = fnMatch[2].trim()

    if (['SUM', 'AVG', 'MIN', 'MAX', 'COUNT'].includes(fn)) {
      const cells = collectCellsFromArg(arg)
      if (!cells.length && fn !== 'COUNT') {
        return { kind: 'value' }
      }

      const values: number[] = []
      let nonEmptyCount = 0

      for (const { row, col } of cells) {
        const { value, isEmpty } = getNumericValueFromCell(row, col)
        if (isEmpty) continue
        nonEmptyCount++
        if (!Number.isNaN(value)) values.push(value)
      }

      if (fn === 'COUNT') {
        return { kind: 'ok', value: nonEmptyCount }
      }

      if (!values.length) return { kind: 'value' }

      switch (fn) {
        case 'SUM':
          return {
            kind: 'ok',
            value: values.reduce((acc, v) => acc + v, 0),
          }
        case 'AVG': {
          const sum = values.reduce((acc, v) => acc + v, 0)
          if (values.length === 0) return { kind: 'value' }
          return { kind: 'ok', value: sum / values.length }
        }
        case 'MIN':
          return { kind: 'ok', value: Math.min(...values) }
        case 'MAX':
          return { kind: 'ok', value: Math.max(...values) }
        default:
          return { kind: 'value' }
      }
    }
  }

  return evaluateArithmeticExpression(expr)
}

// ---------------------------------------------------------------------------
// Grafo de dependencias + recálculo global
// ---------------------------------------------------------------------------

const collectDependenciesFromFormula = (
  formula: string,
  rows: number,
  cols: number,
): { deps: { row: number; col: number }[]; hasRefError: boolean } => {
  const deps: { row: number; col: number }[] = []
  let hasRefError = false

  let expr = formula.trim()
  if (!expr.startsWith('=')) return { deps, hasRefError }
  expr = expr.slice(1)
  const upper = expr.toUpperCase()

  const addDep = (coord: { row: number; col: number } | null) => {
    if (!coord) {
      hasRefError = true
      return
    }
    if (
      coord.row < 0 ||
      coord.row >= rows ||
      coord.col < 0 ||
      coord.col >= cols
    ) {
      hasRefError = true
      return
    }
    deps.push(coord)
  }

  const fnMatch = /^([A-Z]+)\((.+)\)$/.exec(upper)
  if (fnMatch) {
    const fn = fnMatch[1]
    const arg = fnMatch[2]
    if (['SUM', 'AVG', 'MIN', 'MAX', 'COUNT'].includes(fn)) {
      const cells = collectCellsFromArg(arg)
      for (const c of cells) addDep(c)
      return { deps, hasRefError }
    }
  }

  const tokens = tokenizeArithmetic(expr)
  if (!tokens) return { deps, hasRefError }

  for (const tok of tokens) {
    if (tok.type === 'cell') {
      const coord = parseCellRef(tok.value)
      addDep(coord)
    }
  }

  return { deps, hasRefError }
}

const recalculateAll = () => {
  const rows = numRows.value
  const cols = numCols.value

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!cellFormula.value[r]?.[c]) {
        cellError.value[r][c] = null
      }
    }
  }

  type Key = string
  const key = (r: number, c: number): Key => `${r},${c}`
  const fromKey = (k: Key) => {
    const [rs, cs] = k.split(',')
    return { row: Number.parseInt(rs, 10), col: Number.parseInt(cs, 10) }
  }

  const depsMap = new Map<Key, Key[]>()
  const indegree = new Map<Key, number>()
  const formulaNodes: Key[] = []
  const refErrorCells = new Set<Key>()

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const f = cellFormula.value[r]?.[c]
      if (!f) continue

      const k = key(r, c)
      const { deps, hasRefError } = collectDependenciesFromFormula(
        f,
        rows,
        cols,
      )

      if (hasRefError) {
        cellError.value[r][c] = '#REF!'
        cellValue.value[r][c] = '#REF!'
        refErrorCells.add(k)
        continue
      }

      formulaNodes.push(k)
      indegree.set(k, 0)
      depsMap.set(
        k,
        deps.map(d => key(d.row, d.col)),
      )
    }
  }

  const nodeSet = new Set(formulaNodes)
  for (const k of formulaNodes) {
    const deps = depsMap.get(k) ?? []
    for (const d of deps) {
      if (!nodeSet.has(d)) continue
      indegree.set(d, (indegree.get(d) ?? 0) + 1)
    }
  }

  const queue: Key[] = []
  for (const k of formulaNodes) {
    if ((indegree.get(k) ?? 0) === 0 && !refErrorCells.has(k)) {
      queue.push(k)
    }
  }

  const topo: Key[] = []
  while (queue.length) {
    const k = queue.shift() as Key
    topo.push(k)
    const deps = depsMap.get(k) ?? []
    for (const d of deps) {
      if (!nodeSet.has(d) || refErrorCells.has(d)) continue
      const newDeg = (indegree.get(d) ?? 0) - 1
      indegree.set(d, newDeg)
      if (newDeg === 0) queue.push(d)
    }
  }

  const processed = new Set(topo)
  const cyclic = formulaNodes.filter(
    k => !processed.has(k) && !refErrorCells.has(k),
  )

  for (const k of cyclic) {
    const { row, col } = fromKey(k)
    cellError.value[row][col] = '#CYCLE!'
    cellValue.value[row][col] = '#CYCLE!'
  }

  for (const k of topo) {
    if (refErrorCells.has(k)) continue
    if (cyclic.includes(k)) continue

    const { row, col } = fromKey(k)
    const f = cellFormula.value[row]?.[col]
    if (!f) continue

    const res = evaluateFormulaCore(f)
    if (res.kind === 'ok') {
      cellValue.value[row][col] = String(res.value)
      cellError.value[row][col] = null
    } else if (res.kind === 'div0') {
      cellValue.value[row][col] = '#DIV/0!'
      cellError.value[row][col] = '#DIV/0!'
    } else {
      cellValue.value[row][col] = '#VALUE!'
      cellError.value[row][col] = '#VALUE!'
    }
  }

  syncToNode()
}

// ---------------------------------------------------------------------------
// Sincronización con ProseMirror
// ---------------------------------------------------------------------------

const syncToNode = () => {
  const { editor } = props
  const { state, view } = editor
  const { schema } = state

  const tableType = schema.nodes.table
  const rowType = schema.nodes.tableRow
  const cellType = schema.nodes.tableCell

  if (!tableType || !rowType || !cellType) {
    console.warn(
      '[tables] tipos de nodo table/tableRow/tableCell no encontrados en schema',
    )
    return
  }

  const rowsNodes = []

  for (let r = 0; r < numRows.value; r++) {
    const cellsNodes = []
    for (let c = 0; c < numCols.value; c++) {
      const value = cellValue.value[r]?.[c] ?? ''
      const formula = cellFormula.value[r]?.[c] ?? null
      const error = cellError.value[r]?.[c] ?? null

      const attrs: Record<string, any> = {
        formula,
        value,
        error,
      }

      const content = value && !value.startsWith('#') ? [schema.text(value)] : []
      const cellNode =
        cellType.createAndFill(attrs, content) ||
        cellType.create(attrs, content)
      cellsNodes.push(cellNode)
    }
    const rowNode =
      rowType.createAndFill({}, cellsNodes) ||
      rowType.create({}, cellsNodes)
    rowsNodes.push(rowNode)
  }

  const newTableNode =
    tableType.create(
      {
        ...props.node.attrs,
        rows: numRows.value,
        cols: numCols.value,
        hasHeader: hasHeader.value,
      },
      rowsNodes,
    )

  const pos = props.getPos()
  if (typeof pos !== 'number') {
    console.warn('[tables] getPos() no es numérico, no se puede reemplazar nodo')
    return
  }

  const tr = state.tr.replaceWith(pos, pos + props.node.nodeSize, newTableNode)
  view.dispatch(tr)
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

const addRow = () => {
  const newVals = Array(numCols.value).fill('')
  const newFormulas = Array(numCols.value).fill(null)
  const newErrors = Array(numCols.value).fill(null)

  cellValue.value.push(newVals)
  cellFormula.value.push(newFormulas)
  cellError.value.push(newErrors)

  numRows.value++
  recalculateAll()
}

const addColumn = () => {
  for (let r = 0; r < numRows.value; r++) {
    if (!cellValue.value[r]) {
      cellValue.value[r] = []
      cellFormula.value[r] = []
      cellError.value[r] = []
    }
    cellValue.value[r].push('')
    cellFormula.value[r].push(null)
    cellError.value[r].push(null)
  }
  numCols.value++
  recalculateAll()
}

const deleteRow = () => {
  if (numRows.value <= 1) return
  cellValue.value.pop()
  cellFormula.value.pop()
  cellError.value.pop()
  numRows.value--
  recalculateAll()
}

const deleteColumn = () => {
  if (numCols.value <= 1) return
  for (let r = 0; r < numRows.value; r++) {
    cellValue.value[r]?.pop()
    cellFormula.value[r]?.pop()
    cellError.value[r]?.pop()
  }
  numCols.value--
  recalculateAll()
}

const toggleHeader = () => {
  props.editor
    .chain()
    .focus()
    .command(({ tr }) => {
      const pos = props.getPos()
      if (typeof pos !== 'number') return false
      const node = tr.doc.nodeAt(pos)
      if (!node) return false
      const newAttrs = {
        ...node.attrs,
        hasHeader: !hasHeader.value,
      }
      tr.setNodeMarkup(pos, node.type, newAttrs, node.marks)
      return true
    })
    .run()
}
</script>

<style scoped>
.table-node {
  margin: 1em 0;
  padding: 6px;
  border-radius: 6px;
  border: 1px dashed #6a5af944;
  background: rgba(106, 90, 249, 0.02);
}

.table-toolbar {
  margin-bottom: 4px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.table-toolbar button {
  padding: 2px 6px;
  font-size: 12px;
}

.formula-bar {
  flex: 1;
  min-width: 120px;
  padding: 2px 4px;
  font-size: 12px;
}

.table-frame {
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  border: 1px solid #d0c8ff;
  padding: 4px 6px;
  min-width: 40px;
  font-size: 13px;
  background: #ffffff;
  direction: ltr;
}

th {
  background: #f3efff;
  font-weight: 600;
}

td.selected {
  outline: 2px solid #6a5af9aa;
}
</style>
```


## Paquete `editor-parts`


### `packages/editor-parts/package.json`

```json
{
  "name": "@disertare/editor-parts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  }
}
```


### `packages/editor-parts/src/index.ts`

```ts
// packages/editor-parts/src/index.ts
import type {
  AcademicFormatId,
  AcademicPartId,
  AcademicFormatDefinition,
  AcademicPartDefinition,
} from './types'

export type {
  AcademicFormatId,
  AcademicPartId,
  AcademicFormatDefinition,
  AcademicPartDefinition,
} from './types'

export const defaultAcademicFormats: AcademicFormatDefinition[] = [
  {
    id: 'thesis',
    label: 'Tesis',
    description:
    'Estructura típica de trabajos de tesis y disertaciones académicas.',
    parts: [
      {
        id: 'cover',
        label: { es: 'Portada', en: 'Cover' },
        defaultSelected: true,
          includeInToc: false,
      },
      {
        id: 'dedication',
        label: { es: 'Dedicatoria', en: 'Dedication' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'acknowledgements',
        label: { es: 'Agradecimientos', en: 'Acknowledgements' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'abstract',
        label: { es: 'Resumen / Abstract', en: 'Abstract' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'results',
        label: { es: 'Resultados', en: 'Results' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'conclusions',
        label: { es: 'Conclusiones', en: 'Conclusions' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'references',
        label: { es: 'Bibliografía / Referencias', en: 'References' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'appendices',
        label: { es: 'Anexos', en: 'Appendices' },
        defaultSelected: false,
          includeInToc: true,
      },
      {
        id: 'ethics',
        label: { es: 'Declaraciones éticas', en: 'Ethics statements' },
        defaultSelected: false,
          includeInToc: true,
      },
    ],
  },
{
  id: 'article',
  label: 'Artículo',
  description: 'Estructura típica de artículos académicos.',
  parts: [
    {
      id: 'cover',
      label: { es: 'Portada (opcional)', en: 'Cover (optional)' },
      defaultSelected: false,
        includeInToc: false,
    },
    {
      id: 'abstract',
      label: { es: 'Resumen / Abstract', en: 'Abstract' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'results',
      label: { es: 'Resultados', en: 'Results' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'conclusions',
      label: { es: 'Conclusiones', en: 'Conclusions' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'references',
      label: { es: 'Bibliografía / Referencias', en: 'References' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'appendices',
      label: { es: 'Anexos', en: 'Appendices' },
      defaultSelected: false,
        includeInToc: true,
    },
  ],
},
{
  id: 'report',
  label: 'Reporte',
  description: 'Estructura sugerida para reportes técnicos o ejecutivos.',
  parts: [
    {
      id: 'cover',
      label: { es: 'Portada', en: 'Cover' },
      defaultSelected: true,
        includeInToc: false,
    },
    {
      id: 'executiveSummary',
      label: { es: 'Resumen ejecutivo', en: 'Executive summary' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'results',
      label: { es: 'Resultados', en: 'Results' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'conclusionsRecommendations',
      label: {
        es: 'Conclusiones / Recomendaciones',
        en: 'Conclusions / Recommendations',
      },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'references',
      label: { es: 'Referencias', en: 'References' },
      defaultSelected: false,
        includeInToc: true,
    },
    {
      id: 'appendices',
      label: { es: 'Anexos', en: 'Appendices' },
      defaultSelected: false,
        includeInToc: true,
    },
  ],
},
]
```


### `packages/editor-parts/src/templates.ts`

```ts
// packages/editor-parts/src/templates.ts
import type {
  AcademicFormatTemplate,
  AcademicPartDefinition,
  AcademicFormatId,
} from './types'

const es = 'es-MX'
const en = 'en-US'

function createPart(def: {
  id: string
  kind: AcademicPartDefinition['kind']
  required: boolean
  labelEs: string
  labelEn: string
  descriptionEs?: string
  descriptionEn?: string
}): AcademicPartDefinition {
  return {
    id: def.id,
    kind: def.kind,
    required: def.required,
    label: {
      [es]: def.labelEs,
      [en]: def.labelEn,
    },
    description:
      def.descriptionEs || def.descriptionEn
        ? {
            ...(def.descriptionEs ? { [es]: def.descriptionEs } : {}),
            ...(def.descriptionEn ? { [en]: def.descriptionEn } : {}),
          }
        : undefined,
  }
}

/**
 * Plantillas base por formato.
 * Estas plantillas son configurables por el módulo de mantenimiento;
 * aquí solo se define un conjunto inicial razonable para F2.x.
 */
export const defaultAcademicFormats: AcademicFormatTemplate[] = [
  {
    id: 'thesis',
    name: {
      [es]: 'Tesis',
      [en]: 'Thesis',
    },
    parts: [
      createPart({
        id: 'cover',
        kind: 'cover',
        required: true,
        labelEs: 'Portada',
        labelEn: 'Cover',
      }),
      createPart({
        id: 'dedication',
        kind: 'dedication',
        required: false,
        labelEs: 'Dedicatoria',
        labelEn: 'Dedication',
      }),
      createPart({
        id: 'acknowledgements',
        kind: 'acknowledgements',
        required: false,
        labelEs: 'Agradecimientos',
        labelEn: 'Acknowledgements',
      }),
      createPart({
        id: 'abstract',
        kind: 'abstract',
        required: true,
        labelEs: 'Resumen / Abstract',
        labelEn: 'Abstract',
      }),
      createPart({
        id: 'results',
        kind: 'results',
        required: false,
        labelEs: 'Resultados',
        labelEn: 'Results',
      }),
      createPart({
        id: 'conclusions',
        kind: 'conclusions',
        required: false,
        labelEs: 'Conclusiones',
        labelEn: 'Conclusions',
      }),
      createPart({
        id: 'references',
        kind: 'references',
        required: true,
        labelEs: 'Bibliografía / Referencias',
        labelEn: 'References',
      }),
      createPart({
        id: 'appendices',
        kind: 'appendices',
        required: false,
        labelEs: 'Anexos',
        labelEn: 'Appendices',
      }),
      createPart({
        id: 'ethics',
        kind: 'ethics',
        required: false,
        labelEs: 'Declaraciones éticas',
        labelEn: 'Ethics statements',
      }),
    ],
  },
  {
    id: 'article',
    name: {
      [es]: 'Artículo',
      [en]: 'Article',
    },
    parts: [
      createPart({
        id: 'cover',
        kind: 'cover',
        required: false,
        labelEs: 'Portada (opcional)',
        labelEn: 'Cover (optional)',
      }),
      createPart({
        id: 'abstract',
        kind: 'abstract',
        required: true,
        labelEs: 'Resumen / Abstract',
        labelEn: 'Abstract',
      }),
      createPart({
        id: 'results',
        kind: 'results',
        required: false,
        labelEs: 'Resultados',
        labelEn: 'Results',
      }),
      createPart({
        id: 'conclusions',
        kind: 'conclusions',
        required: false,
        labelEs: 'Conclusiones',
        labelEn: 'Conclusions',
      }),
      createPart({
        id: 'references',
        kind: 'references',
        required: true,
        labelEs: 'Bibliografía / Referencias',
        labelEn: 'References',
      }),
      createPart({
        id: 'appendices',
        kind: 'appendices',
        required: false,
        labelEs: 'Anexos',
        labelEn: 'Appendices',
      }),
    ],
  },
  {
    id: 'report',
    name: {
      [es]: 'Reporte',
      [en]: 'Report',
    },
    parts: [
      createPart({
        id: 'cover',
        kind: 'cover',
        required: true,
        labelEs: 'Portada',
        labelEn: 'Cover',
      }),
      createPart({
        id: 'abstract',
        kind: 'abstract',
        required: false,
        labelEs: 'Resumen ejecutivo',
        labelEn: 'Executive summary',
      }),
      createPart({
        id: 'results',
        kind: 'results',
        required: false,
        labelEs: 'Resultados',
        labelEn: 'Results',
      }),
      createPart({
        id: 'conclusions',
        kind: 'conclusions',
        required: false,
        labelEs: 'Conclusiones / Recomendaciones',
        labelEn: 'Conclusions / Recommendations',
      }),
      createPart({
        id: 'references',
        kind: 'references',
        required: true,
        labelEs: 'Referencias',
        labelEn: 'References',
      }),
      createPart({
        id: 'appendices',
        kind: 'appendices',
        required: false,
        labelEs: 'Anexos',
        labelEn: 'Appendices',
      }),
    ],
  },
]

export function getAcademicFormatById(
  id: AcademicFormatId,
): AcademicFormatTemplate | undefined {
  return defaultAcademicFormats.find((fmt) => fmt.id === id)
}
```


### `packages/editor-parts/src/types.ts`

```ts
// packages/editor-parts/src/types.ts

export type AcademicFormatId = 'thesis' | 'article' | 'report'

export type AcademicPartId =
| 'cover'
| 'dedication'
| 'acknowledgements'
| 'abstract'
| 'results'
| 'conclusions'
| 'references'
| 'appendices'
| 'ethics'
| 'executiveSummary'
| 'conclusionsRecommendations'

export interface AcademicPartLabel {
  es: string
  en: string
}

export interface AcademicPartDefinition {
  id: AcademicPartId
  label: AcademicPartLabel
  /**
   * Si la parte viene marcada por defecto cuando se selecciona el formato.
   */
  defaultSelected: boolean
    /**
     * Indica si esta parte debe aparecer en el índice académico.
     * (La portada normalmente se excluye).
     */
    includeInToc: boolean
}

export interface AcademicFormatDefinition {
  id: AcademicFormatId
  label: string
  description: string
  parts: AcademicPartDefinition[]
}
```


## Paquete `editor-toc`


### `packages/editor-toc/package.json`

```json
{
  "name": "@disertare/editor-toc",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@tiptap/core": "3.10.2",
    "@tiptap/pm": "3.10.2",
    "@disertare/editor-core": "workspace:*"
  }
}
```


### `packages/editor-toc/src/index.ts`

```ts
// packages/editor-toc/src/index.ts
import type { TocEntry, ComputeTocOptions } from './types'

export type { TocEntry, ComputeTocOptions } from './types'

function extractText(node: any): string {
  if (!node || typeof node !== 'object') return ''
    if (node.type === 'text' && typeof node.text === 'string') return node.text
      if (Array.isArray(node.content)) {
        return node.content.map(extractText).join('')
      }
      return ''
}

export function computeToc(
  doc: any,
  options: ComputeTocOptions = {},
): TocEntry[] {
  const minLevel = options.minLevel ?? 1
  const maxLevel = options.maxLevel ?? 6
  const entries: TocEntry[] = []

  function walk(node: any) {
    if (!node || typeof node !== 'object') return

      if (node.type === 'heading') {
        const level = node.attrs?.level ?? 1

        if (level >= minLevel && level <= maxLevel) {
          const text = extractText(node).trim()
          if (text.length) {
            const partId = node.attrs?.['data-part-id'] as string | undefined
            const id =
            (node.attrs && (node.attrs.id as string | undefined)) ||
            `h-${entries.length}`

            entries.push({
              id,
              text,
              level,
              position: entries.length,
              ...(partId ? { partId } : {}),
            })
          }
        }
      }

      const content = (node as any).content
      if (Array.isArray(content)) {
        content.forEach(walk)
      }
  }

  walk(doc)
  return entries
}
```


### `packages/editor-toc/src/types.ts`

```ts
// packages/editor-toc/src/types.ts

export interface TocEntry {
  id: string
  text: string
  level: number
  position: number
  /**
   * Identificador de parte académica si el encabezado proviene de
   * `editor-parts` (p. ej. "cover", "abstract", etc.). Opcional.
   */
  partId?: string
}

export interface ComputeTocOptions {
  minLevel?: number
  maxLevel?: number
}
```

