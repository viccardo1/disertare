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
