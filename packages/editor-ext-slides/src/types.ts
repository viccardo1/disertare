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
