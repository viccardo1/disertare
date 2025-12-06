# ICX — Revisión de Coherencia
# Fase F0 · Infraestructura, AppShell y Runtime Inicial

**Documento:** Revisión de Coherencia F0  
**Proyecto:** Disertare  
**Rol:** ICX Supervisor  
**Fecha:** 2025  
**Responsable:** Desarrollador Principal / ICX Supervisor  

---

# 1. Finalidad de la fase según ICX

De acuerdo con **ICX — Integración completa F0–F52.md**, la fase F0 establece:

- Base del sistema (infraestructura del editor).
- AppShell inicial.
- Núcleo de EditorCore operativo.
- Exposición de interfaces ICX mínimas:
  - `Editor.mount()`
  - `Editor.unmount()`
  - `ModuleLoader.load(id)`
  - `Runtime.Events`
- Registro del módulo `core-runtime` vía ICX.Register.
- Uso obligatorio de la **Firma Oficial Disertare**.
- Cumplimiento del **Sistema de Branding y Licenciamiento**.
- Estructura inicial para i18n.
- Carácter estrictamente fundacional: sin capacidades de fases posteriores.

---

# 2. Conjunto entregado en esta fase

La fase F0 entrega los siguientes componentes:

### 2.1 Código fuente consolidado
- `/apps/frontend/src/main.ts`  
  - Implementa Editor, Runtime y ModuleLoader según ICX.
  - Registra el manifest `core-runtime`.
  - Monta AppShell + i18n.

- `/apps/frontend/src/App.vue`  
  - AppShell contextualizado para F0.
  - Navegación mínima Editor / Mantenimiento.
  - Todos los textos provienen de i18n.

- `/apps/frontend/src/i18n/`  
  - `index.ts`, `locales/es.json`, `locales/en.json`.

### 2.2. Branding, licencia y firma oficial
- Firma Oficial incluida en archivos críticos (`main.ts`, `App.vue`).
- `package.json` (raíz y frontend) configurados con:
  - `"license": "UNLICENSED"`
  - `"author": "Disertare Project"`
  - `disertareBrand{...}`

### 2.3. Runtime F0 implementado
- Editor API:
  - `Editor.mount(root?)`
  - `Editor.unmount(instance)`
- Módulo de eventos:
  - `Runtime.Events.on/off/emit`
- Loader mínimo:
  - `ModuleLoader.load(id)` (stub conforme a ICX).
- Manifest ICX:
  ```json
  {
    "extensionId": "core-runtime",
    "version": "1.0",
    "createdInPhase": "F0",
    "provides": ["EditorCore", "ModuleLoader"],
    "consumes": [],
    "uemIntegration": false,
    "legalFingerprint": "auto"
  }
