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

        <!-- Cuerpo con layout dinámico + overlays de contenedores -->
        <div
          class="page-preview-inner"
          :class="columnClass(page.layoutColumns)"
        >
          <div v-html="page.html" />

          <!-- Overlays F2.19.R3 -->
          <div
            v-if="page.validContainers.length"
            class="page-preview-overlays"
          >
            <div
              v-for="(region, idx) in page.validContainers"
              :key="region.id ?? idx"
              class="page-preview-overlay"
              :style="rectStyle(region)"
            />
          </div>
        </div>

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
  resolveLayoutForSection,
} from './composables/usePageSections'
import type { TextContainerRegion } from './composables/usePageSections'

const props = defineProps<{
  pages: Page[]
}>()

const { section } = usePageSections()

type PageWithLayout = Page & {
  header: string
  footer: string
  /** Contenedores rectangulares ya filtrados y normalizados */
  validContainers: TextContainerRegion[]
}

/* Columnas F2.19 */
function columnClass(columns: number | undefined): string {
  if (!columns || columns <= 1) return 'cols-1'
  return `cols-${columns}`
}

/* Helpers zonas F2.19.R3 */

function isValidRectRegion(region: unknown): region is TextContainerRegion {
  if (!region || typeof region !== 'object') return false
  const r = region as TextContainerRegion
  const shape = r.shape
  if (!shape || shape.kind !== 'rect') return false
  if (!Array.isArray(shape.points) || shape.points.length < 2) return false
  return true
}

/**
 * Convierte un TextContainerRegion (rect) en estilos CSS absolutos.
 * Asumimos puntos normalizados 0–1.
 */
function rectStyle(region: TextContainerRegion): Record<string, string> {
  const shape = region.shape
  if (!shape || shape.kind !== 'rect' || !Array.isArray(shape.points) || shape.points.length < 2) {
    return {}
  }

  const [p1, p2] = shape.points
  const x1 = typeof p1.x === 'number' ? p1.x : 0
  const y1 = typeof p1.y === 'number' ? p1.y : 0
  const x2 = typeof p2.x === 'number' ? p2.x : 1
  const y2 = typeof p2.y === 'number' ? p2.y : 1

  const x = Math.min(x1, x2)
  const y = Math.min(y1, y2)
  const w = Math.max(0.01, Math.abs(x2 - x1))
  const h = Math.max(0.01, Math.abs(y2 - y1))

  const clamp = (v: number) => Math.max(0, Math.min(v, 1))

  return {
    left: `${clamp(x) * 100}%`,
    top: `${clamp(y) * 100}%`,
    width: `${clamp(w) * 100}%`,
    height: `${clamp(h) * 100}%`,
  }
}

const pagesWithLayout = computed<PageWithLayout[]>(() => {
  const total = props.pages?.length ?? 0
  if (!total) return []

  const layout = resolveLayoutForSection(section)
  const allContainers = Array.isArray(layout.containers) ? layout.containers : []

  // Filtramos una vez a sólo rectángulos válidos
  const validContainers = allContainers.filter(isValidRectRegion)

  return props.pages.map((p, index) => {
    const pageNumber = index + 1

    const { header, footer } = resolveHeaderFooterForSection(section, {
      page: pageNumber,
      pages: total,
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
      ...p,
      header,
      footer,
      layoutColumns: p.layoutColumns ?? layout.columns,
      validContainers,
    }
  })
})
</script>

<style scoped>
.editor-pane {
  max-width: var(--disertare-page-width, 794px);
  margin: 0 auto;
}

.editor-pane--paged {
  padding: 16px 0 24px;
}

.page-preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Página */
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

/* Encabezado */
.page-preview-header {
  min-height: 24px;
  padding: 6px 12px 2px;
  font-size: 11px;
  color: #4b3f72;
  border-bottom: 1px solid #eee9ff;
  display: flex;
  align-items: flex-end;
}

/* Cuerpo */
.page-preview-inner {
  position: relative; /* para overlays absolutos */
  flex: 1;
  padding: var(--disertare-page-padding, 32px 40px);
  overflow: hidden;
}

/* Columnas F2.19 (simple) */
.page-preview-inner.cols-1 {
  column-count: 1;
}

.page-preview-inner.cols-2 {
  column-count: 2;
  column-gap: 28px;
}

.page-preview-inner.cols-3 {
  column-count: 3;
  column-gap: 24px;
}

.page-preview-inner.cols-4 {
  column-count: 4;
  column-gap: 20px;
}

/* Overlays de contenedores */
.page-preview-overlays {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.page-preview-overlay {
  position: absolute;
  border-radius: 4px;
  border: 2px solid rgba(99, 102, 241, 0.95);
  background-color: rgba(129, 140, 248, 0.18);
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.05);
}

/* Pie */
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
