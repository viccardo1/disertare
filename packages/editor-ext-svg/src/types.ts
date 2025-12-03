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
