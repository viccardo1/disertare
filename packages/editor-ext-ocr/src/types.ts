// packages/editor-ext-ocr/src/types.ts

export type OcrImageSource =
| Blob
| ArrayBuffer
| Uint8Array
| string // data URL o URL de imagen ya accesible en el navegador

export interface OcrOptions {
  /**
   * Código de idioma (ej. 'es', 'en').
   * Si no se especifica, se usará el idioma por defecto que configure el motor.
   */
  lang?: string
}

export interface OcrResultBlock {
  text: string
  confidence?: number
  bbox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface OcrResult {
  text: string
  blocks?: OcrResultBlock[]
  lang?: string
}
