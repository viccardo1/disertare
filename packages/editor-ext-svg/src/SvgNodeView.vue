<!-- packages/editor-ext-svg/src/SvgNodeView.vue -->
<template>
  <NodeViewWrapper class="svg-adv-node">
    <header class="svg-adv-toolbar">
      <div class="svg-adv-toolbar-left">
        <button
          type="button"
          class="svg-adv-btn"
          @click="onEditMarkup"
        >
          {{ t('editor.ext.svg.edit_markup') }}
        </button>

        <button
          type="button"
          class="svg-adv-btn"
          @click="onPasteMarkup"
        >
          {{ t('editor.ext.svg.paste_markup') }}
        </button>
      </div>

      <div class="svg-adv-toolbar-right">
        <label class="svg-adv-zoom">
          {{ t('editor.ext.svg.zoom') }}
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.05"
            v-model.number="zoomLocal"
            @input="onZoomChange"
          />
          <span class="svg-adv-zoom-value">
            {{ (zoomLocal * 100).toFixed(0) }}%
          </span>
        </label>
      </div>
    </header>

    <section class="svg-adv-canvas-container">
      <div
        class="svg-adv-canvas-inner"
        :style="{ transform: `scale(${zoomLocal})` }"
      >
        <div v-if="!svgMarkup">
          <p class="svg-adv-empty">
            {{ t('editor.ext.svg.empty_placeholder') }}
          </p>
        </div>

        <div
          v-else
          class="svg-adv-svg-wrapper"
          v-html="safeMarkup"
        />
      </div>
    </section>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import type { SvgAttributes } from './types'

const props = defineProps(nodeViewProps)

// i18n placeholder
const t = (key: string) => key

const zoomLocal = ref(1)

const svgAttrs = computed(() => props.node?.attrs as SvgAttributes)
const svgMarkup = computed(() => svgAttrs.value?.svgMarkup ?? null)

// NO hacemos sanitización agresiva aquí; se asume que la entrada viene
// de fuentes confiables o pre-limpiadas por SVGO en el flujo de importación.
const safeMarkup = computed(() => svgMarkup.value ?? '')

watch(
  () => svgAttrs.value?.view?.zoom,
  (zoom) => {
    if (typeof zoom === 'number' && zoom > 0) {
      zoomLocal.value = zoom
    }
  },
  { immediate: true },
)

function updateAttributes(partial: Partial<SvgAttributes>) {
  props.updateAttributes?.({
    ...(props.node?.attrs ?? {}),
    ...partial,
  })
}

function onZoomChange() {
  const current = svgAttrs.value
  if (!current) return

  updateAttributes({
    ...current,
    view: {
      ...current.view,
      zoom: zoomLocal.value,
    },
  })
}

function onEditMarkup() {
  const current = svgMarkup.value ?? ''
  const edited = window.prompt('Editar SVG (markup crudo):', current)
  if (edited == null) return

  updateAttributes({
    ...svgAttrs.value,
    svgMarkup: edited,
  } as SvgAttributes)
}

function onPasteMarkup() {
  const pasted = window.prompt('Pega aquí el SVG (markup):')
  if (!pasted) return

  updateAttributes({
    ...svgAttrs.value,
    svgMarkup: pasted,
  } as SvgAttributes)
}
</script>

<style scoped>
.svg-adv-node {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
}

.svg-adv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.svg-adv-btn {
  border: 1px solid #d0d0ff;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  background: #f5f5ff;
  cursor: pointer;
}

.svg-adv-btn:hover {
  background: #ececff;
}

.svg-adv-zoom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.svg-adv-zoom input[type='range'] {
  width: 120px;
}

.svg-adv-zoom-value {
  min-width: 3rem;
  text-align: right;
}

.svg-adv-canvas-container {
  border-radius: 6px;
  background: #ffffff;
  padding: 0.75rem;
  overflow: auto;
  max-height: 420px;
}

.svg-adv-canvas-inner {
  transform-origin: top left;
}

.svg-adv-svg-wrapper svg {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.svg-adv-empty {
  font-size: 0.8rem;
  color: #718096;
  font-style: italic;
}
</style>
