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

class InMemoryCitationManager implements CitationManager {
  private references = new Map<string, Reference>()
  private style: CitationStyleId = 'apa'
    private nextCitationNumber = 1

    getStyle(): CitationStyleId {
      return this.style
    }

    setStyle(style: CitationStyleId): void {
      this.style = style
    }

    addReference(input: Omit<Reference, 'id'> & { id?: string }): Reference {
      const id = input.id ?? this.generateId()
      const existing = this.references.get(id)

      let citationNumber = input.citationNumber

      if (!citationNumber) {
        citationNumber = existing?.citationNumber
      }

      if (!citationNumber) {
        citationNumber = this.nextCitationNumber++
      }

      const ref: Reference = {
        ...input,
        id,
        citationNumber,
      }

      this.references.set(id, ref)
      return ref
    }

    updateReference(id: string, patch: Partial<Reference>): Reference | null {
      const existing = this.references.get(id)
      if (!existing) return null

        const merged: Reference = {
          ...existing,
          ...patch,
          id,
        }

        this.references.set(id, merged)
        return merged
    }

    getReference(id: string): Reference | null {
      return this.references.get(id) ?? null
    }

    listReferences(): Reference[] {
      // Ordenamos por citationNumber para estilos numéricos.
      return Array.from(this.references.values()).sort((a, b) => {
        const na = a.citationNumber ?? 0
        const nb = b.citationNumber ?? 0
        return na - nb
      })
    }

    removeReference(id: string): void {
      this.references.delete(id)
    }

    clear(): void {
      this.references.clear()
    }

    private generateId(): string {
      return `ref-${Math.random().toString(36).slice(2, 10)}`
    }
}

export function createCitationManager(): CitationManager {
  return new InMemoryCitationManager()
}
