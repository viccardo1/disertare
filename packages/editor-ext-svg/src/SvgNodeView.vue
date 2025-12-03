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

<!-- packages/editor-ext-svg/src/SvgNodeView.vue -->
<template>
  <NodeViewWrapper class="svg-adv-node">
    <header class="svg-adv-toolbar">
      <div class="svg-adv-toolbar-left">
        <button type="button" class="svg-adv-btn" @click="onEditMarkup">
          {{ t('editor.ext.svg.edit_markup') }}
        </button>

        <button type="button" class="svg-adv-btn" @click="onPasteMarkup">
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
      <div class="svg-adv-canvas-inner" :style="{ transform: `scale(${zoomLocal})` }">
        <!-- Placeholder F2.19: indicador cuando el nodo tiene contenedores -->
        <div v-if="hasContainers" class="svg-container-indicator">
          Contenedores activos
        </div>

        <div v-if="!svgMarkup">
          <p class="svg-adv-empty">
            {{ t('editor.ext.svg.empty_placeholder') }}
          </p>
        </div>

        <div v-else class="svg-adv-svg-wrapper" v-html="safeMarkup" />
      </div>
    </section>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import type { SvgAttributes } from './types'

const props = defineProps(nodeViewProps)

const t = (key: string) => key

// --- NUEVO: resourceId
const svgAttrs = computed(() => props.node?.attrs as SvgAttributes)

if (!svgAttrs.value.resourceId && props.updateAttributes) {
  props.updateAttributes({
    ...svgAttrs.value,
    resourceId: `svg-${Math.random().toString(36).slice(2, 10)}`,
  })
}

const resourceId = computed(() => svgAttrs.value.resourceId)

// --- NUEVO F2.19: atributo booleano para mostrar contenedores
const hasContainers = computed(() => Boolean((props.node?.attrs as any).hasContainers))

// --- Rendering existente
const svgMarkup = computed(() => svgAttrs.value?.svgMarkup ?? null)
const safeMarkup = computed(() => svgMarkup.value ?? '')

const zoomLocal = ref(1)

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
  const edited = window.prompt('Editar SVG:', current)
  if (edited == null) return

  updateAttributes({
    ...svgAttrs.value,
    svgMarkup: edited,
  })
}

function onPasteMarkup() {
  const pasted = window.prompt('Pega SVG:')
  if (!pasted) return

  updateAttributes({
    ...svgAttrs.value,
    svgMarkup: pasted,
  })
}
</script>

<style scoped>
/* existentes */

.svg-container-indicator {
  position: absolute;
  background: #6a5af9dd;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  top: -20px;
  left: 0;
}
</style>
