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
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

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
  console.log('[editor-ext-images] crop not implemented in F2')
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
.image-node-wrapper {
  display: inline-block;
}

.image-node {
  position: relative;
  display: inline-block;
  outline: none;
}

.image-inline {
  display: inline-block;
  vertical-align: bottom;
}

.image-block {
  display: block;
  text-align: center;
  margin: 1em auto;
}

.image-content {
  max-width: 100%;
  height: auto;
  display: block;
}

.image-placeholder,
.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  min-width: 100px;
  background: #f0f0f0;
  color: #666;
  font-size: 14px;
}

.image-node:focus,
.image-node:hover {
  outline: 2px solid #6a5af944;
}

.image-controls {
  position: absolute;
  bottom: -30px;
  left: 0;
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 24px;
  height: 24px;
  font-size: 12px;
  background: #e0d6ff33;
  border: 1px solid #6a5af944;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: #6a5af922;
}
</style>
