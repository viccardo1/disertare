<!-- apps/frontend/src/editor/EditorSlidesPanel.vue -->
<template>
  <section class="slides-panel">
    <header class="slides-panel-header">
      <div class="slides-panel-title-block">
        <h2 class="slides-panel-title">
          Canvas de Presentaciones
        </h2>
        <p class="slides-panel-subtitle">
          Define cuántas diapositivas tendrá tu presentación y edítalas desde aquí.
        </p>
      </div>

      <button
        type="button"
        class="slides-panel-close"
        @click="emit('close')"
      >
        ✕
      </button>
    </header>

    <!-- Estados sin editor / sin nodo slides -->
    <div
      v-if="!editor"
      class="slides-panel-empty"
    >
      <p>El editor aún no está listo. Vuelve a abrir este panel cuando el documento termine de cargar.</p>
    </div>

    <div
      v-else-if="!hasDeck"
      class="slides-panel-empty"
    >
      <p class="slides-panel-empty-title">
        No hay ninguna presentación vinculada a este documento.
      </p>
      <p class="slides-panel-empty-text">
        Crea una presentación vacía y luego añade las diapositivas que necesites.
      </p>

      <button
        type="button"
        class="slides-btn slides-btn-primary"
        @click="createInitialDeck"
      >
        Crear presentación vacía
      </button>
    </div>

    <!-- Layout vertical del Canvas -->
    <div
      v-else
      class="slides-panel-body"
    >
      <!-- Metadatos del deck -->
      <section class="slides-section">
        <header class="slides-section-header">
          <h3 class="slides-section-title">
            Presentación
          </h3>
          <p class="slides-section-subtitle">
            Título general y plantilla visual (tema).
          </p>
        </header>

        <div class="slides-editor-form">
          <label class="slides-field">
            <span class="slides-field-label">Título del deck</span>
            <input
              v-model="deckTitle"
              type="text"
              class="slides-input"
              placeholder="Presentación sin título"
            >
          </label>

          <label class="slides-field">
            <span class="slides-field-label">Plantilla visual</span>
            <select
              v-model="deckTheme"
              class="slides-select"
            >
              <option value="default">Predeterminada</option>
              <option value="thesis">Tesis / académica</option>
              <option value="conference">Conferencia</option>
              <option value="dark">Oscura</option>
            </select>
          </label>
        </div>
      </section>

      <!-- Sección 1: lista de diapositivas -->
      <section class="slides-section">
        <header class="slides-section-header">
          <h3 class="slides-section-title">
            Diapositivas ({{ slides.length }})
          </h3>
          <p class="slides-section-subtitle">
            Gestiona el orden y selecciona qué diapositiva editar.
          </p>
        </header>

        <ol class="slides-thumbs-list">
          <li
            v-for="(slide, index) in slides"
            :key="slide.id"
            class="slides-thumb-item"
            :class="{ 'slides-thumb-item--active': index === currentIndex }"
            @click="selectSlide(index)"
          >
            <div class="slides-thumb-index">
              {{ index + 1 }}
            </div>
            <div class="slides-thumb-content">
              <div class="slides-thumb-title">
                {{ slide.title || `Diapositiva ${index + 1}` }}
              </div>
              <div
                v-if="slide.body"
                class="slides-thumb-body"
              >
                {{ slide.body }}
              </div>
              <div class="slides-thumb-meta">
                Layout:
                {{
                  slide.layout === 'title'
                    ? 'Solo título'
                    : slide.layout === 'blank'
                      ? 'En blanco'
                      : slide.layout === 'title-image'
                        ? 'Título + imagen'
                        : 'Título + contenido'
                }}
              </div>
            </div>
          </li>

          <li
            v-if="!slides.length"
            class="slides-thumb-empty"
          >
            No hay diapositivas. Usa “Nueva diapositiva” para comenzar.
          </li>
        </ol>

        <div class="slides-row-actions">
          <button
            type="button"
            class="slides-btn slides-btn-secondary"
            @click="moveSlideUp"
            :disabled="slides.length <= 1 || currentIndex <= 0"
          >
            Subir
          </button>
          <button
            type="button"
            class="slides-btn slides-btn-secondary"
            @click="moveSlideDown"
            :disabled="slides.length <= 1 || currentIndex >= slides.length - 1"
          >
            Bajar
          </button>
        </div>
      </section>

      <!-- Sección 2: edición de la diapositiva actual -->
      <section class="slides-section">
        <header class="slides-section-header">
          <h3 class="slides-section-title">
            <template v-if="slides.length">
              Diapositiva {{ currentIndex + 1 }} de {{ slides.length }}
            </template>
            <template v-else>
              Sin diapositivas
            </template>
          </h3>
          <p class="slides-section-subtitle">
            El bloque SLIDES del documento muestra la diapositiva activa. Desde aquí ajustas título, contenido y diseño.
          </p>
        </header>

        <div
          v-if="slides.length"
          class="slides-editor-form"
        >
          <label class="slides-field">
            <span class="slides-field-label">Diseño</span>
            <select
              v-model="currentLayout"
              class="slides-select"
            >
              <option value="title-content">
                Título + contenido
              </option>
              <option value="title">
                Solo título
              </option>
              <option value="title-image">
                Título + imagen
              </option>
              <option value="blank">
                En blanco
              </option>
            </select>
          </label>

          <label class="slides-field">
            <span class="slides-field-label">Título de la diapositiva</span>
            <input
              v-model="currentTitle"
              type="text"
              class="slides-input"
              placeholder="Introduce un título descriptivo"
            >
          </label>

          <label
            v-if="currentLayout !== 'blank'"
            class="slides-field"
          >
            <span class="slides-field-label">
              Contenido (texto principal)
            </span>
            <textarea
              v-model="currentBody"
              class="slides-textarea"
              rows="5"
              placeholder="Resumen, puntos clave o texto de apoyo"
            />
          </label>

          <label
            v-if="currentLayout === 'title-image'"
            class="slides-field"
          >
            <span class="slides-field-label">
              URL de la imagen (layout Título + imagen)
            </span>
            <input
              v-model="currentImageUrl"
              type="text"
              class="slides-input"
              placeholder="https://ejemplo.com/imagen.png"
            >
          </label>
        </div>

        <div
          v-else
          class="slides-editor-empty"
        >
          Crea la primera diapositiva con el botón
          <strong>Nueva diapositiva</strong>.
        </div>
      </section>

      <!-- Sección 3: acciones sobre el deck -->
      <section class="slides-section slides-section--footer">
        <div class="slides-editor-footer">
          <div class="slides-editor-buttons-left">
            <button
              type="button"
              class="slides-btn slides-btn-secondary"
              @click="addSlide"
            >
              Nueva diapositiva
            </button>

            <button
              type="button"
              class="slides-btn slides-btn-secondary"
              @click="duplicateSlide"
              :disabled="!slides.length"
            >
              Duplicar
            </button>

            <button
              type="button"
              class="slides-btn slides-btn-danger"
              @click="deleteSlide"
              :disabled="!slides.length"
            >
              Eliminar
            </button>
          </div>

          <div class="slides-editor-buttons-right">
            <button
              type="button"
              class="slides-btn slides-btn-secondary"
              @click="createSlideFromSelection"
            >
              Desde selección
            </button>

            <button
              type="button"
              class="slides-btn slides-btn-secondary"
              @click="onExportPptx"
              :disabled="!slides.length"
            >
              Exportar a PPTX
            </button>

            <button
              type="button"
              class="slides-btn slides-btn-primary"
              @click="saveDeck"
            >
              Guardar cambios
            </button>
          </div>
        </div>

        <p class="slides-help">
          El Canvas de Presentaciones es el eje central: aquí defines el número de diapositivas, su orden, su diseño, su
          contenido y, en F2.12, la imagen principal por diapositiva.
          Las animaciones, audio/video y exportación directa a PDF quedan reservadas para fases posteriores (F3/F4).
        </p>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'
import type { Editor } from '@tiptap/core'
import type {
  SlideLayout,
  SlideDto,
  SlidesThemeId,
} from '@disertare/editor-ext-slides'
import { exportSlidesDeck } from '../services/pptxExporter'

const props = defineProps<{
  editor: Editor | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

type SlideItem = {
  id: string
  title: string
  body: string
  layout: SlideLayout
  imageUrl?: string
}

const slides = ref<SlideItem[]>([])
const currentIndex = ref(0)
const deckPos = ref<number | null>(null)
const deckTitle = ref('Presentación sin título')
const deckTheme = ref<SlidesThemeId>('default')

const editor = computed(() => props.editor)

const hasDeck = computed(
  () => deckPos.value !== null,
)

function createId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  const time = Date.now().toString(36)
  return `${prefix}-${time}-${rand}`
}

const currentSlide = computed<SlideItem | null>(() => {
  if (!slides.value.length) return null
  if (currentIndex.value < 0 || currentIndex.value >= slides.value.length) {
    return null
  }
  return slides.value[currentIndex.value]
})

const currentTitle = computed({
  get() {
    return currentSlide.value?.title ?? ''
  },
  set(value: string) {
    if (!currentSlide.value) return
    currentSlide.value.title = value
  },
})

const currentBody = computed({
  get() {
    return currentSlide.value?.body ?? ''
  },
  set(value: string) {
    if (!currentSlide.value) return
    currentSlide.value.body = value
  },
})

const currentLayout = computed<SlideLayout>({
  get() {
    return currentSlide.value?.layout ?? 'title-content'
  },
  set(value: SlideLayout) {
    if (!currentSlide.value) return
    currentSlide.value.layout = value
  },
})

const currentImageUrl = computed({
  get() {
    return currentSlide.value?.imageUrl ?? ''
  },
  set(value: string) {
    if (!currentSlide.value) return
    currentSlide.value.imageUrl = value
  },
})

/**
 * Carga el deck desde el documento.
 */
function loadDeckFromEditor(): void {
  const ed = editor.value
  if (!ed) return

  let foundPos: number | null = null
  let rawSlides = ''
  let rawContent = ''
  let rawTitle = ''
  let rawTheme: SlidesThemeId = 'default'

  ed.state.doc.descendants((node, pos) => {
    if (node.type.name === 'slides') {
      foundPos = pos
      rawSlides = (node.attrs.slides as string | undefined) ?? ''
      rawContent = (node.attrs.content as string | undefined) ?? ''
      rawTitle = (node.attrs.title as string | undefined) ?? ''
      rawTheme = (node.attrs.theme as SlidesThemeId | undefined) ?? 'default'
      return false
    }
    return true
  })

  deckPos.value = foundPos
  deckTitle.value = rawTitle || 'Presentación sin título'
  deckTheme.value = rawTheme

  if (foundPos === null) {
    slides.value = []
    currentIndex.value = 0
    return
  }

  // 1) JSON estructurado
  if (rawSlides) {
    try {
      const parsed = JSON.parse(rawSlides) as SlideDto[]
      if (Array.isArray(parsed)) {
        slides.value = parsed.map((s, index) => ({
          id: createId('slide'),
          title: s.title ?? `Diapositiva ${index + 1}`,
          body: s.body ?? '',
          layout: (s.layout as SlideLayout) || 'title-content',
          imageUrl: s.imageUrl,
        }))
        currentIndex.value = 0
        return
      }
    } catch {
      // sigue con rawContent
    }
  }

  // 2) Fallback legacy
  const text = rawContent.trim()
  if (!text) {
    slides.value = []
    currentIndex.value = 0
    return
  }

  const chunks = text.split(/\n---\n/g)

  slides.value = chunks.map((chunk, index) => {
    const lines = chunk.split('\n')
    const firstLine = (lines[0] || '').trim()
    const rest = lines.slice(1).join('\n')

    return {
      id: createId('slide'),
      title: firstLine || `Diapositiva ${index + 1}`,
      body: rest ?? '',
      layout: 'title-content' as SlideLayout,
    }
  })

  currentIndex.value = 0
}

/**
 * Guarda el deck en attrs.slides (JSON) y en attrs.content (legacy).
 */
function commitDeckToEditor(): void {
  const ed = editor.value
  if (!ed) return
  if (deckPos.value === null) return

  const nodePos = deckPos.value
  const state = ed.state
  const node = state.doc.nodeAt(nodePos)

  if (!node || node.type.name !== 'slides') return

  const dto: SlideDto[] = slides.value.map(s => ({
    title: s.title ?? '',
    body: s.body ?? '',
    layout: (s.layout as SlideLayout) || 'title-content',
    imageUrl: s.imageUrl,
  }))

  const slidesJson = dto.length ? JSON.stringify(dto) : null

  const legacyContent =
    slides.value.length === 0
      ? ''
      : slides.value
          .map(s => {
            const t = (s.title || '').trim()
            const b = (s.body || '').trim()
            if (!b) return t
            return `${t}\n${b}`
          })
          .join('\n---\n')

  const attrs = {
    ...node.attrs,
    title: deckTitle.value || 'Presentación sin título',
    theme: deckTheme.value,
    slides: slidesJson,
    content: legacyContent,
  }

  ed
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.setNodeMarkup(nodePos, node.type, attrs)
      return true
    })
    .run()
}

/**
 * Sincronización automática.
 */
watch(
  slides,
  () => {
    commitDeckToEditor()
  },
  { deep: true },
)

watch([deckTitle, deckTheme], () => {
  commitDeckToEditor()
})

function createInitialDeck(): void {
  const ed = editor.value
  if (!ed) return

  ed
    .chain()
    .focus()
    .insertContent({
      type: 'slides',
      attrs: {
        title: 'Presentación sin título',
        theme: 'default',
        content: '',
        slides: null,
      },
    })
    .run()

  loadDeckFromEditor()
}

function selectSlide(index: number): void {
  if (index < 0 || index >= slides.value.length) return
  currentIndex.value = index
}

function addSlide(): void {
  slides.value.push({
    id: createId('slide'),
    title: `Diapositiva ${slides.value.length + 1}`,
    body: '',
    layout: 'title-content',
  })
  currentIndex.value = slides.value.length - 1
}

function duplicateSlide(): void {
  const src = currentSlide.value
  if (!src) return

  const copy: SlideItem = {
    id: createId('slide'),
    title: `${src.title} (copia)`,
    body: src.body,
    layout: src.layout,
    imageUrl: src.imageUrl,
  }

  slides.value.splice(currentIndex.value + 1, 0, copy)
  currentIndex.value += 1
}

function deleteSlide(): void {
  if (!slides.value.length) return

  slides.value.splice(currentIndex.value, 1)

  if (!slides.value.length) {
    currentIndex.value = 0
    return
  }

  if (currentIndex.value >= slides.value.length) {
    currentIndex.value = slides.value.length - 1
  }
}

function moveSlideUp(): void {
  const idx = currentIndex.value
  if (idx <= 0) return

  const arr = slides.value
  const tmp = arr[idx - 1]
  arr[idx - 1] = arr[idx]
  arr[idx] = tmp
  currentIndex.value = idx - 1
}

function moveSlideDown(): void {
  const idx = currentIndex.value
  if (idx >= slides.value.length - 1) return

  const arr = slides.value
  const tmp = arr[idx + 1]
  arr[idx + 1] = arr[idx]
  arr[idx] = tmp
  currentIndex.value = idx + 1
}

function createSlideFromSelection(): void {
  const ed = editor.value
  if (!ed) return

  const { from, to } = ed.state.selection
  const text = ed.state.doc.textBetween(from, to, '\n', ' ')
  const trimmed = text.trim()
  if (!trimmed) return

  const lines = trimmed.split('\n')
  const title = lines[0]?.trim() || 'Desde selección'
  const body = lines.slice(1).join('\n')

  slides.value.push({
    id: createId('slide'),
    title,
    body,
    layout: 'title-content',
  })

  currentIndex.value = slides.value.length - 1
}

function saveDeck(): void {
  commitDeckToEditor()

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info('[Slides] Deck sincronizado y listo para export PPTX.')
  }
}

async function onExportPptx(): Promise<void> {
  const deck = {
    title: deckTitle.value,
    theme: deckTheme.value,
    slides: slides.value.map<SlideDto>(s => ({
      title: s.title,
      body: s.body,
      layout: s.layout,
      imageUrl: s.imageUrl,
    })),
  }

  try {
    await exportSlidesDeck(deck)
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[Slides] Error exportando PPTX:', error)
    }
    // En F2.x no mostramos aún un toast global; se puede agregar en F3.
  }
}

onMounted(() => {
  loadDeckFromEditor()
})
</script>

<style scoped>
/* (exactamente igual al archivo que ya tenías, lo dejo tal cual) */

.slides-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  min-height: 0;
  overflow-x: hidden; /* sin scroll horizontal */
}

.slides-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e5e7eb;
}

.slides-panel-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.slides-panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.slides-panel-subtitle {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.slides-panel-close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 999px;
  flex-shrink: 0;
}

.slides-panel-close:hover {
  background: #e5e7eb;
}

.slides-panel-empty {
  padding: 8px 4px;
  font-size: 13px;
  color: #4b5563;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slides-panel-empty-title {
  margin: 0;
  font-weight: 600;
}

.slides-panel-empty-text {
  margin: 0;
}

/* Cuerpo: todo vertical, scroll solo vertical */
.slides-panel-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Secciones */
.slides-section {
  padding: 4px 0;
  border-bottom: 1px dashed #e5e7eb;
}

.slides-section--footer {
  border-bottom: none;
  padding-bottom: 2px;
}

.slides-section-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.slides-section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.slides-section-subtitle {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

/* Lista de diapositivas */

.slides-thumbs-list {
  list-style: none;
  padding: 0;
  margin: 4px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
  overflow-x: hidden;
}

.slides-thumb-item {
  display: flex;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: #f9fafb;
  cursor: pointer;
  font-size: 11px;
}

.slides-thumb-item--active {
  border-color: #6366f1;
  background: #eef2ff;
}

.slides-thumb-index {
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #4b5563;
  background: #ffffff;
  flex-shrink: 0;
}

.slides-thumb-content {
  flex: 1;
  overflow: hidden;
}

.slides-thumb-title {
  font-weight: 600;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slides-thumb-body {
  color: #6b7280;
  max-height: 2.5em;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slides-thumb-meta {
  font-size: 10px;
  color: #9ca3af;
}

.slides-thumb-empty {
  font-size: 12px;
  color: #6b7280;
  padding: 4px 6px;
  border-radius: 6px;
  background: #f9fafb;
}

/* Acciones de reordenamiento */

.slides-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

/* Formulario de edición */

.slides-editor-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slides-editor-empty {
  font-size: 12px;
  color: #6b7280;
}

/* Campos */

.slides-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slides-field-label {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
}

.slides-input,
.slides-select {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  padding: 4px 6px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}

.slides-textarea {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  padding: 4px 6px;
  font-size: 13px;
  resize: vertical;
  width: 100%;
  box-sizing: border-box;
}

/* Pie de acciones */

.slides-editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.slides-editor-buttons-left,
.slides-editor-buttons-right {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Botones */

.slides-btn {
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  max-width: 100%;
}

.slides-btn-primary {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #f9fafb;
}

.slides-btn-primary:hover {
  background: #4338ca;
  border-color: #4338ca;
}

.slides-btn-secondary {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.slides-btn-secondary:hover {
  background: #e5e7eb;
}

.slides-btn-danger {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.slides-btn-danger:hover {
  background: #fee2e2;
}

.slides-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Help */

.slides-help {
  margin: 0;
  font-size: 11px;
  color: #6b7280;
}
</style>
