// packages/editor-ext-ocr/src/engine/OcrEngine.ts

import type { OcrImageSource, OcrOptions, OcrResult } from '../types'

export interface OcrEngineInitOptions {
  defaultLang?: string
}

export interface OcrEngine {
  readonly isInitialized: boolean
  init(options?: OcrEngineInitOptions): Promise<void>
  recognize(image: OcrImageSource, options?: OcrOptions): Promise<OcrResult>
  terminate(): Promise<void>
}

/**
 * Implementación stub inicial: NO hace OCR real,
 * solo devuelve un mensaje de prueba.
 */
class StubOcrEngine implements OcrEngine {
  private _initialized = false
  private _defaultLang: string | undefined

    get isInitialized(): boolean {
      return this._initialized
    }

    async init(options?: OcrEngineInitOptions): Promise<void> {
      this._initialized = true
      this._defaultLang = options?.defaultLang
    }

    async recognize(
      _image: OcrImageSource,
      options?: OcrOptions,
    ): Promise<OcrResult> {
      if (!this._initialized) {
        await this.init()
      }

      const lang = options?.lang ?? this._defaultLang

      const text =
      '[Disertare OCR] El motor OCR aún no está implementado. ' +
      'Esta es una respuesta de prueba del StubOcrEngine.'

      return {
        text,
        blocks: [
          {
            text,
            confidence: 1,
          },
        ],
        lang,
      }
    }

    async terminate(): Promise<void> {
      this._initialized = false
    }
}

export function createOcrEngine(
  initOptions?: OcrEngineInitOptions,
): OcrEngine {
  const engine = new StubOcrEngine()
  if (initOptions) {
    void engine.init(initOptions)
  }
  return engine
}
