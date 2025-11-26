<!-- apps/frontend/src/maintenance/MaintenancePanel.vue -->
<template>
  <div class="maintenance-panel">
    <section class="maintenance-section">
      <header class="section-header">
        <h2>Centro de errores (frontend)</h2>
        <p>
          Lista de los errores más recientes capturados por el núcleo de edición
          (Vue, runtime y promesas sin manejar).
        </p>
      </header>

      <div v-if="errorsLoading" class="section-loading">
        Cargando errores…
      </div>
      <div v-else-if="errorsError" class="section-error">
        {{ errorsError }}
      </div>
      <div v-else-if="!errors.length" class="section-empty">
        No hay errores registrados en esta sesión.
      </div>
      <ul v-else class="error-list">
        <li
          v-for="err in errors"
          :key="err.id"
          class="error-card"
        >
          <div class="error-header">
            <span class="error-module">{{ err.modulo }}</span>
            <span class="error-date">
              {{ formatDate(err.createdAt) }}
            </span>
          </div>
          <div class="error-message">
            {{ err.mensaje }}
          </div>
          <div class="error-meta">
            <span v-if="err.componente">Componente: {{ err.componente }}</span>
            <span>Versión frontend: {{ err.versionFrontend }}</span>
            <span v-if="err.contexto?.ruta">Ruta: {{ err.contexto.ruta }}</span>
            <span v-if="err.contexto?.herramientaActiva">
              Herramienta: {{ err.contexto.herramientaActiva }}
            </span>
          </div>
          <pre
            v-if="err.stackSimplificado"
            class="error-stack"
          >{{ err.stackSimplificado }}</pre>
        </li>
      </ul>
    </section>

    <section class="maintenance-section">
      <header class="section-header">
        <h2>Feature flags</h2>
        <p>
          Estado actual de las banderas de características usadas para activar
          funciones de forma gradual.
        </p>
      </header>

      <div v-if="flagsLoading" class="section-loading">
        Cargando feature flags…
      </div>
      <div v-else-if="flagsError" class="section-error">
        {{ flagsError }}
      </div>
      <div v-else-if="!featureFlags.length" class="section-empty">
        No hay feature flags configuradas en esta instancia.
      </div>
      <table v-else class="flags-table">
        <thead>
          <tr>
            <th>Clave</th>
            <th>Estado</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="flag in featureFlags"
            :key="flag.key"
          >
            <td><code>{{ flag.key }}</code></td>
            <td>
              <span class="flag-pill" :data-state="flag.estado">
                {{ flag.estado }}
              </span>
            </td>
            <td>{{ flag.descripcion || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="maintenance-section">
      <header class="section-header">
        <h2>Changelog interno</h2>
        <p>
          Registro interno de cambios relevantes:
          versiones, configuraciones, formatos académicos, etc.
        </p>
      </header>

      <div v-if="changelogLoading" class="section-loading">
        Cargando changelog…
      </div>
      <div v-else-if="changelogError" class="section-error">
        {{ changelogError }}
      </div>
      <div v-else-if="!changelog.length" class="section-empty">
        No hay entradas de changelog registradas.
      </div>
      <ul v-else class="changelog-list">
        <li
          v-for="entry in changelog"
          :key="entry.id"
          class="changelog-item"
        >
          <div class="changelog-header">
            <span class="changelog-type">{{ entry.tipo }}</span>
            <span class="changelog-ref">{{ entry.referenciaId }}</span>
            <span class="changelog-date">
              {{ formatDate(entry.creadoEn) }}
            </span>
          </div>
          <div class="changelog-title">{{ entry.titulo }}</div>
          <div class="changelog-desc">{{ entry.descripcion }}</div>
          <div class="changelog-meta">Por {{ entry.creadoPor }}</div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  fetchRecentErrors,
  fetchFeatureFlags,
  fetchChangelog,
  type FrontendErrorEvent,
  type FeatureFlag,
  type ChangelogEntry,
} from '../services/maintenanceApi'

const errors = ref<FrontendErrorEvent[]>([])
const errorsLoading = ref(false)
const errorsError = ref<string | null>(null)

const featureFlags = ref<FeatureFlag[]>([])
const flagsLoading = ref(false)
const flagsError = ref<string | null>(null)

const changelog = ref<ChangelogEntry[]>([])
const changelogLoading = ref(false)
const changelogError = ref<string | null>(null)

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

onMounted(async () => {
  // errores
  errorsLoading.value = true
  try {
    errors.value = await fetchRecentErrors(20)
  } catch (err: any) {
    errorsError.value = err?.message ?? String(err)
  } finally {
    errorsLoading.value = false
  }

  // flags
  flagsLoading.value = true
  try {
    featureFlags.value = await fetchFeatureFlags()
  } catch (err: any) {
    flagsError.value = err?.message ?? String(err)
  } finally {
    flagsLoading.value = false
  }

  // changelog
  changelogLoading.value = true
  try {
    changelog.value = await fetchChangelog(20)
  } catch (err: any) {
    changelogError.value = err?.message ?? String(err)
  } finally {
    changelogLoading.value = false
  }
})
</script>

<style scoped>
.maintenance-panel {
  height: 100%;
  overflow-y: auto;
  padding: 12px 16px 16px;
  background: #faf5ff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.maintenance-section {
  background: #ffffff;
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.25);
}

.section-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.section-header p {
  margin: 2px 0 6px;
  font-size: 12px;
  color: #6b7280;
}

.section-loading,
.section-error,
.section-empty {
  font-size: 12px;
  color: #4b5563;
}

.section-error {
  color: #b91c1c;
}

.error-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-card {
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 6px;
  background: #f9fafb;
  font-size: 12px;
}

.error-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.error-module {
  font-weight: 600;
  color: #4c1d95;
}

.error-date {
  font-size: 11px;
  color: #6b7280;
}

.error-message {
  margin-bottom: 2px;
  color: #111827;
}

.error-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: #4b5563;
  margin-bottom: 2px;
}

.error-stack {
  margin: 0;
  padding: 4px;
  border-radius: 4px;
  background: #111827;
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  white-space: pre-wrap;
}

.flags-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.flags-table th,
.flags-table td {
  border: 1px solid #e5e7eb;
  padding: 4px 6px;
}

.flags-table th {
  background: #f3f4ff;
  text-align: left;
  font-weight: 600;
}

.flag-pill {
  display: inline-flex;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 11px;
  text-transform: uppercase;
}

.flag-pill[data-state='on'] {
  background: #ecfdf5;
  color: #166534;
}

.flag-pill[data-state='off'] {
  background: #fef2f2;
  color: #b91c1c;
}

.flag-pill[data-state='gradual'] {
  background: #eff6ff;
  color: #1d4ed8;
}

.changelog-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.changelog-item {
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 6px;
  background: #f9fafb;
}

.changelog-header {
  display: flex;
  gap: 6px;
  align-items: baseline;
  margin-bottom: 2px;
}

.changelog-type {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
  color: #4c1d95;
}

.changelog-ref {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  color: #374151;
}

.changelog-date {
  font-size: 11px;
  color: #6b7280;
  margin-left: auto;
}

.changelog-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.changelog-desc {
  color: #374151;
  margin-bottom: 2px;
}

.changelog-meta {
  font-size: 11px;
  color: #6b7280;
}
</style>
