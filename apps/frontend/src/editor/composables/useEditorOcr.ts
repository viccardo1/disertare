// apps/frontend/src/editor/composables/useEditorOcr.ts
import { ref, computed, type Ref } from 'vue'
import type { Editor } from '@tiptap/core'
import {
  createOcrEngine,
  type OcrEngine,
  type OcrOptions,
} from '@disertare/editor-ext-ocr'

/**
 * Composable F2.4 — OCR on-device (stub inicial).
 *
 * Se encarga de:
 *  - Gestionar la instancia de OcrEngine (WASM/worker en el futuro).
 *  - Ejecutar OCR sobre archivos locales.
 *  - Ejecutar OCR sobre la imagen seleccionada en el editor.
 *  - Exponer el resultado y helpers para insertarlo en el documento.
 */
export function useEditorOcr(editor: Ref<Editor | null>) {
  const engine = ref<OcrEngine | null>(null)

  const isOcrRunning = ref(false)
  const ocrText = ref('')
  const ocrError = ref<string | null>(null)
  const lastLang = ref<string | undefined>(undefined)

  const lastSourceLabel = ref<string | null>(null)

  const isOcrAvailable = computed(() => {
    // En esta fase asumimos que si existe window podemos cargar el motor.
    return typeof window !== 'undefined'
  })

  const hasResult = computed(() => !!ocrText.value)

  async function ensureEngine(lang?: string): Promise<OcrEngine> {
    if (!engine.value) {
      engine.value = createOcrEngine(
        lang
          ? {
              defaultLang: lang,
            }
          : undefined,
      )
    }
    return engine.value
  }

  function resetState() {
    ocrError.value = null
  }

  async function runOcrOnFile(file: File, options?: OcrOptions): Promise<void> {
    if (!file) return

    resetState()
    isOcrRunning.value = true

    try {
      const lang = options?.lang
      const ocrEngine = await ensureEngine(lang)

      const arrayBuffer = await file.arrayBuffer()
      const result = await ocrEngine.recognize(arrayBuffer, options)

      ocrText.value = result.text ?? ''
      lastLang.value = result.lang ?? lang
      lastSourceLabel.value = file.name || 'archivo'
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err ?? 'Error desconocido')
      ocrError.value = `[Disertare OCR] No se pudo procesar el archivo: ${message}`
    } finally {
      isOcrRunning.value = false
    }
  }

  async function runOcrOnSelectedImage(options?: OcrOptions): Promise<void> {
    const instance = editor.value

    if (!instance) {
      ocrError.value = '[Disertare OCR] No hay un editor activo.'
      return
    }

    resetState()

    const { state } = instance
    const { from, to } = state.selection

    let imageSrc: string | null = null

    // 1) Buscar imagen dentro de la selección.
    state.doc.nodesBetween(from, to, (node) => {
      if (node.type.name === 'image' && node.attrs?.src && !imageSrc) {
        imageSrc = String(node.attrs.src)
      }
    })

    // 2) Si no hay imagen seleccionada, buscar la primera en todo el documento.
    if (!imageSrc) {
      state.doc.descendants((node) => {
        if (node.type.name === 'image' && node.attrs?.src && !imageSrc) {
          imageSrc = String(node.attrs.src)
        }
      })
    }

    if (!imageSrc) {
      ocrError.value =
        '[Disertare OCR] No se encontró ninguna imagen para ejecutar OCR.'
      return
    }

    isOcrRunning.value = true

    try {
      const lang = options?.lang
      const ocrEngine = await ensureEngine(lang)

      // NOTA F2.4:
      //  Asumimos que imageSrc es una URL accesible en el navegador.
      //  En fases posteriores podremos optimizar/consolidar esta parte.
      const response = await fetch(imageSrc)
      const arrayBuffer = await response.arrayBuffer()

      const result = await ocrEngine.recognize(arrayBuffer, options)

      ocrText.value = result.text ?? ''
      lastLang.value = result.lang ?? lang
      lastSourceLabel.value = 'imagen del documento'
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err ?? 'Error desconocido')
      ocrError.value =
        '[Disertare OCR] No se pudo ejecutar OCR sobre la imagen seleccionada: ' +
        message
    } finally {
      isOcrRunning.value = false
    }
  }

  function clearOcrResult() {
    ocrText.value = ''
    ocrError.value = null
    lastSourceLabel.value = null
  }

  function insertResultIntoEditor() {
    const instance = editor.value

    if (!instance) {
      ocrError.value = '[Disertare OCR] No hay un editor activo.'
      return
    }

    if (!ocrText.value) {
      // No hacemos nada si no hay texto.
      return
    }

    try {
      instance
        .chain()
        .focus()
        .insertContent(ocrText.value)
        .run()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err ?? 'Error desconocido')
      ocrError.value =
        '[Disertare OCR] No se pudo insertar el texto en el documento: ' +
        message
    }
  }

  async function copyResultToClipboard() {
    if (!ocrText.value) return

    if (!navigator.clipboard) {
      ocrError.value =
        '[Disertare OCR] El navegador no permite copiar al portapapeles.'
      return
    }

    try {
      await navigator.clipboard.writeText(ocrText.value)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err ?? 'Error desconocido')
      ocrError.value =
        '[Disertare OCR] No se pudo copiar el texto al portapapeles: ' +
        message
    }
  }

  return {
    // estado
    isOcrAvailable,
    isOcrRunning,
    ocrText,
    ocrError,
    hasResult,
    lastLang,
    lastSourceLabel,
    // acciones
    runOcrOnFile,
    runOcrOnSelectedImage,
    clearOcrResult,
    insertResultIntoEditor,
    copyResultToClipboard,
  }
}
