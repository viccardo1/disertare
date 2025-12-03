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

<!-- packages/editor-ext-slides/src/SlidesNodeView.vue -->
<template>
  <NodeViewWrapper
    class="slides-node"
    :class="[`slides-theme-${theme}`]"
    :aria-label="'Deck de diapositivas'"
  >
    <div
      class="slides-frame"
      :class="{ 'slides-selected': selected }"
      @click.stop="selectNode"
    >
      <header class="slides-header">
        <div class="slides-title-block">
          <span class="slides-label">SLIDES</span>
          <span class="slides-title-text">
            {{ deckTitle || 'Presentación sin título' }}
          </span>
        </div>
        <span class="slides-counter">
          {{ currentIndex + 1 }} / {{ slides.length || 0 }}
        </span>
      </header>

      <div class="slides-body">
        <div
          v-if="slides.length"
          class="slides-viewport"
        >
          <div class="slide-main">
            <div class="slide-main-layout">
              <span class="slide-layout-chip">
                {{ humanLayout }}
              </span>
            </div>

            <h3
              v-if="currentSlideTitle"
              class="slide-main-title"
            >
              {{ currentSlideTitle }}
            </h3>

            <p
              v-if="currentSlideBody && layout !== 'blank'"
              class="slide-main-content"
            >
              {{ currentSlideBody }}
            </p>

            <div
              v-if="layout === 'title-image' && currentImageUrl"
              class="slide-main-image"
            >
              <div class="slide-main-image-inner">
                <!-- Imagen representativa (no editable desde aquí) -->
                <div class="slide-main-image-thumb" />
                <span class="slide-main-image-caption">
                  Imagen vinculada
                </span>
              </div>
            </div>
          </div>

          <div class="slide-strip">
            <button
              v-for="(slide, index) in slides"
              :key="slide.id"
              type="button"
              class="strip-slide"
              :class="{ 'strip-slide-active': index === currentIndex }"
              @click.stop="setIndex(index)"
            >
              <span class="strip-slide-index">{{ index + 1 }}</span>
            </button>
          </div>
        </div>

        <div
          v-else
          class="slides-empty-preview"
        >
          <p class="slides-empty-title">
            Sin diapositivas
          </p>
          <p class="slides-empty-text">
            Usa el panel <strong>Presentaciones</strong> para crear el deck.
          </p>
        </div>
      </div>

      <footer class="slides-footer">
        <span v-if="deckId" class="slides-deck-id">
          Deck: {{ deckId }}
        </span>
        <span class="slides-hint">
          Haz clic para seleccionar el bloque. El Canvas lateral controla
          diapositivas, diseño e imágenes.
        </span>
      </footer>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'
import type { SlideDto, SlideLayout } from './types'

const props = defineProps<NodeViewProps>()

const selected = ref(false)
const currentIndex = ref(0)

const deckTitle = computed(
  () => (props.node.attrs.title as string | undefined) ?? '',
)

const theme = computed(
  () => (props.node.attrs.theme as string | undefined) ?? 'default',
)

const deckId = computed(
  () => (props.node.attrs.deckId as string | undefined) ?? '',
)

/**
 * Intenta leer attrs.slides (JSON) y, si no existe o falla, cae
 * al formato legacy attrs.content (texto con "\n---\n").
 */
type SlideInternal = {
  id: string
  title: string
  body: string
  layout: SlideLayout
  imageUrl?: string
}

function createId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  const time = Date.now().toString(36)
  return `${prefix}-${time}-${rand}`
}

const slides = computed<SlideInternal[]>(() => {
  const rawSlides = props.node.attrs.slides as string | null | undefined

  // 1) JSON (F2.12)
  if (rawSlides) {
    try {
      const dto = JSON.parse(rawSlides) as SlideDto[]
      if (Array.isArray(dto)) {
        return dto.map((s, index) => ({
          id: createId('slide'),
          title: (s.title ?? '').trim() || `Diapositiva ${index + 1}`,
          body: s.body ?? '',
          layout: (s.layout as SlideLayout) || 'title-content',
          imageUrl: s.imageUrl,
        }))
      }
    } catch {
      // Si falla, continuamos con legacy.
    }
  }

  // 2) Legacy: attrs.content usando "\n---\n"
  const rawContent =
    (props.node.attrs.content as string | undefined) ??
    'Slide 1\n---\nSlide 2\n---\nSlide 3'

  const chunks = rawContent.split(/\n---\n/g)
  if (!chunks.length) {
    return []
  }

  return chunks.map((chunk, index) => {
    const lines = chunk.split('\n')
    const firstLine = (lines[0] || '').trim()
    const rest = lines.slice(1).join('\n')

    return {
      id: createId('slide'),
      title: firstLine || `Diapositiva ${index + 1}`,
      body: rest,
      layout: 'title-content' as SlideLayout,
    }
  })
})

const currentSlide = computed<SlideInternal | null>(() => {
  if (!slides.value.length) return null
  if (currentIndex.value < 0 || currentIndex.value >= slides.value.length) {
    return slides.value[0]
  }
  return slides.value[currentIndex.value]
})

const currentSlideTitle = computed(() => currentSlide.value?.title ?? '')
const currentSlideBody = computed(() => currentSlide.value?.body ?? '')
const currentImageUrl = computed(() => currentSlide.value?.imageUrl ?? '')

const layout = computed<SlideLayout>(() => currentSlide.value?.layout ?? 'title-content')

const humanLayout = computed(() => {
  switch (layout.value) {
    case 'title':
      return 'Solo título'
    case 'title-image':
      return 'Título + imagen'
    case 'blank':
      return 'En blanco'
    default:
      return 'Título + contenido'
  }
})

function clampIndex() {
  if (currentIndex.value >= slides.value.length) {
    currentIndex.value = slides.value.length - 1
  }
  if (currentIndex.value < 0) {
    currentIndex.value = 0
  }
}

function setIndex(idx: number) {
  currentIndex.value = idx
  clampIndex()
}

function selectNode() {
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

/* Tema base */
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

/* Vista principal */
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

.slide-main-layout {
  display: flex;
  justify-content: flex-end;
}

.slide-layout-chip {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4b3f72;
}

.slide-main-title {
  font-size: 12px;
  font-weight: 600;
  margin: 4px 0;
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

/* Imagen */
.slide-main-image {
  margin-top: 6px;
}

.slide-main-image-inner {
  border-radius: 4px;
  border: 1px dashed #d4d4d8;
  padding: 4px;
  background: #faf5ff;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.slide-main-image-thumb {
  width: 100%;
  height: 48px;
  border-radius: 3px;
  background: linear-gradient(
    135deg,
    rgba(148, 163, 184, 0.4),
    rgba(129, 140, 248, 0.5)
  );
}

.slide-main-image-caption {
  color: #4b5563;
}

/* Tira de miniaturas */
.slide-strip {
  width: 42px;
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
  padding: 0;
}

.strip-slide-active {
  background: #6a5af9;
  color: #fff;
  border-color: #6a5af9;
}

.strip-slide-index {
  font-weight: 600;
}

/* Vacío */
.slides-empty-preview {
  padding: 8px;
  border-radius: 4px;
  border: 1px dashed #e5e7eb;
  background: #f9fafb;
  font-size: 12px;
  color: #4b5563;
}

.slides-empty-title {
  margin: 0 0 2px;
  font-weight: 600;
}

.slides-empty-text {
  margin: 0;
}

/* Footer */
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

/* Variantes de tema muy ligeras */
.slides-theme-thesis .slides-frame {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.03);
}

.slides-theme-conference .slides-frame {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.04);
}

.slides-theme-dark .slides-frame {
  border-color: rgba(15, 23, 42, 0.7);
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
}

.slides-theme-dark .slides-label {
  color: #a5b4fc;
}
</style>
