<!-- apps/frontend/src/editor/EditorChemPanel.vue -->
<template>
  <section class="chem-panel">
    <!-- Header -->
    <header class="chem-panel__header">
      <div class="chem-panel__title-block">
        <h2 class="chem-panel__title">
          Estructura química
          <span class="chem-panel__phase">(F2.7)</span>
        </h2>
        <p class="chem-panel__subtitle">
          Inserta una estructura química básica a partir de una cadena SMILES.
        </p>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="chem-panel__body">
      <p class="chem-panel__help">
        Escribe una cadena SMILES simple (por ejemplo
        <code>CCO</code> para etanol) y pulsa “Insertar estructura”.
      </p>

      <div class="chem-panel__field-group">
        <label>
          <span class="chem-panel__label">SMILES</span>
          <input
            v-model="smiles"
            class="chem-panel__input"
            placeholder="Ejemplo: CCO"
          />
        </label>

        <div class="chem-panel__actions">
          <button
            type="button"
            class="chem-panel__button chem-panel__button--primary"
            :disabled="!canInsertChem || !smiles.trim()"
            @click="handleInsert"
          >
            Insertar estructura
          </button>
        </div>

        <p class="chem-panel__status" v-if="!canInsertChem">
          El editor aún no está listo. Espera a que termine de inicializar.
        </p>
      </div>

      <section class="chem-panel__tips">
        <h3 class="chem-panel__tips-title">Pruebas sugeridas (F2.7)</h3>
        <ul class="chem-panel__tips-list">
          <li>Inserta una estructura con SMILES <code>CCO</code>.</li>
          <li>
            Verifica que aparece el bloque de química (2D/3D) en el documento.
          </li>
          <li>
            Edita la estructura desde el NodeView (herramienta de química) y
            confirma que el documento se actualiza.
          </li>
          <li>
            Guarda y recarga el documento para confirmar que la estructura se
            persiste correctamente.
          </li>
        </ul>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEditorChem } from './composables/useEditorChem'

const { canInsertChem, insertChemStructure } = useEditorChem()

const smiles = ref('CCO') // valor de ejemplo

function handleInsert() {
  const value = smiles.value.trim()
  if (!value) return
  insertChemStructure(value)
}
</script>

<style scoped>
.chem-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  padding: 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e0d6ff;
  box-shadow:
    0 0 0 1px #f4f0ff,
    0 8px 24px rgba(15, 23, 42, 0.08);
  font-size: 13px;
  color: #111827;
}

/* Header */
.chem-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.chem-panel__title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chem-panel__title {
  font-size: 14px;
  font-weight: 700;
  color: #312e81;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.chem-panel__phase {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}

.chem-panel__subtitle {
  font-size: 11px;
  color: #6b7280;
}

/* Body */
.chem-panel__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.chem-panel__help {
  font-size: 12px;
  color: #4b5563;
}

.chem-panel__help code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  background: #f3f4ff;
  padding: 1px 4px;
  border-radius: 3px;
}

/* Field group */
.chem-panel__field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 0;
  border-top: 1px solid #f3f0ff;
  border-bottom: 1px solid #f3f0ff;
}

.chem-panel__label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.chem-panel__input {
  width: 100%;
  border-radius: 6px;
  border: 1px solid #d3cfff;
  padding: 4px 6px;
  font-size: 13px;
}

.chem-panel__actions {
  display: flex;
  justify-content: flex-end;
}

/* Buttons */
.chem-panel__button {
  border-radius: 999px;
  border: 1px solid #d3cfff;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1.2;
  background: #f3ecff;
  color: #4338ca;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.05s ease;
}

.chem-panel__button--primary {
  background: #4f46e5;
  border-color: #4338ca;
  color: #f9fafb;
}

.chem-panel__button--primary:hover:enabled {
  background: #4338ca;
  border-color: #3730a3;
  box-shadow: 0 2px 6px rgba(55, 48, 163, 0.35);
}

.chem-panel__button--primary:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

.chem-panel__status {
  font-size: 11px;
  color: #9ca3af;
}

/* Tips */
.chem-panel__tips {
  margin-top: 4px;
}

.chem-panel__tips-title {
  font-size: 12px;
  font-weight: 600;
  color: #4b3f72;
  margin-bottom: 2px;
}

.chem-panel__tips-list {
  padding-left: 16px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #6b7280;
}

.chem-panel__tips-list code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  background: #f3f4ff;
  padding: 1px 4px;
  border-radius: 3px;
}
</style>
