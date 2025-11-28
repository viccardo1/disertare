<template>
  <section class="sidebar-panel">
    <header class="sidebar-panel__header">
      <h2 class="sidebar-panel__title">
        Diagramas SVG avanzados
      </h2>
      <p class="sidebar-panel__subtitle">
        Inserta, pega o ajusta el SVG actual. El panel toma como objetivo el
        nodo SVG que tengas seleccionado en el documento.
      </p>
    </header>

    <!-- Editor de markup SVG -->
    <section class="sidebar-panel__section">
      <h3 class="sidebar-panel__section-title">
        Marcado SVG
      </h3>
      <label class="sidebar-panel__label">
        Pega o edita el marcado SVG (etiqueta
        <code>&lt;svg&gt;…&lt;/svg&gt;</code> completa):
      </label>
      <textarea
        v-model="markup"
        class="sidebar-panel__textarea"
        rows="8"
        spellcheck="false"
        placeholder="<svg …> … </svg>"
      />

      <div class="sidebar-panel__actions">
        <button
          type="button"
          class="sidebar-panel__btn"
          @click="insertEmptySvg"
        >
          Nuevo lienzo SVG
        </button>

        <button
          type="button"
          class="sidebar-panel__btn sidebar-panel__btn--primary"
          :disabled="!markup.trim()"
          @click="applyMarkup"
        >
          Insertar / reemplazar
        </button>
      </div>

      <p class="sidebar-panel__hint">
        Si tienes un SVG ya insertado, selecciónalo en el documento para que el
        panel cargue su marcado y puedas editarlo aquí.
      </p>
    </section>

    <!-- Zoom del lienzo -->
    <section class="sidebar-panel__section">
      <h3 class="sidebar-panel__section-title">
        Zoom del lienzo
      </h3>

      <div class="sidebar-panel__zoom-row">
        <input
          v-model.number="zoomPercentage"
          type="range"
          min="25"
          max="300"
          step="5"
          class="sidebar-panel__zoom-range"
          @change="applyZoom"
        >
        <span class="sidebar-panel__zoom-label">
          {{ zoomPercentage }}%
        </span>
      </div>

      <p class="sidebar-panel__hint">
        El zoom sólo afecta la visualización del nodo SVG, no la resolución
        interna del gráfico.
      </p>
    </section>

    <section class="sidebar-panel__section sidebar-panel__section--help">
      <h3 class="sidebar-panel__section-title">
        Tips rápidos
      </h3>
      <ul class="sidebar-panel__list">
        <li>
          Usa <strong>SVG</strong> / <strong>SVG+</strong> en la barra
          principal para insertar un nuevo diagrama vectorial.
        </li>
        <li>
          Desde herramientas externas (Inkscape, Illustrator, etc.) copia el
          SVG como texto y pégalo en el área de marcado para traerlo a
          Disertare.
        </li>
        <li>
          Más adelante, F3.x podrá enviar este SVG como raster editable
          (Img+) para retoque pixel a pixel.
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { Editor } from '@tiptap/core'

const props = defineProps<{
  editor: Editor | null
}>()

/**
 * Marcado SVG actual (del nodo seleccionado, si lo hay) o texto nuevo
 * que el usuario quiera insertar.
 */
const markup = ref('')

/**
 * Zoom expresado en porcentaje (25–300). Internamente se lleva a 0.25–3.0.
 */
const zoomPercentage = ref(100)

/**
 * Editor actual al que estamos suscritos para selectionUpdate.
 */
let currentEditor: Editor | null = null
let selectionHandler: ((props: any) => void) | null = null

/**
 * Busca el nodo SVG relevante en la selección actual y devuelve sus attrs.
 * Soporta nombres de nodo `svg` o `svgAdv` según haya quedado definido
 * en la extensión.
 */
function getCurrentSvgAttrs() {
  const ed = props.editor
  if (!ed) return null

  const { from, to } = ed.state.selection
  let found: any = null

  ed.state.doc.nodesBetween(from, to, (node) => {
    if (node.type.name === 'svg' || node.type.name === 'svgAdv') {
      found = node.attrs
      return false
    }
    return !found
  })

  return found
}

/**
 * Sincroniza markup y zoom desde la selección actual.
 */
function syncFromSelection() {
  const attrs = getCurrentSvgAttrs()
  if (!attrs) return

  if (typeof attrs.svgMarkup === 'string') {
    markup.value = attrs.svgMarkup
  }

  const zoom =
    typeof attrs.view?.zoom === 'number' && !Number.isNaN(attrs.view.zoom)
      ? attrs.view.zoom
      : 1

  zoomPercentage.value = Math.round(zoom * 100)
}

/**
 * Inserta un nuevo lienzo SVG vacío en la posición actual.
 */
function insertEmptySvg() {
  const ed = props.editor
  if (!ed) return

  ;(ed.chain().focus() as any)
    .setSvgAdv({
      svgMarkup: null,
      layers: [],
      activeLayerId: null,
      selection: { type: null, ids: [] },
      view: {
        zoom: zoomPercentage.value / 100,
        panX: 0,
        panY: 0,
        showGrid: true,
        showGuides: true,
        snapToGrid: true,
        snapToGuides: true,
      },
    })
    .run()
}

/**
 * Inserta o reemplaza el nodo SVG con el marcado indicado.
 */
function applyMarkup() {
  const ed = props.editor
  if (!ed) return

  const text = markup.value.trim()
  if (!text) return

  const base = getCurrentSvgAttrs()

  const view =
    base?.view ?? {
      zoom: zoomPercentage.value / 100,
      panX: 0,
      panY: 0,
      showGrid: true,
      showGuides: true,
      snapToGrid: true,
      snapToGuides: true,
    }

  ;(ed.chain().focus() as any)
    .setSvgAdv({
      ...(base ?? {}),
      svgMarkup: text,
      view,
    })
    .run()
}

/**
 * Actualiza sólo el zoom del nodo SVG manteniendo el resto de attrs.
 */
function applyZoom() {
  const ed = props.editor
  if (!ed) return

  const attrs = getCurrentSvgAttrs()
  if (!attrs) return

  const view = {
    ...(attrs.view ?? {}),
    zoom: zoomPercentage.value / 100,
  }

  ;(ed.chain().focus() as any)
    .setSvgAdv({
      ...attrs,
      view,
    })
    .run()
}

/**
 * Suscribirse a selectionUpdate del editor cuando esté disponible.
 */
function setupSelectionListener(ed: Editor | null) {
  // limpiar anterior
  if (currentEditor && selectionHandler) {
    currentEditor.off('selectionUpdate', selectionHandler)
  }

  currentEditor = ed

  if (!ed) {
    return
  }

  selectionHandler = () => {
    syncFromSelection()
  }

  ed.on('selectionUpdate', selectionHandler)

  // sincroniza inmediatamente con la selección actual
  syncFromSelection()
}

onMounted(() => {
  setupSelectionListener(props.editor)
})

onBeforeUnmount(() => {
  if (currentEditor && selectionHandler) {
    currentEditor.off('selectionUpdate', selectionHandler)
  }
})

/**
 * Si el prop editor cambia (por recreación del editor), re-suscribimos.
 */
watch(
  () => props.editor,
  (ed) => {
    setupSelectionListener(ed ?? null)
  },
)
</script>

<style scoped>
.sidebar-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px;
  font-size: 13px;
  line-height: 1.4;
}

.sidebar-panel__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-panel__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.sidebar-panel__subtitle {
  margin: 0;
  color: #555;
}

.sidebar-panel__section {
  border-top: 1px solid #eee;
  padding-top: 12px;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-panel__section--help {
  padding-bottom: 8px;
}

.sidebar-panel__section-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}

.sidebar-panel__label {
  display: block;
  margin-bottom: 4px;
}

.sidebar-panel__textarea {
  width: 100%;
  min-height: 120px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  resize: vertical;
}

.sidebar-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sidebar-panel__btn {
  border-radius: 4px;
  border: 1px solid #d3cfff;
  background: #fff;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  color: #4b3f72;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.sidebar-panel__btn--primary {
  background: #4b3f72;
  color: #fff;
  border-color: #4b3f72;
}

.sidebar-panel__btn:hover {
  background: #f3ecff;
  border-color: #c1b6ff;
  box-shadow: 0 0 0 1px #d3cfff;
}

.sidebar-panel__btn--primary:hover {
  background: #3b315a;
  border-color: #3b315a;
}

.sidebar-panel__hint {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.sidebar-panel__zoom-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-panel__zoom-range {
  flex: 1;
}

.sidebar-panel__zoom-label {
  width: 48px;
  text-align: right;
}

.sidebar-panel__list {
  margin: 0;
  padding-left: 18px;
}
</style>
