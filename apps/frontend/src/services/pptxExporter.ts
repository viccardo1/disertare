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

// apps/frontend/src/services/pptxExporter.ts
import PptxGenJS from 'pptxgenjs'
import type { SlidesDeckDto, SlideDto } from '@disertare/editor-ext-slides'

/**
 * Exporta un deck de diapositivas a un archivo PPTX descargable.
 * F2.12: soporte de título, cuerpo de texto e imagen principal simple.
 */
export async function exportSlidesDeck(deck: SlidesDeckDto): Promise<void> {
  const pptx = new PptxGenJS()

  const safeTitle =
  deck.title && deck.title.trim().length
  ? deck.title.trim()
  : 'Presentación sin título'

  pptx.author = 'Disertare'
  pptx.title = safeTitle

  const slides: SlideDto[] = deck.slides ?? []

  if (!slides.length) {
    // Creamos una diapositiva mínima para evitar PPTX vacío
    const s = pptx.addSlide()
    s.addText(safeTitle, {
      x: 1,
      y: 1.5,
      w: 8,
      h: 1,
      fontSize: 28,
      bold: true,
      align: 'center',
    })
  } else {
    slides.forEach((slide, index) => {
      const s = pptx.addSlide()

      const title =
      slide.title && slide.title.trim().length
      ? slide.title.trim()
      : `Diapositiva ${index + 1}`

      const body = slide.body ?? ''

      // Título
    if (slide.layout !== 'blank') {
      s.addText(title, {
        x: 0.7,
        y: 0.6,
        w: 8.6,
        h: 0.8,
        fontSize: 24,
        bold: true,
        underline: false,
        align: 'left',
      })
    }

    // Cuerpo
    if (slide.layout === 'title-content' || slide.layout === 'title-image') {
      if (body && body.trim().length) {
        s.addText(body, {
          x: 0.9,
          y: 1.6,
          w: 8.2,
          h: 3.5,
          fontSize: 16,
          align: 'left',
        })
      }
    }

    // Imagen principal
    if (slide.layout === 'title-image' && slide.imageUrl) {
      // El propio PptxGenJS se encarga de descargar/inyectar la imagen.
      s.addImage({
        path: slide.imageUrl,
        x: 1.0,
        y: 3.3,
        w: 7.5,
        h: 3.8,
      } as any)
    }
    })
  }

  const fileName = `${safeTitle || 'disertare_presentation'}.pptx`

  await pptx.writeFile({
    fileName,
  })
}
