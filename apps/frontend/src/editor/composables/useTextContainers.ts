// apps/frontend/src/editor/composables/useTextContainers.ts
import { computed } from 'vue'
import { usePageSections } from './usePageSections'
import type { TextContainerRegion } from './usePageSections'

/**
 * Composable F2.19 para gestionar contenedores de texto
 * ligados al layout de la sección actual.
 *
 * No toca el documento TipTap directamente: solo actualiza
 * section.layout.containers a través de usePageSections.
 */
export function useTextContainers() {
  const { section, setLayoutContainers } = usePageSections()

  const containers = computed<TextContainerRegion[]>(() => {
    return section.layout.containers ?? []
  })

  function setAll(next: TextContainerRegion[]): void {
    setLayoutContainers(next)
  }

  /**
   * Crea un contenedor rectangular básico (0.1–0.9)
   * opcionalmente ligado a un resourceId (img-… / svg-…).
   */
  function addContainer(resourceId = ''): void {
    const current = containers.value
    const id = `tc-${Math.random().toString(36).slice(2, 10)}`

    const next: TextContainerRegion = {
      id,
      resourceId,
      shape: {
        kind: 'rect',
        points: [
          { x: 0.1, y: 0.1 },
          { x: 0.9, y: 0.9 },
        ],
      },
    }

    setAll([...current, next])
  }

  /**
   * Aplica un patch parcial sobre un contenedor.
   * Si no se pasa shape, se conserva el anterior.
   */
  function updateContainer(id: string, patch: Partial<TextContainerRegion>): void {
    const current = containers.value
    const idx = current.findIndex(c => c.id === id)
    if (idx === -1) return

    const updated: TextContainerRegion = {
      ...current[idx],
      ...patch,
      shape: patch.shape ?? current[idx].shape,
    }

    const next = current.slice()
    next.splice(idx, 1, updated)
    setAll(next)
  }

  function removeContainer(id: string): void {
    const next = containers.value.filter(c => c.id !== id)
    setAll(next)
  }

  function clearContainersForResource(resourceId: string): void {
    const next = containers.value.filter(c => c.resourceId !== resourceId)
    setAll(next)
  }

  return {
    containers,
    addContainer,
    updateContainer,
    removeContainer,
    clearContainersForResource,
  }
}
