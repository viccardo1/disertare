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

<!-- packages/editor-ext-images/src/ImageNodeView.vue -->
<template>
  <NodeViewWrapper
    class="image-node-wrapper"
    :aria-label="t('editor.ext.images.edit_image')"
  >
    <div
      ref="imageContainer"
      class="image-node"
      :class="{ 'image-inline': inline, 'image-block': !inline }"
      :tabindex="0"
      role="button"
      @click="selectImage"
      @keydown.enter="openEditor"
      @keydown.space.prevent="openEditor"
    >
      <img
        ref="imgRef"
        :src="src"
        :alt="alt"
        :title="title"
        :style="imageStyle"
        class="image-content"
        @load="onLoad"
        @error="onError"
      />

      <div v-if="loading" class="image-placeholder">Cargando…</div>
      <div v-if="error" class="image-error">Error al cargar la imagen</div>

      <div v-if="selected" class="image-controls">
        <button
          class="control-btn"
          :aria-label="t('editor.ext.images.resize')"
          @mousedown="startResize"
        >
          ↖
        </button>
        <button
          class="control-btn rotate"
          :aria-label="t('editor.ext.images.rotate')"
          @click="rotate"
        >
          ↻
        </button>
        <button
          class="control-btn flip"
          :aria-label="t('editor.ext.images.flip_x')"
          @click="toggleFlipX"
        >
          ↔
        </button>
        <button
          class="control-btn flip"
          :aria-label="t('editor.ext.images.flip_y')"
          @click="toggleFlipY"
        >
          ↕
        </button>
        <button
          class="control-btn crop"
          :aria-label="t('editor.ext.images.crop')"
          @click="openCrop"
        >
          ✂
        </button>

        <!-- F2.15: editor raster avanzado -->
        <button
          class="control-btn advanced"
          :aria-label="t('editor.ext.images.open_advanced')"
          @click.stop="openAdvancedEditor"
        >
          ★
        </button>
      </div>

      <!-- 🔥 F2.19: indicador visual de contenedores -->
      <div
        v-if="hasContainers"
        class="image-container-indicator"
      >
        Contenedores activos
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

// --- NUEVO: resourceId (opcional, no rompe nada)
const resourceId = computed(() => props.node.attrs.resourceId ?? null)

// En F2.19 lo asignará automáticamente el editor si no existe
if (!resourceId.value && props.updateAttributes) {
  props.updateAttributes({
    resourceId: `img-${Math.random().toString(36).slice(2, 10)}`,
  })
}

// --- Resto de los attrs
const imageContainer = ref<HTMLDivElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)

const src = computed(() => props.node.attrs.src)
const alt = computed(() => props.node.attrs.alt || '')
const title = computed(() => props.node.attrs.title || '')
const width = computed(() => props.node.attrs.width || 'auto')
const height = computed(() => props.node.attrs.height || 'auto')
const rotation = computed(() => Number(props.node.attrs.rotation) || 0)
const isFlippedX = computed(() => Boolean(props.node.attrs.flipX))
const isFlippedY = computed(() => Boolean(props.node.attrs.flipY))
const inline = computed(() => props.node.type.spec.inline)

const loading = ref(true)
const error = ref(false)
const selected = ref(false)

// Placeholder i18n
const t = (key: string) => key

const imageStyle = computed(() => ({
  width: width.value,
  height: height.value,
  transform: `rotate(${rotation.value}deg) scaleX(${isFlippedX.value ? -1 : 1}) scaleY(${isFlippedY.value ? -1 : 1})`,
  transformOrigin: 'center',
  display: inline.value ? 'inline-block' : 'block',
}))

/* --------------------------------
 * 🔥 F2.19: detectar contenedores activos
 * El frontend revisará section.layout.containers.filter(c => c.resourceId === resourceId)
 * y activará un comando updateAttributes({ hasContainers: true })
 * -------------------------------- */
const hasContainers = computed(() => Boolean(props.node.attrs.hasContainers))

const onLoad = () => {
  loading.value = false
  error.value = false
}

const onError = () => {
  loading.value = false
  error.value = true
}

const selectImage = () => {
  selected.value = true
  props.editor.commands.setNodeSelection(props.getPos() as number)
}

const openEditor = () => {
  selectImage()
}

const rotate = () => {
  const newRotation = (rotation.value + 90) % 360
  props.updateAttributes({ rotation: newRotation })
}

const toggleFlipX = () => {
  props.updateAttributes({ flipX: !isFlippedX.value })
}

const toggleFlipY = () => {
  props.updateAttributes({ flipY: !isFlippedY.value })
}

const startResize = (e: MouseEvent) => {
  e.preventDefault()
  if (!imgRef.value) return

  const startX = e.clientX
  const startY = e.clientY
  const startWidth = imgRef.value.offsetWidth
  const startHeight = imgRef.value.offsetHeight

  const onMouseMove = (moveEvent: MouseEvent) => {
    const dx = moveEvent.clientX - startX
    const dy = moveEvent.clientY - startY

    const newWidth = Math.max(50, startWidth + dx)
    const newHeight = Math.max(50, startHeight + dy)

    props.updateAttributes({
      width: `${newWidth}px`,
      height: `${newHeight}px`,
    })
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const openCrop = () => {
  console.log('[editor-ext-images] crop not implemented (F2.x)')
}

const openAdvancedEditor = () => {
  const commands: any = props.editor.commands
  if (commands && typeof commands.convertImageToImagesAdv === 'function') {
    commands.convertImageToImagesAdv()
  }
}

const handleClickOutside = (e: MouseEvent) => {
  const el = imageContainer.value
  if (el && !el.contains(e.target as Node)) {
    selected.value = false
  }
}

onMounted(() => {
  if (imgRef.value?.complete) {
    loading.value = false
  }
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Estilos previos (intactos) */

.image-container-indicator {
  position: absolute;
  top: -22px;
  left: 0;
  background: #6a5af9dd;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
