<!-- apps/frontend/src/editor/EditorPagedPreview.vue -->
<template>
  <div class="editor-pane editor-pane--paged">
    <div class="page-preview-container">
      <div
        v-for="page in pages"
        :key="page.index"
        class="page-preview"
      >
        <div
          class="page-preview-inner"
          v-html="page.html"
        />
        <div class="page-preview-footer">
          Página {{ page.index + 1 }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Page } from './composables/usePagedPreview'

const props = defineProps<{
  pages: Page[]
}>()
</script>

<style scoped>
/* Paneles del editor (ajuste de ancho y centrado) */
.editor-pane {
  max-width: var(--disertare-page-width, 794px);
  margin: 0 auto;
}

/* Vista paginada F2.2/F2.3.R */
.editor-pane--paged {
  padding: 16px 0 32px;
}

/* Vista de páginas */
.page-preview-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  padding-bottom: 32px;
}

.page-preview {
  width: var(--disertare-page-width, 794px);
  min-height: var(--disertare-page-height, 1123px);
  background: #ffffff;
  box-shadow:
    0 0 0 1px #e0d6ff33,
    0 4px 16px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.page-preview-inner {
  flex: 1;
  padding: var(--disertare-page-padding, 32px 40px);
  overflow: hidden;
}

.page-preview-footer {
  padding: 4px 12px 8px;
  font-size: 11px;
  text-align: right;
  color: #6a5af9;
}
</style>
