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
