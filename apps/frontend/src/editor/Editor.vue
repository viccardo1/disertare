<!-- /home/vicente/Disertare/apps/frontend/src/editor/Editor.vue -->
<template>
  <div class="editor-container">
    <div class="ruler-horizontal" aria-hidden="true"></div>
    <div class="editor-main">
      <div class="ruler-vertical" aria-hidden="true"></div>
      <div class="editor-content">
        <editor-content :editor="editor" />
      </div>
    </div>
    <div class="editor-info-bar" aria-live="polite">
      <span>Total: {{ stats.words }} palabras</span>
      <span>{{ stats.paragraphs }} párrafos</span>
      <span>Párrafo: {{ stats.wordsInCurrentParagraph }} palabras</span>
      <span>{{ stats.linesInCurrentParagraph }} líneas</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, markRaw } from 'vue'
import { EditorContent } from '@tiptap/vue-3'
import { createDisertareEditor } from '@disertare/editor-core'
import type { Editor } from '@tiptap/core'

const stats = reactive({
  words: 0,
  paragraphs: 0,
  wordsInCurrentParagraph: 0,
  linesInCurrentParagraph: 0,
})

// ✅ markRaw: evita reactividad sobre instancia de TipTap
const editor = markRaw(createDisertareEditor('<p>Inicio de documento Disertare.</p>'))

const updateStats = () => {
  const text = editor.getText()
  const tokens = text.match(/[\p{L}\p{N}]+/gu) ?? []
  stats.words = tokens.length

  // ✅ Conteo preciso de párrafos (nodos 'paragraph' de TipTap)
  stats.paragraphs = editor.state.doc.childCount

  // ✅ Obtener párrafo actual robustamente
  const { $from } = editor.state.selection
  let currentParagraphNode = null

  for (let i = $from.depth; i >= 0; i--) {
    const node = $from.node(i)
    if (node.type.name === 'paragraph') {
      currentParagraphNode = node
      break
    }
  }

  if (currentParagraphNode) {
    const paraText = currentParagraphNode.textContent
    stats.wordsInCurrentParagraph = paraText.match(/[\p{L}\p{N}]+/gu)?.length || 0
    // Líneas: estimación visual razonable (F1 no requiere layout real)
    stats.linesInCurrentParagraph = Math.max(1, Math.ceil(paraText.length / 80))
  } else {
    stats.wordsInCurrentParagraph = 0
    stats.linesInCurrentParagraph = 0
  }
}

onMounted(() => {
  editor.on('update', updateStats)
  updateStats()
})

onUnmounted(() => {
  editor.destroy()
})
</script>

<style scoped>
/* ✅ Variables CSS localizadas al editor */
.editor-container {
  --purple-fade: #e0d6ff33;
  --ruler-size: 20px;

  display: grid;
  grid-template-rows: var(--ruler-size) 1fr auto;
  height: 100%;
  overflow: hidden;
}

.ruler-horizontal {
  background: repeating-linear-gradient(
    to right,
    var(--purple-fade),
    var(--purple-fade) 4px,
    transparent 4px,
    transparent 20px
  );
  height: var(--ruler-size);
  border-bottom: 1px solid var(--purple-fade);
}

.editor-main {
  display: grid;
  grid-template-columns: var(--ruler-size) 1fr;
  height: 100%;
  overflow: hidden;
}

.ruler-vertical {
  background: repeating-linear-gradient(
    to bottom,
    var(--purple-fade),
    var(--purple-fade) 4px,
    transparent 4px,
    transparent 20px
  );
  width: var(--ruler-size);
  border-right: 1px solid var(--purple-fade);
}

.editor-content {
  overflow: auto;
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
}

.editor-info-bar {
  display: flex;
  gap: 16px;
  padding: 4px 12px;
  background: var(--purple-fade);
  font-family: 'Atkinson Hyperlegible', sans-serif;
  font-size: 13px;
  color: #333;
  border-top: 1px solid var(--purple-fade);
}
</style>
