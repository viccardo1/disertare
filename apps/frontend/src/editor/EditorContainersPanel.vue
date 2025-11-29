<!-- apps/frontend/src/editor/EditorContainersPanel.vue -->
<template>
  <aside class="containers-panel">
    <header class="containers-panel__header">
      <h2 class="containers-panel__title">
        Zonas de texto
        <span class="containers-panel__phase">(F2.19)</span>
      </h2>
      <p class="containers-panel__subtitle">
        Define contenedores de texto asociados a imágenes o SVG del documento.
        Los valores de posición y tamaño están normalizados entre 0 y 1
        respecto al recurso asociado.
      </p>
    </header>

    <section class="containers-panel__body">
      <div class="containers-panel__toolbar">
        <label class="containers-panel__filter">
          <span>Filtrar por recurso</span>
          <input
            v-model="resourceFilter"
            type="text"
            class="containers-panel__filter-input"
            placeholder="id de recurso (img-…, svg-…)"
          >
        </label>

        <button
          type="button"
          class="containers-panel__add-btn"
          @click="onAdd"
        >
          Añadir contenedor
        </button>
      </div>

      <div v-if="filteredContainers.length === 0" class="containers-panel__empty">
        <p>
          No hay contenedores definidos
          <span v-if="resourceFilter">para el recurso {{ resourceFilter }}.</span>
        </p>
      </div>

      <ul v-else class="containers-panel__list">
        <li
          v-for="c in filteredContainers"
          :key="c.id"
          class="containers-panel__item"
        >
          <header class="containers-panel__item-header">
            <div class="containers-panel__item-id">
              <span class="badge">
                {{ c.id }}
              </span>
              <span class="containers-panel__item-label">
                Recurso:
              </span>
              <input
                v-model="c.resourceId"
                type="text"
                class="containers-panel__item-input"
                @change="onResourceChange(c.id, c.resourceId)"
              >
            </div>

            <button
              type="button"
              class="containers-panel__remove-btn"
              @click="onRemove(c.id)"
            >
              Eliminar
            </button>
          </header>

          <section class="containers-panel__grid">
            <label class="containers-panel__field">
              <span>X</span>
              <input
                v-model.number="c.x"
                type="number"
                min="0"
                max="1"
                step="0.01"
                @change="onRectChange(c)"
              >
            </label>

            <label class="containers-panel__field">
              <span>Y</span>
              <input
                v-model.number="c.y"
                type="number"
                min="0"
                max="1"
                step="0.01"
                @change="onRectChange(c)"
              >
            </label>

            <label class="containers-panel__field">
              <span>Ancho</span>
              <input
                v-model.number="c.width"
                type="number"
                min="0.01"
                max="1"
                step="0.01"
                @change="onRectChange(c)"
              >
            </label>

            <label class="containers-panel__field">
              <span>Alto</span>
              <input
                v-model.number="c.height"
                type="number"
                min="0.01"
                max="1"
                step="0.01"
                @change="onRectChange(c)"
              >
            </label>
          </section>
        </li>
      </ul>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Editor } from '@tiptap/core'
import { useTextContainers } from './composables/useTextContainers'
import type { TextContainerRegion } from './composables/usePageSections'

interface RectContainerViewModel {
  id: string
  resourceId: string
  x: number
  y: number
  width: number
  height: number
}

// Por compatibilidad con el resto de paneles, aceptamos editor aunque
// en F2.19 no lo usemos directamente (en F3.x se puede aprovechar).
const props = defineProps<{ editor: Editor | null }>()

const { containers, addContainer, updateContainer, removeContainer } = useTextContainers()

const resourceFilter = ref('')

const viewState = reactive<Record<string, RectContainerViewModel>>({})

function ensureViewModel(region: TextContainerRegion): RectContainerViewModel {
  const existing = viewState[region.id]
  if (existing) return existing

  const points = region.shape?.points ?? []
  const p1 = points[0] ?? { x: 0.1, y: 0.1 }
  const p2 = points[1] ?? { x: 0.9, y: 0.9 }

  const x = Math.min(p1.x, p2.x)
  const y = Math.min(p1.y, p2.y)
  const width = Math.max(0.01, Math.abs(p2.x - p1.x))
  const height = Math.max(0.01, Math.abs(p2.y - p1.y))

  const vm: RectContainerViewModel = {
    id: region.id,
    resourceId: region.resourceId,
    x,
    y,
    width,
    height,
  }

  viewState[region.id] = vm
  return vm
}

const allContainers = computed<RectContainerViewModel[]>(() =>
  containers.value.map(region => ensureViewModel(region)),
)

const filteredContainers = computed(() => {
  if (!resourceFilter.value.trim()) {
    return allContainers.value
  }

  return allContainers.value.filter(c =>
    c.resourceId.toLowerCase().includes(resourceFilter.value.trim().toLowerCase()),
  )
})

function onAdd() {
  const baseResource = resourceFilter.value.trim()
  addContainer(baseResource)
}

function onRemove(id: string) {
  delete viewState[id]
  removeContainer(id)
}

function onResourceChange(id: string, resourceId: string) {
  updateContainer(id, { resourceId })
}

function onRectChange(vm: RectContainerViewModel) {
  const x = clamp(vm.x, 0, 1)
  const y = clamp(vm.y, 0, 1)
  const width = clamp(vm.width, 0.01, 1)
  const height = clamp(vm.height, 0.01, 1)

  vm.x = x
  vm.y = y
  vm.width = width
  vm.height = height

  const x2 = Math.min(1, x + width)
  const y2 = Math.min(1, y + height)

  updateContainer(vm.id, {
    shape: {
      kind: 'rect',
      points: [
        { x, y },
        { x: x2, y: y2 },
      ],
    },
  } as TextContainerRegion)
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

// Si se borran contenedores desde otro sitio, limpiamos el estado local
watch(
  containers,
  (next) => {
    const ids = new Set(next.map(c => c.id))
    for (const id of Object.keys(viewState)) {
      if (!ids.has(id)) {
        delete viewState[id]
      }
    }
  },
  { deep: true },
)
</script>

<style scoped>
.containers-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e0d6ff;
  background: #fbf9ff;
  font-size: 13px;
}

.containers-panel__header {
  margin-bottom: 4px;
}

.containers-panel__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #4b3f72;
}

.containers-panel__phase {
  font-size: 11px;
  font-weight: 500;
  color: #7a6fb4;
  margin-left: 4px;
}

.containers-panel__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b6b83;
}

.containers-panel__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.containers-panel__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
  justify-content: space-between;
}

.containers-panel__filter {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #55516b;
}

.containers-panel__filter-input {
  min-width: 180px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid #d8cffd;
  font-size: 12px;
  background: #ffffff;
}

.containers-panel__add-btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 999px;
  border: 1px solid #d7d1f8;
  background: #ffffff;
  cursor: pointer;
}

.containers-panel__add-btn:hover {
  border-color: #8e83ff;
}

.containers-panel__empty {
  padding: 8px;
  font-size: 12px;
  color: #5e5980;
  font-style: italic;
}

.containers-panel__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.containers-panel__item {
  border-radius: 8px;
  border: 1px solid #e2dcff;
  background: #ffffff;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.containers-panel__item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.containers-panel__item-id {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.containers-panel__item-label {
  color: #55516b;
}

.containers-panel__item-input {
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid #d8cffd;
  font-size: 12px;
  min-width: 140px;
}

.containers-panel__remove-btn {
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid #f97373;
  background: #fff5f5;
  color: #b91c1c;
  font-size: 11px;
  cursor: pointer;
}

.containers-panel__remove-btn:hover {
  background: #fee2e2;
}

.containers-panel__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(60px, 1fr));
  gap: 6px;
}

.containers-panel__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #55516b;
}

.containers-panel__field input {
  padding: 2px 4px;
  border-radius: 6px;
  border: 1px solid #d8cffd;
  font-size: 12px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 999px;
  background: #e4ddff;
  font-size: 10px;
  color: #433266;
}
</style>
