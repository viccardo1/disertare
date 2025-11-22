<!-- apps/frontend/src/editor/EditorPagedPreview.vue -->
<template>
  <div class="editor-pane editor-pane--paged">
    <div class="page-preview-container">
      <article
        v-for="page in pagesWithLayout"
        :key="page.index"
        class="page-preview"
      >
        <header
          v-if="page.header"
          class="page-preview-header"
        >
          <div v-html="page.header" />
        </header>

        <div
          class="page-preview-inner"
          v-html="page.html"
        />

        <footer class="page-preview-footer">
          <div
            v-if="page.footer"
            class="page-preview-footer-content"
            v-html="page.footer"
          />
          <div class="page-preview-footer-page">
            Página {{ page.index + 1 }}
          </div>
        </footer>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Page } from './composables/usePagedPreview'
import {
  usePageSections,
  resolveHeaderFooterForSection,
} from './composables/usePageSections'

const props = defineProps<{
  pages: Page[]
}>()

const { section } = usePageSections()

type PageWithLayout = Page & {
  header: string
  footer: string
}

const pagesWithLayout = computed<PageWithLayout[]>(() => {
  const totalPages = props.pages?.length ?? 0
  if (!totalPages) return []

  return props.pages.map((page, index) => {
    const pageNumber = index + 1

    const { header, footer } = resolveHeaderFooterForSection(section, {
      page: pageNumber,
      pages: totalPages,
      isFirstPageOfSection: pageNumber === 1,
      isEvenPage: pageNumber % 2 === 0,
      meta: {
        title: '',
        author: '',
        date: '',
        sectionName: section.name,
      },
    })

    return {
      ...page,
      header,
      footer,
    }
  })
})
</script>

<style scoped>
/* Paneles del editor (ajuste de ancho y centrado) */
.editor-pane {
  max-width: var(--disertare-page-width, 794px);
  margin: 0 auto;
}

.editor-pane--paged {
  padding: 16px 0 24px;
}

/* Contenedor de páginas */
.page-preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* “Hoja” individual */
.page-preview {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: var(--disertare-page-height, 1123px);
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e0d6ff;
  box-shadow:
    0 14px 30px rgba(15, 23, 42, 0.12),
    0 4px 8px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

/* Encabezado de página */
.page-preview-header {
  min-height: 24px;
  padding: 6px 12px 2px;
  font-size: 11px;
  color: #4b3f72;
  border-bottom: 1px solid #eee9ff;
  display: flex;
  align-items: flex-end;
}

/* Cuerpo de la página */
.page-preview-inner {
  flex: 1;
  padding: var(--disertare-page-padding, 32px 40px);
  overflow: hidden;
}

/* Pie de página: zona de plantilla + número de página */
.page-preview-footer {
  padding: 4px 12px 6px;
  font-size: 11px;
  color: #6a5af9;
  border-top: 1px solid #eee9ff;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.page-preview-footer-content {
  flex: 1;
  text-align: left;
  color: #4b3f72;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-preview-footer-page {
  flex-shrink: 0;
}
</style>
