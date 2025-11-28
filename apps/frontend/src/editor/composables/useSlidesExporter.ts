// apps/frontend/src/editor/composables/useSlidesExporter.ts
import { exportToPptx } from '@/services/pptxExporter'

export function useSlidesExporter() {
  function exportDeck(title: string, slidesJson: string | null) {
    if (!slidesJson) {
      alert('No hay diapositivas para exportar.')
      return
    }

    let slides
    try {
      slides = JSON.parse(slidesJson)
    } catch (e) {
      console.error('Slides JSON inválido:', e)
      alert('Error interno: no se pudo leer el deck.')
      return
    }

    const deck = {
      title,
      slides,
    }

    return exportToPptx(deck)
  }

  return {
    exportDeck,
  }
}
