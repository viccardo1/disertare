<!-- apps/frontend/src/editor/EditorScreenshotPanel.vue -->
<template>
  <div class="screenshot-panel">
    <h2 class="screenshot-panel__title">
      Capturas de pantalla (F2.13)
    </h2>

    <p class="screenshot-panel__hint">
      Usa esta herramienta para documentar pasos, configuraciones
      o resultados sin salir de Disertare.
    </p>

    <div class="screenshot-panel__actions">
      <button
        type="button"
        class="screenshot-panel__button"
        :disabled="isCapturing"
        @click="emit('new-screenshot')"
      >
        <span v-if="!isCapturing">Nueva captura</span>
        <span v-else>Tomando captura…</span>
      </button>

      <button
        type="button"
        class="screenshot-panel__button screenshot-panel__button--secondary"
        :disabled="!hasLastScreenshot"
        @click="emit('send-to-slide')"
      >
        Enviar al Canvas
      </button>
    </div>

    <p class="screenshot-panel__shortcut">
      Atajo de teclado:
      <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>
      (o <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> en macOS)
    </p>

    <p
      v-if="hasLastScreenshot"
      class="screenshot-panel__note"
    >
      La última captura se insertó en el documento y está lista para usarse
      como imagen principal en una diapositiva del Canvas.
    </p>
    <p
      v-else
      class="screenshot-panel__note"
    >
      Aún no hay una captura reciente. Toma una para habilitar
      “Enviar al Canvas”.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isCapturing: boolean
  lastScreenshotDataUrl?: string | null
}>()

const emit = defineEmits<{
  (e: 'new-screenshot'): void
  (e: 'send-to-slide'): void
}>()

const hasLastScreenshot = computed(
  () => !!props.lastScreenshotDataUrl,
)
</script>

<style scoped>
.screenshot-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem 0.75rem 1rem;
  font-size: 13px;
}

.screenshot-panel__title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #4b3f72;
}

.screenshot-panel__hint,
.screenshot-panel__note,
.screenshot-panel__shortcut {
  margin: 0;
  line-height: 1.4;
  color: #4b5563;
}

.screenshot-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.screenshot-panel__button {
  align-self: flex-start;
  border-radius: 999px;
  padding: 6px 14px;
  border: 1px solid #c1b6ff;
  background: #f9f5ff;
  font-size: 13px;
  cursor: pointer;
  color: #4b3f72;
  font-weight: 600;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.05s ease;
}

.screenshot-panel__button--secondary {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.screenshot-panel__button:hover:enabled {
  background: #f3ecff;
  border-color: #a694ff;
  box-shadow: 0 0 0 1px #d3cfff;
  transform: translateY(-0.5px);
}

.screenshot-panel__button--secondary:hover:enabled {
  background: #e5e7eb;
  border-color: #cbd5f5;
  box-shadow: none;
}

.screenshot-panel__button:disabled {
  opacity: 0.7;
  cursor: default;
}

.screenshot-panel__shortcut kbd {
  font-family: inherit;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  margin-right: 2px;
}
</style>
