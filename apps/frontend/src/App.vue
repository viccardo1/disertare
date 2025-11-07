<template>
  <div id="app" class="app-shell">
    <header class="app-header">
      <!-- Logo/Brand a la izquierda -->
      <div class="brand-container">
        <img src="/logo.svg" alt="Logo Disertare" class="brand-logo" />
        <span class="brand-text">Disertare</span>
      </div>

      <!-- Navegación y acciones a la derecha -->
      <div class="header-right">
        <nav>
          <a href="#/dashboard">Tablero</a>
          <a href="#/editor">Editor</a>
          <a href="#/profile">Perfil</a>
          <a href="#/repo">Repo</a>
          <a href="#/accessibility" class="accessibility-link">Accesibilidad</a>
        </nav>

        <!-- Botón de login/logout/register -->
        <button class="auth-button" @click="toggleAuth">
          {{ isLoggedIn ? 'Salir' : 'Ingresar / Registrarse' }}
        </button>

        <!-- Conmutador de idioma (placeholder para F4.2) -->
        <button class="btn-lang" aria-label="Cambiar idioma" disabled>
          ES
        </button>
      </div>
    </header>

    <main class="app-main">
      <router-outlet />
      <p>Bienvenido a Disertare — F0 Bootstrap activo.</p>
    </main>

    <footer class="app-footer">
      <div class="footer-left">
        Disertare © {{ currentYear }} — Todos los derechos reservados.
      </div>
      <div class="footer-right">
        <a href="/terms">Términos</a>
        <a href="/about">Sobre nosotros</a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Estado simulado de autenticación (para F0)
const isLoggedIn = ref(false);

const currentYear = computed(() => new Date().getFullYear());

// Función de ejemplo para el botón de autenticación
const toggleAuth = () => {
  isLoggedIn.value = !isLoggedIn.value;
};
</script>

<style>
:root {
  --header-height: 48px;
  --footer-height: 32px;
  --toolbar-height: 40px;
  --purple-fade: rgba(147, 112, 219, 0.1);
  --bg-page: #ffffff;
  --text-color: #1a1a1a;
  --font-ui: 'Atkinson Hyperlegible', sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-ui);
  background-color: var(--bg-page);
  color: var(--text-color);
  overflow: hidden;
}

.app-shell {
  display: grid;
  grid-template-rows: var(--header-height) 1fr var(--footer-height);
  height: 100dvh;
  width: 100vw;
}

.app-header,
.app-footer {
  background-color: var(--purple-fade);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  font-size: 0.875rem;
  z-index: 1000;
}

.app-header {
  position: sticky;
  top: 0;
}

.app-footer {
  position: sticky;
  bottom: 0;
}

.brand-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-logo {
  width: 24px;
  height: 24px;
}

.brand-text {
  font-weight: 700;
}

.header-right {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.header-right nav {
  display: flex;
  gap: 1rem;
}

.header-right nav a {
  text-decoration: none;
  color: inherit;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.header-right nav a:hover,
.header-right nav a:focus {
  background-color: rgba(0, 0, 0, 0.05);
}

.accessibility-link {
  font-weight: bold;
}

.auth-button {
  background: none;
  border: 1px solid rgba(0,0,0,0.2);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font: inherit;
  cursor: pointer;
}

.btn-lang {
  background: none;
  border: 1px solid rgba(0,0,0,0.2);
  border-radius: 4px;
  padding: 0.125rem 0.5rem;
  font: inherit;
  cursor: not-allowed;
  opacity: 0.6;
}

.app-main {
  overflow: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.footer-right a {
  margin-left: 1rem;
  text-decoration: none;
  color: inherit;
}

.footer-right a:hover {
  text-decoration: underline;
}
</style>
