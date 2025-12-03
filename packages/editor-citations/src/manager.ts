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
