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
