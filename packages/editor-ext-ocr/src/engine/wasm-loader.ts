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

// packages/editor-ext-ocr/src/engine/wasm-loader.ts

export interface OcrWasmModule {
  // Placeholder hasta que definamos el motor concreto
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly instance: any
}

export async function loadOcrWasmModule(): Promise<OcrWasmModule> {
  throw new Error(
    '[Disertare OCR] loadOcrWasmModule() no está implementado todavía. ' +
    'Se implementará cuando integremos el motor WASM real.',
  )
}
