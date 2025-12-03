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
