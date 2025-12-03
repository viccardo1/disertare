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

// packages/editor-ext-stats-adv/src/datasets/index.ts
import type { StatsDataset } from '../types'

const registry = new Map<string, StatsDataset>()

export function registerDataset(dataset: StatsDataset): void {
  registry.set(dataset.id, dataset)
}

export function getDataset(id: string): StatsDataset | undefined {
  return registry.get(id)
}

export function listDatasets(): StatsDataset[] {
  return Array.from(registry.values())
}

export function removeDataset(id: string): void {
  registry.delete(id)
}

export function clearDatasets(): void {
  registry.clear()
}
