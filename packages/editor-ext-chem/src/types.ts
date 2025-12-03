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
