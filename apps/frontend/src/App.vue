<!-- /home/vicente/Disertare/apps/frontend/src/App.vue -->
<template>
  <div id="app-shell">
    <header class="global-header">
      <div class="header-left">
        <img src="/logo.svg" alt="Disertare" class="logo" />
        <span class="brand-text">Disertare</span>
      </div>
      <nav class="header-nav">
        <span class="nav-item">Tablero</span>
        <span class="nav-item">Editor</span>
        <span class="nav-item">Perfil</span>
        <span class="nav-item">Repo</span>
        <span class="nav-item">Accesibilidad</span>
      </nav>
      <div class="header-right">
        <button class="auth-btn">Ingresar</button>
      </div>
    </header>

    <main class="main-content">
      <Editor />
    </main>

    <footer class="global-footer">
      <div class="footer-left">© 2025 Disertare — Todos los derechos reservados.</div>
      <div class="footer-right">
        <a href="#">Términos</a>
        <a href="#">Sobre nosotros</a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import Editor from './editor/Editor.vue'
</script>

<style>
#app-shell {
  display: grid;
  grid-template-rows: 60px 1fr 40px;
  height: 100vh;
  font-family: 'Atkinson Hyperlegible', sans-serif;
  margin: 0;
  background: white;
}

.global-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: #e0d6ff33;
  border-bottom: 1px solid #ccc;
  box-sizing: border-box;
}

/* ✅ Composición refinada: logo + texto como unidad de marca */
.header-left {
  display: flex;
  align-items: center;
  gap: 6px; /* espacio ajustado */
}

.logo {
  height: 24px; /* ligeramente más pequeño para equilibrio visual */
}

.brand-text {
  color: #2d2d2d;
  font-weight: 400; /* ✅ Regular 400, según §23 */
  font-size: 17px;
  font-family: 'Atkinson Hyperlegible', sans-serif;
  line-height: 1;
  letter-spacing: -0.02em; /* ligero ajuste tipográfico */
}

.header-nav {
  display: flex;
  gap: 20px;
}

.nav-item {
  color: #333;
  font-weight: 400;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #222;
}

.auth-btn {
  background: #e0d6ff33;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 400;
  font-size: 14px;
}

.main-content {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.global-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: #e0d6ff33;
  font-size: 14px;
  border-top: 1px solid #ccc;
  box-sizing: border-box;
}

.footer-right a {
  margin-left: 16px;
  text-decoration: none;
  color: #333;
}
</style>
