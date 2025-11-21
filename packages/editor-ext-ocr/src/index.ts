// packages/editor-ext-ocr/src/index.ts

import { Extension } from '@tiptap/core'
import type {
  OcrImageSource,
  OcrOptions,
  OcrResult,
  OcrResultBlock,
} from './types'
import {
  createOcrEngine,
  type OcrEngine,
  type OcrEngineInitOptions,
} from './engine/OcrEngine'

export interface OcrExtensionOptions {
  defaultLang?: string
}

export const OcrExtension = Extension.create<OcrExtensionOptions>({
  name: 'ocr',

  addOptions() {
    return {
      defaultLang: 'es',
    }
  },
})

export { createOcrEngine }

export type {
  OcrEngine,
  OcrEngineInitOptions,
  OcrResult,
  OcrResultBlock,
  OcrOptions,
  OcrImageSource,
}

export default OcrExtension
