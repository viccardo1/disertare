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

// packages/editor-citations/src/index.ts

export { CitationInline } from './CitationInline'
export { Bibliography } from './BibliographyBlock'

export * from './types'

export { createCitationManager } from './manager'
export type { CitationManager } from './manager'

export { defaultCitationFormatter } from './formatter'

export { parseBibTeX, formatBibTeX } from './bibtex'
export { toCslJson, fromCslJson } from './csl'
