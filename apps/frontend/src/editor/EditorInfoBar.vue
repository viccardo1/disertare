<!-- apps/frontend/src/editor/EditorInfoBar.vue -->
<template>
  <div class="editor-info-bar" aria-live="polite">
    <span>Total: {{ stats.words }} palabras</span>
    <span>{{ stats.paragraphs }} párrafos</span>
    <span>Párrafo: {{ stats.wordsInCurrentParagraph }} palabras</span>
    <span>{{ stats.linesInCurrentParagraph }} líneas</span>
  </div>
</template>

<script setup lang="ts">
import type { EditorStats } from './composables/useEditorStats'

const props = defineProps<{
  stats: EditorStats
}>()

const stats = props.stats
</script>

<style scoped>
.editor-info-bar {
  display: flex;
  gap: 16px;
  padding: 4px 16px 8px;
  font-size: 12px;
  color: #5f4b8b;
  background: #f2efff;
  border-top: 1px solid #e0d6ff;
}
</style>
