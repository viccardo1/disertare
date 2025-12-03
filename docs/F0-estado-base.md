
# `docs/F0-estado-base.md`

```md
<!--
╔══════════════════════════════════════════════════════════════════╗
║  D  DISERTARE                                                    ║
║  Plataforma avanzada de edición técnica, científica y            ║
║  multidisciplinaria.                                             ║
║                                                                  ║
║  © 2025 Disertare Project — Licencia Privativa.                  ║
║  Todos los derechos reservados.                                  ║
╚══════════════════════════════════════════════════════════════════╝
-->

# F0 — Estado Base del Proyecto Disertare  
**Versión:** 2025-F0  
**Documento oficial del monorepo**

---

# 1. Propósito de F0

F0 define la base técnica, estructural y legal del proyecto Disertare.  
No implementa funcionalidades avanzadas, sino que prepara el terreno para las fases F1, F2.x y F3.

F0 garantiza que:

- El monorepo está correctamente configurado.
- El AppShell inicial existe y funciona.
- La identidad legal (26.0) está completamente aplicada.
- El entorno es limpio y reproducible.
- No existe deuda técnica inicial.

---

# 2. Estructura del monorepo (estado real en F0)

El árbol base de Disertare en F0 es:

```

Disertare/
├── apps/
│   └── frontend/
│       ├── index.html
│       ├── package.json
│       ├── public/
│       │   ├── favicon.ico
│       │   └── logo.svg
│       ├── src/
│       │   ├── App.vue
│       │   ├── main.ts
│       │   ├── editor/
│       │   ├── maintenance/
│       │   └── services/
│       └── vite.config.ts
├── docs/
│   ├── disertare-packages-dump.md
│   ├── disertare-md-dump.sh
│   └── F0-estado-base.md   ← este documento
├── packages/
│   ├── domain-maintenance/
│   ├── editor-core/
│   ├── editor-citations/
│   ├── editor-parts/
│   ├── editor-toc/
│   ├── editor-ext-*   (todas las extensiones)
│   └── ...
├── scripts/
│   └── apply-disertare-license.mjs
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── brand.json
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── README.md
└── versiones.csv

```

---

# 3. Alcance funcional de F0

### F0 incluye:

- Monorepo configurado con **pnpm**, work
```
