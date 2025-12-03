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

<!-- packages/editor-ext-chem/src/ChemNodeView.vue -->
<template>
  <NodeViewWrapper
    class="dsr-chem-node"
    :class="{ 'dsr-chem-node--selected': selected }"
  >
    <div class="dsr-chem-card">
      <!-- Header: título + modo de vista -->
      <header class="dsr-chem-card__header">
        <input
          v-model="localTitle"
          class="dsr-chem-card__title-input"
          type="text"
          :placeholder="defaultTitlePlaceholder"
        />

        <div class="dsr-chem-card__view-toggle">
          <button
            type="button"
            class="dsr-chem-card__view-button"
            :class="{ 'dsr-chem-card__view-button--active': viewMode === '2d' }"
            @click="setViewMode('2d')"
          >
            2D
          </button>
          <button
            type="button"
            class="dsr-chem-card__view-button"
            :class="{ 'dsr-chem-card__view-button--active': viewMode === '3d' }"
            @click="setViewMode('3d')"
          >
            3D
          </button>
        </div>
      </header>

      <!-- Cuerpo: placeholders 2D / 3D -->
      <section class="dsr-chem-card__body">
        <!-- Área de visualización 2D -->
        <div
          v-if="viewMode === '2d'"
          ref="canvas2dRef"
          class="dsr-chem-card__canvas dsr-chem-card__canvas--2d"
        >
          <div class="dsr-chem-card__canvas-placeholder">
            <span class="dsr-chem-card__canvas-label">
              Vista 2D (SMILES: {{ displaySmiles }})
            </span>
            <small class="dsr-chem-card__canvas-helper">
              Aquí se integrará el render 2D con OpenChemLib en fases
              posteriores.
            </small>
          </div>
        </div>

        <!-- Área de visualización 3D -->
        <div
          v-else
          ref="canvas3dRef"
          class="dsr-chem-card__canvas dsr-chem-card__canvas--3d"
        >
          <div class="dsr-chem-card__canvas-placeholder">
            <span class="dsr-chem-card__canvas-label">
              Vista 3D (SMILES: {{ displaySmiles }})
            </span>
            <small class="dsr-chem-card__canvas-helper">
              Aquí se integrará el render 3D con 3Dmol u otro motor compatible.
            </small>
          </div>
        </div>
      </section>

      <!-- Footer: edición de SMILES -->
      <footer class="dsr-chem-card__footer">
        <label class="dsr-chem-card__field">
          <span class="dsr-chem-card__field-label">SMILES</span>
          <input
            v-model="localSmiles"
            class="dsr-chem-card__field-input"
            type="text"
            placeholder="Ejemplo: C1=CC=CC=C1 (benceno)"
          />
        </label>

        <div class="dsr-chem-card__actions">
          <button
            type="button"
            class="dsr-chem-card__action-button"
            @click="applyChanges"
          >
            Actualizar
          </button>
        </div>
      </footer>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

type ViewMode = '2d' | '3d'

/**
 * Atributos esperados en ChemExtension:
 *  - id: string
 *  - format: 'smiles' | ...
 *  - value: string (SMILES)
 *  - title?: string
 *  - viewMode?: '2d' | '3d'
 *  - (compat opcional) smiles?: string
 */
const initialValue =
  (props.node.attrs.value as string | undefined) ??
  (props.node.attrs.smiles as string | undefined) ??
  ''

const localSmiles = ref<string>(initialValue)
const localTitle = ref<string>(
  (props.node.attrs.title as string | undefined) || 'Estructura química',
)

const viewMode = ref<ViewMode>(
  props.node.attrs.viewMode === '3d' ? '3d' : '2d',
)

const canvas2dRef = ref<HTMLElement | null>(null)
const canvas3dRef = ref<HTMLElement | null>(null)

const defaultTitlePlaceholder = 'Estructura química'

const displaySmiles = computed(() =>
  localSmiles.value.trim() ? localSmiles.value.trim() : 'sin definir',
)

/**
 * Cambia el modo de vista (2D/3D) y actualiza attrs.
 */
function setViewMode(mode: ViewMode) {
  viewMode.value = mode
  if (props.updateAttributes) {
    props.updateAttributes({
      viewMode: mode,
    })
  }
}

/**
 * Aplica cambios locales a los atributos del nodo.
 * Guarda siempre en formato SMILES.
 */
function applyChanges() {
  const trimmed = localSmiles.value.trim()

  if (props.updateAttributes) {
    props.updateAttributes({
      format: 'smiles',
      value: trimmed,
      // compat opcional con attrs.smiles, si existiera
      smiles: trimmed || null,
      title: localTitle.value || null,
    })
  }
}

/**
 * Mantener sincronización si los atributos del nodo cambian desde fuera
 * (por ejemplo, comandos globales, deshacer/rehacer, carga de documento).
 */
watch(
  () => props.node.attrs,
  (newAttrs) => {
    const attrValue = (newAttrs.value as string | undefined) ??
      (newAttrs.smiles as string | undefined)

    if (typeof attrValue === 'string' && attrValue !== localSmiles.value) {
      localSmiles.value = attrValue
    }

    if (
      typeof newAttrs.title === 'string' &&
      newAttrs.title !== localTitle.value
    ) {
      localTitle.value = newAttrs.title
    }

    if (newAttrs.viewMode === '2d' || newAttrs.viewMode === '3d') {
      if (newAttrs.viewMode !== viewMode.value) {
        viewMode.value = newAttrs.viewMode as ViewMode
      }
    }
  },
  { deep: true },
)

onMounted(() => {
  // F2.7: solo placeholders. En fases posteriores se integrarán:
  //  - OpenChemLib (2D)
  //  - 3Dmol (3D)
  // usando canvas2dRef / canvas3dRef.
})
</script>

<style scoped>
.dsr-chem-node {
  margin: 0.5rem 0;
}

.dsr-chem-node--selected .dsr-chem-card {
  box-shadow:
    0 0 0 1px #a855f7,
    0 0 0 3px rgba(168, 85, 247, 0.25);
}

/* Card */
.dsr-chem-card {
  border-radius: 10px;
  border: 1px solid #e0d6ff;
  background: #ffffff;
  box-shadow:
    0 0 0 1px #f4f0ff,
    0 8px 20px rgba(15, 23, 42, 0.08);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

/* Header */
.dsr-chem-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dsr-chem-card__title-input {
  flex: 1;
  border-radius: 6px;
  border: 1px solid #d3cfff;
  padding: 4px 6px;
  font-size: 13px;
  font-weight: 600;
  color: #312e81;
}

/* View toggle */
.dsr-chem-card__view-toggle {
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid #d3cfff;
  overflow: hidden;
  background: #f5f3ff;
}

.dsr-chem-card__view-button {
  border: none;
  background: transparent;
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
  color: #4b3f72;
}

.dsr-chem-card__view-button--active {
  background: #4f46e5;
  color: #f9fafb;
}

/* Body / canvas */
.dsr-chem-card__body {
  border-radius: 8px;
  background: #f9fafb;
  padding: 6px;
}

.dsr-chem-card__canvas {
  min-height: 140px;
  border-radius: 8px;
  border: 1px dashed #c4b5fd;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f3ff;
}

.dsr-chem-card__canvas--3d {
  background: #eef2ff;
}

.dsr-chem-card__canvas-placeholder {
  text-align: center;
  max-width: 260px;
}

.dsr-chem-card__canvas-label {
  display: block;
  font-weight: 600;
  color: #3730a3;
  margin-bottom: 2px;
}

.dsr-chem-card__canvas-helper {
  font-size: 11px;
  color: #6b7280;
}

/* Footer */
.dsr-chem-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.dsr-chem-card__field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dsr-chem-card__field-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.dsr-chem-card__field-input {
  border-radius: 6px;
  border: 1px solid #d3cfff;
  padding: 4px 6px;
  font-size: 13px;
}

.dsr-chem-card__actions {
  display: flex;
  justify-content: flex-end;
}

.dsr-chem-card__action-button {
  border-radius: 999px;
  border: 1px solid #d3cfff;
  background: #f3ecff;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.dsr-chem-card__action-button:hover {
  background: #e6d9ff;
  border-color: #b399ff;
  box-shadow: 0 0 0 1px #d3cfff;
}
</style>
