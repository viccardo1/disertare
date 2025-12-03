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

<template>
  <NodeViewWrapper
    class="images-adv-node-wrapper"
    :aria-label="t('editor.ext.imagesAdv.edit_image_advanced')"
  >
    <div class="images-adv-node">
      <!-- Toolbar superior -->
      <header class="images-adv-toolbar">
        <!-- Grupo: herramientas de pintura / selección -->
        <div class="tools-group">
          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'brush' }"
            @click="setTool('brush')"
          >
            🖌
            <span>{{ t('editor.ext.imagesAdv.tool.brush') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'eraser' }"
            @click="setTool('eraser')"
          >
            🧽
            <span>{{ t('editor.ext.imagesAdv.tool.eraser') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'clone' }"
            @click="setTool('clone')"
          >
            🩹
            <span>{{ t('editor.ext.imagesAdv.tool.clone') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'eyedropper' }"
            @click="setTool('eyedropper')"
          >
            🎯
            <span>{{ t('editor.ext.imagesAdv.tool.eyedropper') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'selectRect' }"
            @click="setTool('selectRect')"
          >
            ▭
            <span>{{ t('editor.ext.imagesAdv.tool.selectRect') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'lasso' }"
            @click="setTool('lasso')"
          >
            ✏
            <span>{{ t('editor.ext.imagesAdv.tool.lasso') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === 'text' }"
            @click="setTool('text')"
          >
            T
            <span>{{ t('editor.ext.imagesAdv.tool.text') }}</span>
          </button>
        </div>

        <!-- Grupo: transformaciones (rotar/voltear/recortar) -->
        <div class="tools-group">
          <button
            type="button"
            class="tool-btn subtle"
            @click="rotateCanvas('left')"
          >
            ↺
            <span>{{ t('editor.ext.imagesAdv.action.rotate_left') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn subtle"
            @click="rotateCanvas('right')"
          >
            ↻
            <span>{{ t('editor.ext.imagesAdv.action.rotate_right') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn subtle"
            @click="flipCanvas('horizontal')"
          >
            ↔
            <span>{{ t('editor.ext.imagesAdv.action.flip_horizontal') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn subtle"
            @click="flipCanvas('vertical')"
          >
            ↕
            <span>{{ t('editor.ext.imagesAdv.action.flip_vertical') }}</span>
          </button>

          <button
            type="button"
            class="tool-btn subtle"
            @click="cropToSelection"
          >
            ✂
            <span>{{ t('editor.ext.imagesAdv.action.crop_selection') }}</span>
          </button>
        </div>

        <!-- Grupo: pincel / color -->
        <div class="tools-group">
          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.brush.size') }}
            <input
              v-model.number="brushSize"
              type="range"
              min="1"
              max="80"
            >
          </label>

          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.brush.opacity') }}
            <input
              v-model.number="brushOpacity"
              type="range"
              min="0.1"
              max="1"
              step="0.05"
            >
          </label>

          <div
            v-if="currentColor"
            class="color-swatch"
            :style="{ backgroundColor: currentColor }"
            :title="currentColor"
          />
        </div>

        <!-- Grupo: filtros rápidos / reset -->
        <div class="tools-group">
          <button
            type="button"
            class="tool-btn subtle"
            @click="applyPreset('none')"
          >
            {{ t('editor.ext.imagesAdv.filter.none') }}
          </button>
          <button
            type="button"
            class="tool-btn subtle"
            @click="applyPreset('bw')"
          >
            B&N
          </button>
          <button
            type="button"
            class="tool-btn subtle"
            @click="applyPreset('sepia')"
          >
            Sepia
          </button>
          <button
            type="button"
            class="tool-btn subtle"
            @click="applyPreset('auto')"
          >
            ✨ {{ t('editor.ext.imagesAdv.action.autoEnhance') }}
          </button>

          <button
            type="button"
            class="tool-btn subtle"
            @click="resetAdjustments"
          >
            ♺ {{ t('editor.ext.imagesAdv.action.reset') }}
          </button>
        </div>
      </header>

      <div class="images-adv-body">
        <!-- Panel de capas -->
        <aside class="layers-panel">
          <header class="layers-header">
            {{ t('editor.ext.imagesAdv.layers.title') }}
          </header>

          <ul class="layers-list">
            <li
              v-for="layer in layers"
              :key="layer.id"
              class="layer-item"
              :class="{ active: layer.id === activeLayerId }"
              @click="setActiveLayer(layer.id)"
            >
              <button
                type="button"
                class="layer-visibility"
                @click.stop="toggleLayerVisibility(layer.id)"
              >
                {{ layer.visible ? '👁' : '🚫' }}
              </button>
              <input
                class="layer-name"
                :value="layer.name"
                @input="e => renameLayer(layer.id, (e.target as HTMLInputElement).value)"
              >
              <input
                class="layer-opacity"
                type="range"
                min="0"
                max="1"
                step="0.05"
                :value="layer.opacity"
                @input="e => changeLayerOpacity(layer.id, Number((e.target as HTMLInputElement).value))"
              >
            </li>
          </ul>

          <footer class="layers-footer">
            <button
              type="button"
              class="tool-btn subtle small"
              @click="addLayer"
            >
              +
            </button>
            <button
              type="button"
              class="tool-btn subtle small"
              @click="removeActiveLayer"
            >
              −
            </button>
          </footer>
        </aside>

        <!-- Lienzo + selección, con zoom -->
        <div class="images-adv-canvas-outer">
          <div
            class="images-adv-canvas-container"
            :style="canvasZoomStyle"
            @mousedown="onPointerDown"
            @mousemove="onPointerMove"
            @mouseup="onPointerUp"
            @mouseleave="onPointerUp"
          >
            <canvas
              ref="canvasRef"
              class="images-adv-canvas"
              :style="canvasStyle"
            />

            <div
              v-if="selectionRect"
              class="selection-rect"
              :style="selectionStyle"
            />
          </div>
        </div>
      </div>

      <!-- Ajustes globales + zoom + exportación -->
      <footer class="images-adv-footer">
        <div class="adjustments">
          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.adjust.brightness') }}
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              :value="adjustments.brightness"
              @input="onAdjustChange('brightness', $event)"
            >
          </label>

          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.adjust.contrast') }}
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              :value="adjustments.contrast"
              @input="onAdjustChange('contrast', $event)"
            >
          </label>

          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.adjust.saturation') }}
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              :value="adjustments.saturation"
              @input="onAdjustChange('saturation', $event)"
            >
          </label>

          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.filter.blur') }}
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              :value="filters.blur"
              @input="onFilterChange('blur', $event)"
            >
          </label>

          <!-- Zoom solo de visualización -->
          <label class="slider-label">
            {{ t('editor.ext.imagesAdv.view.zoom') }}
            <input
              v-model.number="zoom"
              type="range"
              min="0.25"
              max="2"
              step="0.05"
            >
          </label>
        </div>

        <div class="export-options">
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="removeExif"
              @change="toggleRemoveExif"
            >
            {{ t('editor.ext.imagesAdv.export.removeExif') }}
          </label>

          <button
            type="button"
            class="tool-btn primary"
            @click="exportToWebP"
          >
            {{ t('editor.ext.imagesAdv.export.webp') }}
          </button>
        </div>
      </footer>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import {
  onMounted,
  ref,
  computed,
  watch,
} from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

import type {
  ImagesAdvAttributes,
  RasterAdjustments,
  RasterFiltersState,
  RasterLayer,
} from './types'

const props = defineProps<NodeViewProps>()

// Placeholder i18n (F2.x se integra con el sistema global)
const t = (key: string) => key

type ToolId =
  | 'brush'
  | 'eraser'
  | 'clone'
  | 'eyedropper'
  | 'selectRect'
  | 'lasso'
  | 'text'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

const currentTool = ref<ToolId>('brush')
const isPointerDown = ref(false)
const isDrawingStroke = ref(false)

const lastX = ref(0)
const lastY = ref(0)

const brushSize = ref(16)
const brushOpacity = ref(0.8)
const currentColor = ref<string | null>('#000000')

// Clonado
const cloneSourceX = ref<number | null>(null)
const cloneSourceY = ref<number | null>(null)

// Selección
const selectionStartX = ref(0)
const selectionStartY = ref(0)
const selectionRectLocal = ref<ImagesAdvAttributes['selectionRect']>(null)

// Zoom de visualización
const zoom = ref(1)

const attrs = computed<ImagesAdvAttributes>(() => props.node.attrs as ImagesAdvAttributes)

const adjustments = computed<RasterAdjustments>(() => attrs.value.adjustments)
const filters = computed<RasterFiltersState>(() => attrs.value.filters)
const removeExif = computed<boolean>(() => Boolean(attrs.value.removeExif))
const layers = computed<RasterLayer[]>(() => attrs.value.layers || [])
const activeLayerId = computed<string | null>(() => attrs.value.activeLayerId || null)

const canvasStyle = computed(() => {
  const a = adjustments.value
  const f = filters.value

  const brightness = a.brightness || 1
  const contrast = a.contrast || 1
  const saturation = a.saturation || 1
  const blur = f.blur || 0

  const filterParts = [
    `brightness(${brightness})`,
    `contrast(${contrast})`,
    `saturate(${saturation})`,
  ]

  if (blur > 0) {
    filterParts.push(`blur(${blur}px)`)
  }

  if (f.preset === 'bw') {
    filterParts.push('grayscale(1)')
  } else if (f.preset === 'sepia') {
    filterParts.push('sepia(0.9)')
  }

  return {
    filter: filterParts.join(' '),
    maxWidth: '100%',
    display: 'block',
  }
})

const canvasZoomStyle = computed(() => ({
  transform: `scale(${zoom.value})`,
  transformOrigin: 'center center',
}))

const selectionRect = computed(() => selectionRectLocal.value)

const selectionStyle = computed(() => {
  if (!selectionRectLocal.value || !canvasRef.value) return {}
  const r = selectionRectLocal.value

  return {
    left: `${r.x}px`,
    top: `${r.y}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
  }
})

function setTool(tool: ToolId) {
  currentTool.value = tool
}

/**
 * Inicializa el canvas con la imagen actual (src).
 */
function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const imageSrc = attrs.value.src
  if (!imageSrc) return

  const image = new Image()
  image.onload = () => {
    const maxWidth = 800
    const scale =
      image.width > maxWidth ? maxWidth / image.width : 1

    const w = image.width * scale
    const h = image.height * scale

    canvas.width = w
    canvas.height = h

    const context = canvas.getContext('2d')
    if (!context) return

    ctx.value = context
    context.clearRect(0, 0, w, h)
    context.drawImage(image, 0, 0, w, h)
  }
  image.onerror = () => {
    // noop
  }
  image.src = imageSrc
}

function canvasCoordsFromEvent(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) / zoom.value,
    y: (e.clientY - rect.top) / zoom.value,
  }
}

function onPointerDown(e: MouseEvent) {
  const coords = canvasCoordsFromEvent(e)
  if (!coords || !ctx.value || !canvasRef.value) return

  isPointerDown.value = true

  if (currentTool.value === 'selectRect' || currentTool.value === 'lasso') {
    selectionStartX.value = coords.x
    selectionStartY.value = coords.y
    selectionRectLocal.value = {
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
    }
    return
  }

  if (currentTool.value === 'text') {
    const text = window.prompt(t('editor.ext.imagesAdv.tool.text'))
    if (text && ctx.value) {
      ctx.value.save()
      ctx.value.font = '16px sans-serif'
      ctx.value.fillStyle = currentColor.value || '#000000'
      ctx.value.textBaseline = 'top'
      ctx.value.fillText(text, coords.x, coords.y)
      ctx.value.restore()
      persistCanvasToAttrs()
    }
    return
  }

  if (currentTool.value === 'eyedropper') {
    const color = sampleColorAt(coords.x, coords.y)
    if (color) {
      currentColor.value = color
    }
    return
  }

  if (currentTool.value === 'clone' && e.altKey) {
    // Alt+clic define el origen del clonado
    cloneSourceX.value = coords.x
    cloneSourceY.value = coords.y
    return
  }

  if (
    currentTool.value === 'brush' ||
    currentTool.value === 'eraser' ||
    currentTool.value === 'clone'
  ) {
    isDrawingStroke.value = true
    lastX.value = coords.x
    lastY.value = coords.y
  }
}

function onPointerMove(e: MouseEvent) {
  if (!isPointerDown.value || !canvasRef.value) return

  const coords = canvasCoordsFromEvent(e)
  if (!coords || !ctx.value) return

  const context = ctx.value

  if (
    currentTool.value === 'selectRect' ||
    currentTool.value === 'lasso'
  ) {
    const x = Math.min(selectionStartX.value, coords.x)
    const y = Math.min(selectionStartY.value, coords.y)
    const w = Math.abs(coords.x - selectionStartX.value)
    const h = Math.abs(coords.y - selectionStartY.value)

    selectionRectLocal.value = {
      x,
      y,
      width: w,
      height: h,
    }
    return
  }

  if (!isDrawingStroke.value) return

  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.lineWidth = brushSize.value

  if (currentTool.value === 'brush') {
    context.globalCompositeOperation = 'source-over'
    context.globalAlpha = brushOpacity.value
    context.strokeStyle = currentColor.value || '#000000'
    context.beginPath()
    context.moveTo(lastX.value, lastY.value)
    context.lineTo(coords.x, coords.y)
    context.stroke()
  } else if (currentTool.value === 'eraser') {
    context.globalCompositeOperation = 'destination-out'
    context.globalAlpha = 1
    context.strokeStyle = '#ffffff'
    context.beginPath()
    context.moveTo(lastX.value, lastY.value)
    context.lineTo(coords.x, coords.y)
    context.stroke()
  } else if (
    currentTool.value === 'clone' &&
    cloneSourceX.value != null &&
    cloneSourceY.value != null
  ) {
    const size = brushSize.value * 2
    const sx = cloneSourceX.value + (coords.x - lastX.value) - size / 2
    const sy = cloneSourceY.value + (coords.y - lastY.value) - size / 2
    const dx = coords.x - size / 2
    const dy = coords.y - size / 2

    const imgData = context.getImageData(sx, sy, size, size)
    context.putImageData(imgData, dx, dy)
  }

  lastX.value = coords.x
  lastY.value = coords.y
}

function onPointerUp() {
  if (!isPointerDown.value) return
  isPointerDown.value = false

  if (
    currentTool.value === 'selectRect' ||
    currentTool.value === 'lasso'
  ) {
    const type = currentTool.value === 'selectRect' ? 'rect' : 'lasso'
    props.updateAttributes({
      selectionType: type,
      selectionRect: selectionRectLocal.value,
    })
  }

  if (isDrawingStroke.value) {
    isDrawingStroke.value = false
    persistCanvasToAttrs()
  }
}

/**
 * Guarda el canvas como dataURL (WebP) en attrs.src
 */
function persistCanvasToAttrs() {
  const canvas = canvasRef.value
  if (!canvas) return

  const dataUrl = canvas.toDataURL('image/webp', 0.9)

  props.updateAttributes({
    src: dataUrl,
    format: 'webp',
  })
}

function onAdjustChange(
  key: keyof RasterAdjustments,
  event: Event,
) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)

  const next: RasterAdjustments = {
    ...adjustments.value,
    [key]: value,
  }

  props.updateAttributes({
    adjustments: next,
  })
}

function onFilterChange(
  key: keyof RasterFiltersState,
  event: Event,
) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)

  const next: RasterFiltersState = {
    ...filters.value,
    [key]: value,
  }

  props.updateAttributes({
    filters: next,
  })
}

function applyPreset(preset: RasterFiltersState['preset']) {
  const baseAdjustments: RasterAdjustments = {
    ...adjustments.value,
  }
  const baseFilters: RasterFiltersState = {
    ...filters.value,
    preset,
  }

  if (preset === 'bw') {
    baseAdjustments.saturation = 0
  } else if (preset === 'sepia') {
    baseAdjustments.saturation = 0.8
  } else if (preset === 'auto') {
    baseAdjustments.brightness = 1.05
    baseAdjustments.contrast = 1.1
    baseAdjustments.saturation = 1.05
    baseFilters.sharpen = Math.max(baseFilters.sharpen, 0.3)
  }

  props.updateAttributes({
    adjustments: baseAdjustments,
    filters: baseFilters,
  })
}

function resetAdjustments() {
  props.updateAttributes({
    adjustments: {
      brightness: 1,
      contrast: 1,
      exposure: 0,
      temperature: 0,
      saturation: 1,
    },
    filters: {
      blur: 0,
      sharpen: 0,
      grain: 0,
      preset: 'none',
    },
  })
}

function toggleRemoveExif() {
  props.updateAttributes({
    removeExif: !removeExif.value,
  })
}

function exportToWebP() {
  const canvas = canvasRef.value
  if (!canvas) return

  const dataUrl = canvas.toDataURL('image/webp', 0.85)

  props.updateAttributes({
    src: dataUrl,
    format: 'webp',
  })
}

// --- Transformaciones: rotar / voltear / recortar ---

function cloneCurrentCanvas() {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context) return null

  const tmp = document.createElement('canvas')
  tmp.width = canvas.width
  tmp.height = canvas.height
  const tctx = tmp.getContext('2d')
  if (!tctx) return null
  tctx.drawImage(canvas, 0, 0)
  return { tmp, tctx }
}

function rotateCanvas(direction: 'left' | 'right') {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context) return

  const cloned = cloneCurrentCanvas()
  if (!cloned) return
  const { tmp } = cloned

  const oldW = canvas.width
  const oldH = canvas.height

  const newW = oldH
  const newH = oldW

  canvas.width = newW
  canvas.height = newH

  const c = canvas.getContext('2d')
  if (!c) return
  ctx.value = c

  c.save()
  c.clearRect(0, 0, newW, newH)

  if (direction === 'right') {
    c.translate(newW, 0)
    c.rotate(Math.PI / 2)
  } else {
    c.translate(0, newH)
    c.rotate(-Math.PI / 2)
  }

  c.drawImage(tmp, 0, 0)
  c.restore()

  selectionRectLocal.value = null
  props.updateAttributes({
    selectionRect: null,
    selectionType: null,
  })

  persistCanvasToAttrs()
}

function flipCanvas(orientation: 'horizontal' | 'vertical') {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context) return

  const cloned = cloneCurrentCanvas()
  if (!cloned) return
  const { tmp } = cloned

  const w = canvas.width
  const h = canvas.height

  const c = canvas.getContext('2d')
  if (!c) return
  ctx.value = c

  c.save()
  c.clearRect(0, 0, w, h)

  if (orientation === 'horizontal') {
    c.translate(w, 0)
    c.scale(-1, 1)
  } else {
    c.translate(0, h)
    c.scale(1, -1)
  }

  c.drawImage(tmp, 0, 0)
  c.restore()

  persistCanvasToAttrs()
}

function cropToSelection() {
  const canvas = canvasRef.value
  const context = ctx.value
  const rect = selectionRectLocal.value
  if (!canvas || !context || !rect) return
  if (rect.width <= 0 || rect.height <= 0) return

  const tmp = document.createElement('canvas')
  tmp.width = rect.width
  tmp.height = rect.height
  const tctx = tmp.getContext('2d')
  if (!tctx) return

  tctx.drawImage(
    canvas,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  )

  canvas.width = rect.width
  canvas.height = rect.height

  const c = canvas.getContext('2d')
  if (!c) return
  ctx.value = c

  c.clearRect(0, 0, rect.width, rect.height)
  c.drawImage(tmp, 0, 0)

  selectionRectLocal.value = null
  props.updateAttributes({
    selectionRect: null,
    selectionType: null,
  })

  persistCanvasToAttrs()
}

// --- Capas ---

function setActiveLayer(id: string) {
  props.updateAttributes({
    activeLayerId: id,
  })
}

function toggleLayerVisibility(id: string) {
  const next = layers.value.map((layer) =>
    layer.id === id
      ? { ...layer, visible: !layer.visible }
      : layer,
  )

  props.updateAttributes({
    layers: next,
  })
}

function renameLayer(id: string, name: string) {
  const next = layers.value.map((layer) =>
    layer.id === id ? { ...layer, name } : layer,
  )
  props.updateAttributes({ layers: next })
}

function changeLayerOpacity(id: string, opacity: number) {
  const next = layers.value.map((layer) =>
    layer.id === id ? { ...layer, opacity } : layer,
  )
  props.updateAttributes({ layers: next })
}

function addLayer() {
  const newLayer: RasterLayer = {
    id: `layer-${Date.now()}`,
    name: `Capa ${layers.value.length + 1}`,
    visible: true,
    opacity: 1,
    blendMode: 'normal',
  }

  props.updateAttributes({
    layers: [...layers.value, newLayer],
    activeLayerId: newLayer.id,
  })
}

function removeActiveLayer() {
  if (!activeLayerId.value || layers.value.length <= 1) return

  const filtered = layers.value.filter(
    l => l.id !== activeLayerId.value,
  )
  const nextActive =
    filtered[filtered.length - 1]?.id ?? 'base'

  props.updateAttributes({
    layers: filtered,
    activeLayerId: nextActive,
  })
}

// --- Utilidades ---

function sampleColorAt(x: number, y: number): string | null {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context) return null

  const data = context.getImageData(x, y, 1, 1).data
  const [r, g, b, a] = data
  if (a === 0) return null
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`
}

onMounted(() => {
  initCanvas()
})

watch(
  () => attrs.value.src,
  () => {
    initCanvas()
  },
)
</script>

<style scoped>
.images-adv-node-wrapper {
  display: block;
  margin: 1rem 0;
}

.images-adv-node {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.images-adv-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tools-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: 0.75rem;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 999px;
  padding: 2px 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 11px;
  cursor: pointer;
  color: #4b3f72;
  font-weight: 500;
}

.tool-btn span {
  white-space: nowrap;
}

.tool-btn.active {
  background: #ede9fe;
  border-color: #a855f7;
}

.tool-btn.subtle {
  font-size: 11px;
  padding-inline: 10px;
}

.tool-btn.primary {
  background: #4b3f72;
  border-color: #4b3f72;
  color: #ffffff;
}

.tool-btn.primary:hover {
  background: #433266;
}

.color-swatch {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.slider-label {
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slider-label input[type='range'] {
  width: 120px;
}

.images-adv-body {
  display: flex;
  min-height: 260px;
}

/* Capas */
.layers-panel {
  width: 180px;
  border-right: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
}

.layers-header {
  padding: 0.4rem 0.5rem;
  font-size: 11px;
  font-weight: 600;
  color: #4b3f72;
  border-bottom: 1px solid #e5e7eb;
}

.layers-list {
  flex: 1;
  margin: 0;
  padding: 0.25rem 0.25rem;
  list-style: none;
  overflow: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
}

.layer-item.active {
  background: #ede9fe;
}

.layer-visibility {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.layer-name {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 11px;
  padding: 1px 4px;
}

.layer-opacity {
  width: 60px;
}

.layers-footer {
  padding: 0.3rem 0.4rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 4px;
}

.tool-btn.small {
  padding: 0 6px;
  font-size: 11px;
}

/* Canvas + zoom */
.images-adv-canvas-outer {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f3f4f6;
}

.images-adv-canvas-container {
  position: relative;
  padding: 0.75rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.images-adv-canvas {
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #e5e7eb;
}

/* Selección */
.selection-rect {
  position: absolute;
  border: 1px dashed #4b3f72;
  pointer-events: none;
}

/* Footer */
.images-adv-footer {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.adjustments {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.export-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 11px;
}
</style>
