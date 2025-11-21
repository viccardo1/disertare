<!-- apps/frontend/src/editor/EditorOcrPanel.vue -->
<template>
  <aside class="dsr-ocr-panel">
    <header class="dsr-ocr-panel__header">
      <h2 class="dsr-ocr-panel__title">OCR</h2>
      <p class="dsr-ocr-panel__subtitle">
        Reconoce texto desde imágenes (on-device, sin enviar archivos al servidor).
      </p>
    </header>

    <section class="dsr-ocr-panel__section">
      <h3 class="dsr-ocr-panel__section-title">Imagen del documento</h3>
      <p class="dsr-ocr-panel__section-help">
        Selecciona una imagen en el documento y pulsa este botón.
      </p>
      <button
        type="button"
        class="dsr-ocr-panel__button"
        :disabled="!isOcrAvailable || isOcrRunning"
        @click="onRunOcrFromSelection"
      >
        <span v-if="isOcrRunning">Procesando…</span>
        <span v-else>OCR de imagen seleccionada</span>
      </button>
    </section>

    <section class="dsr-ocr-panel__section">
      <h3 class="dsr-ocr-panel__section-title">Archivo local</h3>
      <p class="dsr-ocr-panel__section-help">
        Sube una imagen desde tu equipo para reconocer su texto.
      </p>

      <label class="dsr-ocr-panel__file-label">
        <span class="dsr-ocr-panel__file-label-text">
          {{ localFileName || 'Seleccionar archivo…' }}
        </span>
        <input
          class="dsr-ocr-panel__file-input"
          type="file"
          accept="image/*"
          @change="onFileChange"
        />
      </label>

      <div class="dsr-ocr-panel__file-actions">
        <button
          type="button"
          class="dsr-ocr-panel__button dsr-ocr-panel__button--secondary"
          :disabled="!localFile || isOcrRunning || !isOcrAvailable"
          @click="onRunOcrFromFile"
        >
          <span v-if="isOcrRunning">Procesando…</span>
          <span v-else>Reconocer texto del archivo</span>
        </button>
      </div>

      <div v-if="previewUrl" class="dsr-ocr-panel__preview">
        <img :src="previewUrl" alt="Vista previa de la imagen seleccionada" />
      </div>
    </section>

    <section class="dsr-ocr-panel__section dsr-ocr-panel__section--result">
      <h3 class="dsr-ocr-panel__section-title">
        Resultado
        <span v-if="lastSourceLabel" class="dsr-ocr-panel__chip">
          {{ lastSourceLabel }}
        </span>
      </h3>

      <p v-if="ocrError" class="dsr-ocr-panel__error">
        {{ ocrError }}
      </p>

      <textarea
        class="dsr-ocr-panel__textarea"
        v-model="ocrText"
        readonly
        placeholder="Aquí aparecerá el texto reconocido por el OCR."
      ></textarea>

      <div class="dsr-ocr-panel__result-actions">
        <button
          type="button"
          class="dsr-ocr-panel__button dsr-ocr-panel__button--ghost"
          :disabled="!hasResult"
          @click="onClearResult"
        >
          Limpiar
        </button>

        <button
          type="button"
          class="dsr-ocr-panel__button dsr-ocr-panel__button--secondary"
          :disabled="!hasResult"
          @click="onCopyToClipboard"
        >
          Copiar
        </button>

        <button
          type="button"
          class="dsr-ocr-panel__button dsr-ocr-panel__button--primary"
          :disabled="!hasResult"
          @click="onInsertIntoEditor"
        >
          Insertar en el documento
        </button>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, type Ref } from 'vue'
import type { Editor } from '@tiptap/core'
import { useEditorOcr } from './composables/useEditorOcr'

const props = defineProps<{
  /**
   * Referencia reactiva a la instancia de Editor TipTap.
   * Editor.vue será quien pase este ref.
   */
  editor: Ref<Editor | null>
}>()

const localFile = ref<File | null>(null)
const localFileName = ref<string>('')
const previewUrl = ref<string | null>(null)

const {
  isOcrAvailable,
  isOcrRunning,
  ocrText,
  ocrError,
  hasResult,
  lastSourceLabel,
  runOcrOnFile,
  runOcrOnSelectedImage,
  clearOcrResult,
  insertResultIntoEditor,
  copyResultToClipboard,
} = useEditorOcr(props.editor)

function revokePreviewUrl() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0] ?? null

  localFile.value = file
  localFileName.value = file?.name ?? ''
  revokePreviewUrl()

  if (file) {
    previewUrl.value = URL.createObjectURL(file)
  }
}

async function onRunOcrFromFile() {
  if (!localFile.value) return
  await runOcrOnFile(localFile.value, {
    lang: 'es',
  })
}

async function onRunOcrFromSelection() {
  await runOcrOnSelectedImage({
    lang: 'es',
  })
}

function onClearResult() {
  clearOcrResult()
}

async function onCopyToClipboard() {
  await copyResultToClipboard()
}

function onInsertIntoEditor() {
  insertResultIntoEditor()
}

onBeforeUnmount(() => {
  revokePreviewUrl()
})
</script>

<style scoped>
.dsr-ocr-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-left: 1px solid #e5e7eb;
  background: #fafafa;
  max-width: 380px;
  width: 100%;
  box-sizing: border-box;
  font-size: 0.9rem;
}

.dsr-ocr-panel__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dsr-ocr-panel__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.dsr-ocr-panel__subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
}

.dsr-ocr-panel__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dsr-ocr-panel__section--result {
  margin-top: 8px;
}

.dsr-ocr-panel__section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.dsr-ocr-panel__section-help {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.dsr-ocr-panel__file-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px dashed #d1d5db;
  cursor: pointer;
  background: #ffffff;
  font-size: 0.85rem;
}

.dsr-ocr-panel__file-label-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
}

.dsr-ocr-panel__file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.dsr-ocr-panel__file-actions {
  margin-top: 4px;
}

.dsr-ocr-panel__preview {
  margin-top: 8px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  max-height: 180px;
}

.dsr-ocr-panel__preview img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.dsr-ocr-panel__textarea {
  width: 100%;
  min-height: 120px;
  max-height: 220px;
  resize: vertical;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 0.85rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  box-sizing: border-box;
  background: #ffffff;
}

.dsr-ocr-panel__result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

.dsr-ocr-panel__button {
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease,
    border-color 0.15s ease, opacity 0.15s ease;
}

.dsr-ocr-panel__button:disabled {
  opacity: 0.6;
  cursor: default;
}

.dsr-ocr-panel__button--primary {
  background: #4f46e5;
  color: #ffffff;
}

.dsr-ocr-panel__button--secondary {
  background: #e5e7eb;
  color: #111827;
}

.dsr-ocr-panel__button--ghost {
  background: transparent;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.dsr-ocr-panel__error {
  margin: 0;
  padding: 6px 8px;
  border-radius: 6px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.8rem;
}

.dsr-ocr-panel__chip {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.75rem;
}
</style>
