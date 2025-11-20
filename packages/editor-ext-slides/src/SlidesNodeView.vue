<!-- packages/editor-ext-slides/src/SlidesNodeView.vue -->
<template>
  <NodeViewWrapper
    class="slides-node"
    :aria-label="t('editor.ext.slides.deck')"
  >
    <div
      class="slides-frame"
      :class="{ 'slides-selected': selected }"
      @click.stop="selectNode"
    >
      <div class="slides-header">
        <div class="slides-title-block">
          <span class="slides-label">SLIDES</span>
          <span class="slides-title-text">
            {{ title || t('editor.ext.slides.untitled_deck') }}
          </span>
        </div>
        <span class="slides-counter">
          {{ currentIndex + 1 }} / {{ slides.length }}
        </span>
      </div>

      <div class="slides-body">
        <div
          class="slides-viewport"
          :style="{ width, height }"
        >
          <div class="slide-main">
            <div class="slide-main-title">
              {{ slides[currentIndex]?.title || t('editor.ext.slides.untitled_slide') }}
            </div>
            <p class="slide-main-content">
              {{ slides[currentIndex]?.body }}
            </p>
          </div>

          <div class="slide-strip">
            <div
              v-for="(slide, index) in slides"
              :key="index"
              class="strip-slide"
              :class="{ 'strip-slide-active': index === currentIndex }"
            >
              <div class="strip-slide-index">{{ index + 1 }}</div>
            </div>
          </div>
        </div>

        <div class="slides-controls">
          <button
            type="button"
            class="slides-btn"
            @click.stop.prevent="prev"
            :disabled="slides.length <= 1"
          >
            ◀
          </button>
          <button
            type="button"
            class="slides-btn"
            @click.stop.prevent="next"
            :disabled="slides.length <= 1"
          >
            ▶
          </button>
        </div>
      </div>

      <div class="slides-footer">
        <span v-if="deckId" class="slides-deck-id">
          Deck: {{ deckId }}
        </span>
        <span class="slides-hint">
          {{ t('editor.ext.slides.placeholder_hint') }}
        </span>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

const selected = ref(false)
const currentIndex = ref(0)

// Placeholder i18n (F4.2+)
const t = (key: string) => key

// Atributos básicos del nodo Slides
const title = computed(() => props.node.attrs.title ?? '')
const deckId = computed(() => props.node.attrs.deckId ?? '')
const width = computed(() => props.node.attrs.width ?? '320px')
const height = computed(() => props.node.attrs.height ?? '200px')

// Contenido raw del deck (F2: muy simple, texto plano separado por "\n---\n")
const rawContent = computed(
  () =>
    (props.node.attrs.content as string | undefined) ??
    'Slide 1\n---\nSlide 2\n---\nSlide 3',
)

type Slide = {
  title: string
  body: string
}

// Partimos el contenido en diapositivas
const slides = computed<Slide[]>(() => {
  const chunks = rawContent.value.split(/\n---\n/g)
  if (!chunks.length) {
    return [
      {
        title: t('editor.ext.slides.untitled_slide'),
        body: '',
      },
    ]
  }

  return chunks.map((chunk, index) => {
    const lines = chunk.split('\n')
    const firstLine = (lines[0] || '').trim()
    const rest = lines.slice(1).join('\n')
    return {
      title:
        firstLine ||
        `${t('editor.ext.slides.slide')} ${index + 1}`,
      body: rest,
    }
  })
})

const clampIndex = () => {
  if (currentIndex.value >= slides.value.length) {
    currentIndex.value = slides.value.length - 1
  }
  if (currentIndex.value < 0) {
    currentIndex.value = 0
  }
}

const prev = () => {
  if (slides.value.length <= 1) return
  currentIndex.value =
    (currentIndex.value - 1 + slides.value.length) % slides.value.length
}

const next = () => {
  if (slides.value.length <= 1) return
  currentIndex.value = (currentIndex.value + 1) % slides.value.length
}

// Seleccionar el nodo en el editor TipTap
const selectNode = () => {
  selected.value = true
  clampIndex()
  props.editor.commands.setNodeSelection(props.getPos() as number)
}
</script>

<style scoped>
.slides-node {
  display: block;
  margin: 1em 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
}

.slides-frame {
  border-radius: 8px;
  border: 1px dashed rgba(106, 90, 249, 0.4);
  background: rgba(106, 90, 249, 0.02);
  padding: 8px 10px;
  cursor: pointer;
}

.slides-selected {
  box-shadow: 0 0 0 2px rgba(106, 90, 249, 0.5);
}

.slides-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}

.slides-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slides-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #6a5af9;
}

.slides-title-text {
  font-size: 13px;
  font-weight: 500;
}

.slides-counter {
  font-size: 11px;
  color: #555;
}

.slides-body {
  margin-bottom: 4px;
}

.slides-viewport {
  display: flex;
  gap: 6px;
  align-items: flex-start;
}

.slide-main {
  flex: 1;
  border-radius: 4px;
  border: 1px solid #e0d6ff;
  background: #ffffff;
  padding: 8px;
  min-height: 120px;
  box-sizing: border-box;
}

.slide-main-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  background: #f3efff;
  padding: 3px 4px;
  border-radius: 3px;
}

.slide-main-content {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.slide-strip {
  width: 40px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.strip-slide {
  border-radius: 3px;
  border: 1px solid #e0d6ff;
  background: #f8f6ff;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
}

.strip-slide-active {
  background: #6a5af9;
  color: #fff;
  border-color: #6a5af9;
}

.slides-controls {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 6px;
}

.slides-btn {
  border-radius: 999px;
  border: 1px solid #c3b9ff;
  background: #f3efff;
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
}

.slides-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.slides-btn:not(:disabled):hover {
  background: #e5ddff;
}

.slides-footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 11px;
  color: #555;
  margin-top: 4px;
}

.slides-deck-id {
  color: #555;
}

.slides-hint {
  color: #777;
}
</style>
