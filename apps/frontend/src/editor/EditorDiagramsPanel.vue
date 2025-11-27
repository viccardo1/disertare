<!-- apps/frontend/src/editor/EditorDiagramsPanel.vue -->
<template>
  <aside class="diagrams-panel">
    <header class="diagrams-panel__header">
      <h2 class="diagrams-panel__title">
        Diagramas avanzados
        <span class="diagrams-panel__badge">(F2.11)</span>
      </h2>
      <p class="diagrams-panel__subtitle">
        Inserta y edita diagramas de Ishikawa, Venn/Euler, matrices de riesgo,
        mapas de procesos y modelos de sistemas directamente en el documento.
      </p>
    </header>

    <!-- Tipo de diagrama -->
    <section class="diagrams-panel__section">
      <h3 class="diagrams-panel__section-title">Tipo de diagrama</h3>

      <div class="diagrams-panel__radio-group">
        <label class="diagrams-panel__radio">
          <input
            v-model="selectedKind"
            type="radio"
            value="ishikawa"
          />
          <span>Diagrama de Ishikawa</span>
        </label>

        <label class="diagrams-panel__radio">
          <input
            v-model="selectedKind"
            type="radio"
            value="venn"
          />
          <span>Diagrama de Venn/Euler</span>
        </label>

        <label class="diagrams-panel__radio">
          <input
            v-model="selectedKind"
            type="radio"
            value="riskMatrix"
          />
          <span>Matriz de riesgo</span>
        </label>

        <label class="diagrams-panel__radio">
          <input
            v-model="selectedKind"
            type="radio"
            value="processMap"
          />
          <span>Mapa de procesos</span>
        </label>

        <label class="diagrams-panel__radio">
          <input
            v-model="selectedKind"
            type="radio"
            value="systemsModel"
          />
          <span>Modelo / análisis de sistemas</span>
        </label>
      </div>
    </section>

    <!-- Plantilla -->
    <section class="diagrams-panel__section">
      <h3 class="diagrams-panel__section-title">Plantilla</h3>

      <select
        v-model="selectedTemplateId"
        class="diagrams-panel__select"
      >
        <option
          v-for="tpl in availableTemplates"
          :key="tpl.id"
          :value="tpl.id"
        >
          {{ tpl.label }}
        </option>
      </select>

      <p class="diagrams-panel__helper">
        La plantilla define la estructura base del diagrama
        (categorías 6M, tamaño de matriz, número de conjuntos, etc.).
      </p>
    </section>

    <!-- Detalles -->
    <section class="diagrams-panel__section">
      <h3 class="diagrams-panel__section-title">Detalles</h3>

      <label class="diagrams-panel__field">
        <span class="diagrams-panel__field-label">Título (opcional)</span>
        <input
          v-model="title"
          type="text"
          class="diagrams-panel__input"
          placeholder="Ej. Análisis de causas del retraso en el proyecto"
        />
      </label>

      <label class="diagrams-panel__field">
        <span class="diagrams-panel__field-label">
          Descripción / efecto principal (opcional)
        </span>
        <textarea
          v-model="description"
          rows="3"
          class="diagrams-panel__textarea"
          placeholder="Ej. Diagrama de Ishikawa para identificar causas raíz."
        />
      </label>

      <p class="diagrams-panel__hint">
        💡 Si ya tienes un diagrama en el documento, coloca el cursor dentro de
        él y pulsa <strong>“Cargar desde selección”</strong> para traer sus
        datos al panel. Después puedes modificar título/descripción y aplicar
        los cambios con <strong>“Actualizar diagrama seleccionado”</strong>.
      </p>
    </section>

    <!-- Acciones -->
    <footer class="diagrams-panel__footer">
      <button
        type="button"
        class="diagrams-panel__button diagrams-panel__button--ghost"
        @click="handleLoadFromSelection"
      >
        Cargar desde selección
      </button>

      <button
        type="button"
        class="diagrams-panel__button diagrams-panel__button--primary"
        :disabled="!canInsertDiagram"
        @click="handleInsert"
      >
        Insertar diagrama
      </button>

      <button
        type="button"
        class="diagrams-panel__button diagrams-panel__button--secondary"
        @click="handleUpdate"
      >
        Actualizar diagrama seleccionado
      </button>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useEditorDiagramsAdv } from './composables/useEditorDiagramsAdv'

const {
  selectedKind,
  selectedTemplateId,
  availableTemplates,
  title,
  description,
  canInsertDiagram,
  insertDiagramFromPanel,
  updateDiagramFromPanel,
  loadFromSelection,
  resetPanel,
} = useEditorDiagramsAdv()

function handleInsert() {
  insertDiagramFromPanel()
  // Después de insertar, dejamos el panel en estado limpio por defecto.
  resetPanel()
}

function handleUpdate() {
  updateDiagramFromPanel()
}

function handleLoadFromSelection() {
  loadFromSelection()
}

// Cuando se abre el panel por primera vez, intentamos leer el diagrama
// donde esté el cursor (si aplica).
onMounted(() => {
  loadFromSelection()
})
</script>

<style scoped>
.diagrams-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  font-size: 13px;
  color: #111827;
}

.diagrams-panel__header {
  margin-bottom: 4px;
}

.diagrams-panel__title {
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
}

.diagrams-panel__badge {
  font-size: 11px;
  font-weight: 600;
  color: #6d28d9;
  background: #f3e8ff;
  border-radius: 999px;
  padding: 2px 6px;
}

.diagrams-panel__subtitle {
  margin: 0;
  font-size: 12px;
  color: #4b5563;
}

.diagrams-panel__section {
  border-top: 1px solid #e5e7eb;
  padding-top: 8px;
  margin-top: 4px;
}

.diagrams-panel__section-title {
  font-size: 12px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #374151;
}

.diagrams-panel__radio-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.diagrams-panel__radio {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
}

.diagrams-panel__radio input {
  accent-color: #6366f1;
}

.diagrams-panel__select {
  width: 100%;
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  font-size: 12px;
}

.diagrams-panel__helper {
  margin: 4px 0 0;
  font-size: 11px;
  color: #6b7280;
}

.diagrams-panel__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}

.diagrams-panel__field-label {
  font-size: 11px;
  color: #4b5563;
}

.diagrams-panel__input,
.diagrams-panel__textarea {
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  padding: 4px 6px;
  resize: vertical;
}

.diagrams-panel__textarea {
  min-height: 54px;
}

.diagrams-panel__hint {
  font-size: 11px;
  color: #4b5563;
  margin: 2px 0 0;
}

.diagrams-panel__footer {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diagrams-panel__button {
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.diagrams-panel__button--primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.diagrams-panel__button--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.diagrams-panel__button--primary:not(:disabled):hover {
  background: #1d4ed8;
}

.diagrams-panel__button--secondary {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

.diagrams-panel__button--secondary:hover {
  background: #f3f4f6;
}

.diagrams-panel__button--ghost {
  background: #fdfbff;
  border-color: #e5e7eb;
  color: #4b3f72;
}

.diagrams-panel__button--ghost:hover {
  background: #f3ecff;
  border-color: #c1b6ff;
}
</style>
