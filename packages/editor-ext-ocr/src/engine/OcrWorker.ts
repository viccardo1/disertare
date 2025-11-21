// packages/editor-ext-ocr/src/engine/OcrWorker.ts

export type OcrWorkerRequestType = 'init' | 'recognize' | 'terminate'

export interface OcrWorkerRequestBase {
  id: string
  type: OcrWorkerRequestType
}

export interface OcrWorkerInitRequest extends OcrWorkerRequestBase {
  type: 'init'
  payload: {
    defaultLang?: string
  }
}

export interface OcrWorkerRecognizeRequest extends OcrWorkerRequestBase {
  type: 'recognize'
  payload: {
    imageData: ArrayBuffer
    lang?: string
  }
}

export interface OcrWorkerTerminateRequest extends OcrWorkerRequestBase {
  type: 'terminate'
  payload?: undefined
}

export type OcrWorkerRequest =
| OcrWorkerInitRequest
| OcrWorkerRecognizeRequest
| OcrWorkerTerminateRequest

export interface OcrWorkerResponse {
  id: string
  ok: boolean
  error?: string
  payload?: unknown
}

/**
 * Factory para el WebWorker de OCR.
 * En F2.4 (inicio) aún no está implementado.
 */
export function createOcrWorker(): Worker {
  throw new Error(
    '[Disertare OCR] createOcrWorker() no está implementado todavía. ' +
    'Se implementará cuando integremos el motor WASM real.',
  )
}
