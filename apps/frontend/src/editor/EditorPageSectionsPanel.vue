<!-- apps/frontend/src/editor/EditorPageSectionsPanel.vue -->
<template>
  <aside class="editor-page-sections-panel">
    <header class="panel-header">
      <h2 class="panel-title">Encabezados y pies de página</h2>
      <p class="panel-subtitle">
        Configura plantillas estilo Word. Usa variables como
        <code>{PAGE}</code>, <code>{PAGES}</code>, <code>{TITLE}</code>,
        <code>{DATE}</code>, <code>{AUTHOR}</code> y <code>{SECTION}</code>.
      </p>
    </header>

    <div class="panel-body">
      <!-- Encabezado -->
      <section class="panel-section">
        <h3 class="section-title">Encabezado</h3>

        <label class="field">
          <span class="field-label">Primera página</span>
          <textarea
            v-model="headerFirst"
            class="field-input"
            rows="2"
          />
        </label>

        <label class="field">
          <span class="field-label">Páginas impares / por defecto</span>
          <textarea
            v-model="headerDefault"
            class="field-input"
            rows="2"
          />
        </label>

        <label class="field">
          <span class="field-label">Páginas pares</span>
          <textarea
            v-model="headerEven"
            class="field-input"
            rows="2"
          />
        </label>
      </section>

      <!-- Pie de página -->
      <section class="panel-section">
        <h3 class="section-title">Pie de página</h3>

        <label class="field">
          <span class="field-label">Primera página</span>
          <textarea
            v-model="footerFirst"
            class="field-input"
            rows="2"
          />
        </label>

        <label class="field">
          <span class="field-label">Páginas impares / por defecto</span>
          <textarea
            v-model="footerDefault"
            class="field-input"
            rows="2"
          />
        </label>

        <label class="field">
          <span class="field-label">Páginas pares</span>
          <textarea
            v-model="footerEven"
            class="field-input"
            rows="2"
          />
        </label>
      </section>

      <!-- 🔥 Nuevo: Subpanel de Layout (F2.19) -->
      <section class="panel-section layout-section">
        <h3 class="section-title">Layout de columnas</h3>

        <p class="layout-hint">
          Aplica únicamente a la sección actual (vista paginada).
          <br>1 columna = flujo normal.
          2–4 columnas = maquetación estilo revista.
        </p>

        <div class="columns-selector">
          <button
            v-for="opt in [1, 2, 3, 4]"
            :key="opt"
            type="button"
            class="col-btn"
            :class="{ active: currentColumns === opt }"
            @click="applyColumns(opt)"
          >
            {{ opt }}
          </button>
        </div>

        <button
          class="clear-btn"
          type="button"
          @click="applyColumns(1)"
        >
          Volver a una columna
        </button>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePageSections } from './composables/usePageSections'

const {
  section,
  setHeaderTemplate,
  setFooterTemplate,
  setLayoutColumns,
} = usePageSections()

/* ----------------------------
 * Encabezados / pies (igual que antes)
 * ---------------------------- */
const headerFirst = computed({
  get: () => section.header.first ?? '',
  set: (value: string) => setHeaderTemplate('first', value),
})

const headerDefault = computed({
  get: () => section.header.default ?? '',
  set: (value: string) => setHeaderTemplate('default', value),
})

const headerEven = computed({
  get: () => section.header.even ?? '',
  set: (value: string) => setHeaderTemplate('even', value),
})

const footerFirst = computed({
  get: () => section.footer.first ?? '',
  set: (value: string) => setFooterTemplate('first', value),
})

const footerDefault = computed({
  get: () => section.footer.default ?? '',
  set: (value: string) => setFooterTemplate('default', value),
})

const footerEven = computed({
  get: () => section.footer.even ?? '',
  set: (value: string) => setFooterTemplate('even', value),
})

/* ----------------------------
 * 🔥 Nuevo: Layout de columnas
 * ---------------------------- */
const currentColumns = computed(() => {
  const cols = section.layout?.columns
  return cols == null || cols <= 1 ? 1 : cols
})

function applyColumns(n: number) {
  // Normalización: 1 => null (equivale a 1 columna)
  const normalized = n <= 1 ? null : n
  setLayoutColumns(normalized)
}
</script>

<style scoped>
.editor-page-sections-panel {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e0d6ff;
  background: #fbf9ff;
  font-size: 13px;
}

.panel-header {
  margin-bottom: 8px;
}

.panel-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #4b3f72;
}

.panel-subtitle {
  margin: 0;
  font-size: 12px;
  color: #6b6b83;
}

.panel-subtitle code {
  font-family: 'Fira Code', ui-monospace;
  font-size: 11px;
  background: #f2ecff;
  border-radius: 4px;
  padding: 1px 4px;
}

.panel-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.panel-section {
  padding-top: 4px;
}

.section-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: #5a4b8a;
}

.field {
  display: block;
  margin-bottom: 6px;
}

.field-label {
  display: block;
  margin-bottom: 2px;
  font-size: 11px;
  font-weight: 500;
  color: #55516b;
}

.field-input {
  width: 100%;
  resize: vertical;
  min-height: 32px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid #d8cffd;
  font-size: 12px;
  background: #ffffff;
  font-family: system-ui, sans-serif;
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: #6a5af9;
  box-shadow: 0 0 0 1px rgba(106, 90, 249, 0.15);
}

/* 🔥 Layout de columnas (F2.19) */
.layout-section {
  border-top: 1px solid #e5ddff;
  padding-top: 10px;
}

.columns-selector {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.col-btn {
  flex: 1;
  padding: 4px 0;
  font-size: 12px;
  border: 1px solid #d5cbff;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: 0.15s;
}

.col-btn.active {
  background: #6a5af9;
  color: white;
  border-color: #6a5af9;
}

.col-btn:hover {
  border-color: #8e83ff;
}

.clear-btn {
  width: 100%;
  padding: 4px 0;
  font-size: 12px;
  border: 1px solid #d7d1f8;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: 0.15s;
}

.clear-btn:hover {
  border-color: #8e83ff;
}

.layout-hint {
  font-size: 11px;
  margin: 0 0 6px;
  color: #5e5980;
}
</style>
