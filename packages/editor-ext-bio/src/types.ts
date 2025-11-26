// packages/editor-ext-bio/src/types.ts

export type BioSequenceKind = 'dna' | 'rna' | 'protein'

export interface BioSequenceAnnotation {
  id: string
  label: string
  start: number
  end: number
  color?: string
}

export interface BioSequenceAttrs {
  id: string | null
  kind: BioSequenceKind
  label: string
  sequence: string
  annotations: BioSequenceAnnotation[]
}
