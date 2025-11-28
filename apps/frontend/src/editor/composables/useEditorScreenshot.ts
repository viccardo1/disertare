// apps/frontend/src/editor/composables/useEditorScreenshot.ts
import { ref, type Ref } from 'vue'
import type { Editor } from '@tiptap/core'

interface UseEditorScreenshot {
  isCapturing: Ref<boolean>
  lastScreenshotDataUrl: Ref<string | null>
  captureAndInsertScreenshot: () => Promise<void>
}

/**
 * F2.13 — Captura tipo Flameshot (versión mínima F2.x)
 *
 * - Usa getDisplayMedia para capturar pantalla/ventana.
 * - Inserta la captura como imagen en el documento.
 * - Expone lastScreenshotDataUrl para integrarla con el Canvas de Presentaciones.
 */
export function useEditorScreenshot(editor: Ref<Editor | null>): UseEditorScreenshot {
  const isCapturing = ref(false)
  const lastScreenshotDataUrl = ref<string | null>(null)

  async function captureAndInsertScreenshot(): Promise<void> {
    const ed = editor.value
    if (!ed) {
      // eslint-disable-next-line no-console
      console.warn('[useEditorScreenshot] Editor no inicializado')
      return
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getDisplayMedia !== 'function'
    ) {
      // eslint-disable-next-line no-alert
      alert(
        'Tu navegador no soporta captura de pantalla directa. ' +
        'Actualiza a una versión más reciente o usa la función de subir imagen.',
      )
      return
    }

    if (isCapturing.value) {
      return
    }

    isCapturing.value = true

    let stream: MediaStream | null = null
    let video: HTMLVideoElement | null = null

    try {
      // 1) Pedir al usuario qué pantalla/ventana compartir
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {},
      })

      video = document.createElement('video')
      video.style.position = 'fixed'
      video.style.top = '-10000px'
      video.style.left = '-10000px'
      video.muted = true
      video.srcObject = stream
      document.body.appendChild(video)

      // 2) Esperar a que el vídeo esté listo y reproduciendo
      await new Promise<void>((resolve) => {
        video!.onloadedmetadata = () => {
          video!.play().then(() => resolve())
        }
      })

      // 2.1) Dar tiempo a que desaparezca el diálogo de “Elegir qué compartir”
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 800)
      })

      const width = video.videoWidth
      const height = video.videoHeight

      if (!width || !height) {
        throw new Error('No se pudo obtener el tamaño del stream de vídeo')
      }

      // 3) Pintar un frame en canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('No se pudo crear el contexto 2D del canvas')
      }

      ctx.drawImage(video, 0, 0, width, height)

      // 4) Generar dataURL PNG
      const dataUrl = canvas.toDataURL('image/png')
      lastScreenshotDataUrl.value = dataUrl

      // 5) Insertar en el documento como imagen
      ;(ed.chain().focus() as any)
      .setImage({
        src: dataUrl,
        alt: 'Captura de pantalla',
      })
      .run()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[useEditorScreenshot] Error durante la captura:', error)
      // eslint-disable-next-line no-alert
      alert('No se pudo completar la captura de pantalla.')
    } finally {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
      if (video) {
        try {
          video.pause()
        } catch {
          /* ignore */
        }
        video.remove()
      }
      isCapturing.value = false
    }
  }

  return {
    isCapturing: isCapturing as Ref<boolean>,
    lastScreenshotDataUrl,
    captureAndInsertScreenshot,
  }
}
