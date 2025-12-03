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

<!-- packages/editor-ext-diagrams-adv/src/IshikawaNodeView.vue -->
<template>
  <NodeViewWrapper class="diagram-ishikawa">
    <!-- Encabezado: título + descripción/efecto principal -->
    <header class="diagram-ishikawa__header">
      <input
        class="diagram-ishikawa__title"
        type="text"
        :value="title"
        placeholder="Diagrama de Ishikawa"
        @input="onTitleInput(($event.target as HTMLInputElement).value)"
      />

      <input
        class="diagram-ishikawa__description"
        type="text"
        :value="description"
        placeholder="Descripción / contexto (opcional)"
        @input="onDescriptionInput(($event.target as HTMLInputElement).value)"
      />
    </header>

    <!-- Cuerpo del diagrama: espina horizontal + ramas en ambos lados -->
    <div class="diagram-ishikawa__body">
      <!-- Lado izquierdo -->
      <div class="diagram-ishikawa__side diagram-ishikawa__side--left">
        <div
          v-for="(cat, index) in leftCategories"
          :key="cat.key"
          class="diagram-ishikawa__branch diagram-ishikawa__branch--left"
        >
          <!-- “Hueso” diagonal hacia la espina -->
          <div class="diagram-ishikawa__branch-bone" />

          <div class="diagram-ishikawa__branch-content">
            <div class="diagram-ishikawa__branch-label">
              <input
                type="text"
                :value="cat.label"
                placeholder="Categoría"
                @input="
                  onCategoryLabelInput(
                    index,
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>

            <ul class="diagram-ishikawa__causes">
              <li
                v-for="(cause, causeIndex) in cat.items"
                :key="`${cat.key}-${causeIndex}`"
              >
                <input
                  type="text"
                  :value="cause"
                  placeholder="Causa..."
                  @input="
                    onCauseInput(
                      index,
                      causeIndex,
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
              </li>
            </ul>

            <button
              type="button"
              class="diagram-ishikawa__add-cause"
              @click="addCause(index)"
            >
              +
            </button>
          </div>
        </div>

        <!-- Añadir rama en el lado izquierdo -->
        <button
          type="button"
          class="diagram-ishikawa__add-branch diagram-ishikawa__add-branch--left"
          @click="addCategoryLeft"
        >
          + Añadir rama izquierda
        </button>
      </div>

      <!-- Espina central + efecto -->
      <div class="diagram-ishikawa__center">
        <!-- Espina horizontal -->
        <div class="diagram-ishikawa__spine">
          <div class="diagram-ishikawa__spine-line" />
          <div class="diagram-ishikawa__spine-arrow" />
        </div>

        <!-- Efecto / problema principal -->
        <div class="diagram-ishikawa__effect-box">
          <textarea
            :value="effect"
            class="diagram-ishikawa__effect-input"
            placeholder="Efecto / problema principal"
            @input="
              onEffectInput(($event.target as HTMLTextAreaElement).value)
            "
          />
        </div>
      </div>

      <!-- Lado derecho -->
      <div class="diagram-ishikawa__side diagram-ishikawa__side--right">
        <div
          v-for="(cat, index) in rightCategories"
          :key="cat.key"
          class="diagram-ishikawa__branch diagram-ishikawa__branch--right"
        >
          <!-- “Hueso” diagonal hacia la espina -->
          <div class="diagram-ishikawa__branch-bone" />

          <div class="diagram-ishikawa__branch-content">
            <div class="diagram-ishikawa__branch-label">
              <input
                type="text"
                :value="cat.label"
                placeholder="Categoría"
                @input="
                  onCategoryLabelInput(
                    index + leftCategories.length,
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>

            <ul class="diagram-ishikawa__causes">
              <li
                v-for="(cause, causeIndex) in cat.items"
                :key="`${cat.key}-${causeIndex}`"
              >
                <input
                  type="text"
                  :value="cause"
                  placeholder="Causa..."
                  @input="
                    onCauseInput(
                      index + leftCategories.length,
                      causeIndex,
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
              </li>
            </ul>

            <button
              type="button"
              class="diagram-ishikawa__add-cause"
              @click="addCause(index + leftCategories.length)"
            >
              +
            </button>
          </div>
        </div>

        <!-- Añadir rama en el lado derecho -->
        <button
          type="button"
          class="diagram-ishikawa__add-branch diagram-ishikawa__add-branch--right"
          @click="addCategoryRight"
        >
          + Añadir rama derecha
        </button>
      </div>
    </div>

    <footer class="diagram-ishikawa__footer">
      Vista editable de Diagrama de Ishikawa (causa–efecto).
      Puedes añadir o quitar ramas en ambos lados, cambiar sus títulos y detallar
      las causas. El esquema 6M se usa como punto de partida, pero el usuario
      define la estructura final según sus necesidades.
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

type IshikawaCategory = {
  key: string
  label: string
  items: string[]
}

/**
 * Plantilla base 6M:
 * Método, Mano de obra, Maquinaria, Medición, Medio ambiente, Materiales.
 * Es el punto de partida, pero el usuario puede modificar etiquetas,
 * número de causas e incluso el número de ramas (añadir/eliminar).
 */
const DEFAULT_CATEGORIES: IshikawaCategory[] = [
  {
    key: 'metodo',
    label: 'Método',
    items: [''],
  },
  {
    key: 'mano-obra',
    label: 'Mano de obra',
    items: [''],
  },
  {
    key: 'maquinaria',
    label: 'Maquinaria',
    items: [''],
  },
  {
    key: 'medicion',
    label: 'Medición',
    items: [''],
  },
  {
    key: 'medio-ambiente',
    label: 'Medio ambiente',
    items: [''],
  },
  {
    key: 'materiales',
    label: 'Materiales',
    items: [''],
  },
]

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
}>()

const title = computed(
  () => props.node.attrs.title ?? 'Diagrama de Ishikawa',
)

const description = computed(
  () => props.node.attrs.description ?? '',
)

const effect = computed(
  () => props.node.attrs.effect ?? 'Efecto / problema principal',
)

/**
 * Categorías actuales:
 * - Si no hay nada en attrs.categories, usamos DEFAULT_CATEGORIES (6M).
 * - Si el usuario ya modificó/añadió/eliminó, respetamos lo que hay.
 */
const categories = computed<IshikawaCategory[]>(() => {
  const raw = props.node.attrs.categories as IshikawaCategory[] | undefined

  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_CATEGORIES
  }

  return raw.map((cat, index) => ({
    key: cat?.key ?? `cat-${index}`,
    label: cat?.label ?? `Categoría ${index + 1}`,
    items:
      Array.isArray(cat?.items) && cat.items.length > 0
        ? [...cat.items]
        : [''],
  }))
})

/**
 * División dinámica izquierda/derecha:
 * - Tomamos la mitad (redondeo hacia arriba) para el lado izquierdo.
 * - El resto para el lado derecho.
 * Permite que el número de ramas crezca o disminuya.
 */
const leftCategories = computed(() => {
  const all = categories.value
  const mid = Math.ceil(all.length / 2)
  return all.slice(0, mid)
})

const rightCategories = computed(() => {
  const all = categories.value
  const mid = Math.ceil(all.length / 2)
  return all.slice(mid)
})

function commitCategories(next: IshikawaCategory[]) {
  props.updateAttributes({
    categories: next,
  })
}

function onTitleInput(value: string) {
  props.updateAttributes({ title: value })
}

function onDescriptionInput(value: string) {
  props.updateAttributes({ description: value })
}

function onEffectInput(value: string) {
  props.updateAttributes({ effect: value })
}

function onCategoryLabelInput(index: number, value: string) {
  const current = categories.value
  const next = [...current]
  if (!next[index]) return

  next[index] = {
    ...next[index],
    label: value,
  }

  commitCategories(next)
}

function onCauseInput(index: number, causeIndex: number, value: string) {
  const current = categories.value
  const next = [...current]
  const cat = next[index]
  if (!cat) return

  const items = [...cat.items]
  items[causeIndex] = value

  next[index] = {
    ...cat,
    items,
  }

  commitCategories(next)
}

function addCause(index: number) {
  const current = categories.value
  const next = [...current]
  const cat = next[index]
  if (!cat) return

  next[index] = {
    ...cat,
    items: [...cat.items, ''],
  }

  commitCategories(next)
}

/**
 * Añadir una nueva rama en el lado izquierdo:
 * - Insertamos cerca del inicio de la lista para que se reparta visualmente.
 */
function addCategoryLeft() {
  const current = categories.value
  const next: IshikawaCategory[] = [...current]

  const newIndex = 0
  const newCat: IshikawaCategory = {
    key: `cat-left-${Date.now()}`,
    label: 'Nueva rama izquierda',
    items: [''],
  }

  next.splice(newIndex, 0, newCat)
  commitCategories(next)
}

/**
 * Añadir una nueva rama en el lado derecho:
 * - Añadimos al final de la lista para que quede en el lado derecho.
 */
function addCategoryRight() {
  const current = categories.value
  const next: IshikawaCategory[] = [...current]

  const newCat: IshikawaCategory = {
    key: `cat-right-${Date.now()}`,
    label: 'Nueva rama derecha',
    items: [''],
  }

  next.push(newCat)
  commitCategories(next)
}
</script>

<style scoped>
.diagram-ishikawa {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 10px 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  font-size: 12px;
  color: #111827;
}

/* Header */

.diagram-ishikawa__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.diagram-ishikawa__title {
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
}

.diagram-ishikawa__description {
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  padding: 4px 8px;
  font-size: 12px;
}

/* Cuerpo / esqueleto de pescado */

.diagram-ishikawa__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

/* Espina central */

.diagram-ishikawa__center {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.diagram-ishikawa__spine {
  position: relative;
  height: 2px;
  background: transparent;
  margin-bottom: 4px;
}

.diagram-ishikawa__spine-line {
  position: absolute;
  left: 0;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  height: 2px;
  background: #4b5563;
}

.diagram-ishikawa__spine-arrow {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid #4b5563;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}

/* Efecto principal */

.diagram-ishikawa__effect-box {
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  min-width: 160px;
  text-align: center;
  background: #f9fafb;
}

.diagram-ishikawa__effect-input {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  text-align: center;
  font-size: 12px;
  line-height: 1.3;
}

/* Lados / ramas */

.diagram-ishikawa__side {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Rama: “hueso” diagonal + contenido */

.diagram-ishikawa__branch {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Línea diagonal (hueso) */
.diagram-ishikawa__branch-bone {
  width: 36px;
  height: 2px;
  background: #6b7280;
  transform-origin: center;
}

.diagram-ishikawa__branch--left .diagram-ishikawa__branch-bone {
  transform: rotate(-30deg);
}

.diagram-ishikawa__branch--right .diagram-ishikawa__branch-bone {
  transform: rotate(30deg);
}

.diagram-ishikawa__branch-content {
  flex: 1;
}

/* Etiqueta de la rama */

.diagram-ishikawa__branch-label input {
  width: 100%;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  background: #f9fafb;
}

/* Causas */

.diagram-ishikawa__causes {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.diagram-ishikawa__causes input {
  width: 100%;
  border-radius: 4px;
  border: 1px dashed #e5e7eb;
  padding: 2px 6px;
  font-size: 11px;
}

/* Botón + causa */

.diagram-ishikawa__add-cause {
  margin-top: 2px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 11px;
  width: 18px;
  height: 18px;
  line-height: 1;
  cursor: pointer;
}

/* Botones de añadir ramas */

.diagram-ishikawa__add-branch {
  margin-top: 4px;
  border-radius: 999px;
  border: 1px dashed #d1d5db;
  background: #fdfbff;
  font-size: 11px;
  padding: 3px 8px;
  cursor: pointer;
  color: #4b3f72;
}

.diagram-ishikawa__add-branch:hover {
  background: #f3ecff;
  border-color: #c1b6ff;
}

/* Footer */

.diagram-ishikawa__footer {
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
}
</style>
