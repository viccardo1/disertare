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
<!-- apps/frontend/src/App.vue -->
<template>
  <div id="app-shell">
    <header class="global-header">
      <div class="header-left">
        <img src="/logo.svg" alt="Disertare" class="logo" />
        <span class="brand-text">Disertare</span>
      </div>

      <nav class="header-nav">
        <span class="nav-item">Tablero</span>

        <span
          class="nav-item"
          :class="{ 'nav-item--active': currentView === 'editor' }"
          @click="currentView = 'editor'"
        >
          Editor
        </span>

        <span class="nav-item">Perfil</span>
        <span class="nav-item">Repo</span>
        <span class="nav-item">Accesibilidad</span>

        <span
          class="nav-item"
          :class="{ 'nav-item--active': currentView === 'maintenance' }"
          @click="currentView = 'maintenance'"
        >
          Mantenimiento
        </span>
      </nav>

      <div class="header-right">
        <span class="header-pill">
          Núcleo de edición F2.x
        </span>
        <span class="header-pill header-pill--secondary">
          Herramienta activa:
          <strong>{{ herramientaActiva || 'ninguna' }}</strong>
        </span>
      </div>
    </header>

    <main class="app-main">
      <Editor v-if="currentView === 'editor'" />
      <MaintenancePanel v-else-if="currentView === 'maintenance'" />
    </main>

    <footer class="global-footer">
      <div class="footer-left">
        <span>Disertare · Plataforma académica</span>
      </div>
      <div class="footer-right">
        <a href="#" aria-label="Atajos de teclado">
          Atajos
        </a>
        <a href="#" aria-label="Documentación de ayuda">
          Ayuda
        </a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import Editor from './editor/Editor.vue'
import MaintenancePanel from './maintenance/MaintenancePanel.vue'

/**
 * Contexto de mantenimiento / diagnóstico:
 * permite a cualquier componente (Editor, sidebar, toolbars, Bio, etc.)
 * marcar qué herramienta está activa.
 */
const MAINTENANCE_CONTEXT_KEY = Symbol('maintenance-context')

const herramientaActiva = ref<string | null>(null)

interface MantenimientoContext {
  herramientaActiva: typeof herramientaActiva
  setHerramienta: (tool: string | null) => void
}

const mantenimientoContext: MantenimientoContext = {
  herramientaActiva,
  setHerramienta: (tool: string | null) => {
    herramientaActiva.value = tool
  },
}

provide(MAINTENANCE_CONTEXT_KEY, mantenimientoContext)

// Vista actual: 'editor' o 'maintenance'
const currentView = ref<'editor' | 'maintenance'>('editor')
</script>

<style>
#app-shell {
  display: grid;
  grid-template-rows: 60px 1fr 40px;
  min-height: 100vh;
  font-family: 'Atkinson Hyperlegible', system-ui, -apple-system,
    BlinkMacSystemFont, 'Segoe UI', sans-serif;
  margin: 0;
  background: #ffffff;
  color: #111827;
}

.global-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #f5f3ff;
  border-bottom: 1px solid #e5e7eb;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  width: 28px;
  height: 28px;
}

.brand-text {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.03em;
  color: #3730a3;
}

.header-nav {
  display: flex;
  gap: 12px;
  align-items: center;
}

.nav-item {
  color: #4b5563;
  font-weight: 400;
  padding: 4px 8px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.nav-item:hover {
  background: rgba(55, 48, 163, 0.08);
  color: #312e81;
}

.nav-item--active {
  background: #3730a3;
  color: #f9fafb;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-pill {
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.header-pill--secondary {
  background: #f3f4f6;
  color: #4b5563;
}

.app-main {
  position: relative;
  overflow: hidden;
  background: #ffffff;
}

.global-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: #f5f3ff;
  font-size: 13px;
  border-top: 1px solid #e5e7eb;
  box-sizing: border-box;
  color: #4b5563;
}

.footer-right a {
  margin-left: 16px;
  text-decoration: none;
  color: #4b5563;
  font-size: 13px;
}

.footer-right a:hover {
  text-decoration: underline;
}
</style>
