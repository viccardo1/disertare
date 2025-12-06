<!-- /home/vicente/Disertare/apps/frontend/src/App.vue -->
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

<template>
  <div id="app-shell">
    <header class="global-header">
      <div class="header-left">
        <img src="/logo.svg" :alt="t('app.brand.name')" class="logo" />
        <div class="brand-block">
          <span class="brand-text">{{ t('app.brand.name') }}</span>
          <span class="brand-pill">
            {{ t('app.brand.infrastructureBadge') }}
          </span>
        </div>
      </div>

      <nav class="header-nav">
        <button
          type="button"
          class="nav-item"
          :class="{ 'nav-item--active': currentView === 'editor' }"
          @click="switchView('editor')"
        >
          {{ t('app.nav.editor') }}
        </button>

        <button
          type="button"
          class="nav-item"
          :class="{ 'nav-item--active': currentView === 'maintenance' }"
          @click="switchView('maintenance')"
        >
          {{ t('app.nav.maintenance') }}
        </button>
      </nav>
    </header>

    <main class="app-main">
      <section
        v-if="currentView === 'editor'"
        class="main-panel main-panel--editor"
      >
        <Editor />
      </section>

      <section
        v-else
        class="main-panel main-panel--maintenance"
      >
        <MaintenancePanel />
      </section>
    </main>

    <footer class="global-footer">
      <div class="footer-left">
        <span class="footer-title">{{ t('app.footer.title') }}</span>
        <span class="footer-copy">
          {{ t('app.footer.legal') }}
        </span>
      </div>
      <div class="footer-right">
        <span class="footer-pill">
          {{ t('app.footer.icx') }}
        </span>
        <span class="footer-pill">
          {{ t('app.footer.shell') }}
        </span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Editor from './editor/Editor.vue'
import MaintenancePanel from './maintenance/MaintenancePanel.vue'

type ViewId = 'editor' | 'maintenance'

const currentView = ref<ViewId>('editor')

const { t } = useI18n()

function switchView(view: ViewId) {
  currentView.value = view
}
</script>

<style scoped>
#app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
  color: #111827;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
}

/* HEADER */

.global-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 32px;
  height: 32px;
}

.brand-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-text {
  font-weight: 600;
  font-size: 18px;
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 11px;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item {
  border: none;
  background: transparent;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 14px;
  cursor: pointer;
  color: #4b5563;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.nav-item:hover {
  background: #e5e7eb;
  color: #111827;
}

.nav-item--active {
  background: #111827;
  color: #f9fafb;
}

/* MAIN */

.app-main {
  flex: 1;
  display: flex;
  padding: 16px 24px 24px;
}

.main-panel {
  flex: 1;
  border-radius: 16px;
  background: #ffffff;
  box-shadow:
    0 10px 15px -3px rgba(15, 23, 42, 0.08),
    0 4px 6px -2px rgba(15, 23, 42, 0.05);
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main-panel--editor {
  /* espacio reservado para el editor científico en fases posteriores */
}

.main-panel--maintenance {
  /* panel de mantenimiento / diagnóstico (F0–F1) */
}

/* FOOTER */

.global-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 12px;
  color: #4b5563;
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.footer-title {
  font-weight: 600;
  font-size: 13px;
}

.footer-copy {
  font-size: 12px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-pill {
  padding: 2px 8px;
  border-radius: 999px;
  background: #e5e7eb;
  font-size: 11px;
}
</style>
