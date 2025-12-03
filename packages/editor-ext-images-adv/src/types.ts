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
