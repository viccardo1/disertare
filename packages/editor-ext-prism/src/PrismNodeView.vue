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

<!-- packages/editor-ext-prism/src/PrismNodeView.vue -->
<template>
  <NodeViewWrapper class="prism-node" :aria-label="t('editor.ext.prism.code_block')">
    <select
      v-model="selectedLanguage"
      class="prism-language-select"
      :aria-label="t('editor.ext.prism.select_language')"
      @change="updateLanguage"
    >
      <option value="javascript">JavaScript</option>
      <option value="typescript">TypeScript</option>
      <option value="python">Python</option>
      <option value="java">Java</option>
      <option value="c">C</option>
      <option value="cpp">C++</option>
      <option value="csharp">C#</option>
      <option value="go">Go</option>
      <option value="rust">Rust</option>
      <option value="php">PHP</option>
      <option value="ruby">Ruby</option>
      <option value="swift">Swift</option>
    </select>

    <pre ref="codeBlock" class="prism-code">
      <code class="language-{{ selectedLanguage }}">{{ codeText }}</code>
    </pre>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()
const codeBlock = ref<HTMLPreElement | null>(null)
const selectedLanguage = ref<string>(props.node.attrs.language || 'javascript')
const codeText = ref<string>(props.node.textContent)

// Placeholder i18n
const t = (key: string) => key

declare global {
  interface Window {
    __prismPromise?: Promise<any>
  }
}

const loadPrism = async () => {
  if (window.__prismPromise) return window.__prismPromise

  window.__prismPromise = import('prismjs')
    .then(async mod => {
      if (!document.getElementById('prism-stylesheet')) {
        const link = document.createElement('link')
        link.id = 'prism-stylesheet'
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css'
        document.head.appendChild(link)
      }

      await import('prismjs/components/prism-typescript')
      await import('prismjs/components/prism-python')
      await import('prismjs/components/prism-java')
      await import('prismjs/components/prism-c')
      await import('prismjs/components/prism-cpp')
      await import('prismjs/components/prism-csharp')
      await import('prismjs/components/prism-go')
      await import('prismjs/components/prism-rust')
      await import('prismjs/components/prism-php')
      await import('prismjs/components/prism-ruby')
      await import('prismjs/components/prism-swift')

      return mod
    })
    .catch(err => {
      console.error('Failed to load Prism:', err)
      throw err
    })

  return window.__prismPromise
}

const updateLanguage = () => {
  props.updateAttributes({ language: selectedLanguage.value })
  highlight()
}

const highlight = async () => {
  if (!codeBlock.value) return
  try {
    const { default: Prism } = await loadPrism()
    const codeEl = codeBlock.value.querySelector('code')
    if (codeEl) {
      codeEl.textContent = codeText.value
      Prism.highlightElement(codeEl)
    }
  } catch (err) {
    console.error('Prism highlight failed:', err)
  }
}

onMounted(() => {
  highlight()
})

watch(
  () => props.node.textContent,
  newText => {
    codeText.value = newText || ''
    highlight()
  },
)
</script>

<style scoped>
.prism-node {
  position: relative;
  margin: 1em 0;
}

.prism-language-select {
  margin-bottom: 4px;
  padding: 2px 4px;
  font-size: 12px;
}

.prism-code {
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}
</style>
