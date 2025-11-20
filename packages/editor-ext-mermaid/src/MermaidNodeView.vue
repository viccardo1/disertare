<!-- packages/editor-ext-mermaid/src/MermaidNodeView.vue -->
<template>
  <NodeViewWrapper
    ref="mermaidWrapper"
    class="mermaid-node"
    :aria-label="t('editor.ext.mermaid.edit_diagram')"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div ref="renderedDiagram" class="mermaid-rendered"></div>

    <textarea
      v-if="editing"
      ref="textareaRef"
      v-model="diagramCode"
      class="mermaid-input"
      spellcheck="false"
      :aria-label="t('editor.ext.mermaid.input_diagram')"
      @blur="handleBlur"
      @keydown.enter.exact.prevent="handleSubmit"
      @keydown.escape.prevent="handleCancel"
    ></textarea>

    <div v-if="error" class="mermaid-error">{{ error }}</div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

const mermaidWrapper = ref<InstanceType<typeof NodeViewWrapper> | null>(null)
const renderedDiagram = ref<HTMLDivElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// 🔑 Normaliza el contenido por si viene con <div class="mermaid">...</div>
const normalizeDiagramText = (raw: string | undefined | null): string => {
  if (!raw) {
    return 'graph TD\nA[Inicio] --> B{Decisión}\nB -->|Sí| C[Camino 1]\nB -->|No| D[Camino 2]'
  }

  const trimmed = raw.trim()
  const match = trimmed.match(/^<div[^>]*>([\s\S]*)<\/div>$/i)
  if (match && match[1]) {
    return match[1].trim()
  }

  return trimmed
}

const initialContent = normalizeDiagramText(props.node.attrs.content)
const diagramCode = ref<string>(initialContent)
const editing = ref(false)
const error = ref<string | null>(null)

// Placeholder i18n
const t = (key: string) => key

declare global {
  interface Window {
    __mermaidPromise?: Promise<any>
  }
}

const loadMermaid = async () => {
  if (window.__mermaidPromise) return window.__mermaidPromise

  window.__mermaidPromise = import('mermaid')
    .then(mod => {
      const mermaid = (mod as any).default || mod
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
      })
      return mermaid
    })
    .catch(err => {
      console.error('Failed to load Mermaid:', err)
      throw err
    })

  return window.__mermaidPromise
}

const renderDiagram = async () => {
  if (!renderedDiagram.value) return

  try {
    const mermaid = await loadMermaid()

    const container = renderedDiagram.value
    container.innerHTML = ''

    // ⬇️ Siempre texto puro, sin <div> envolvente
    const code = normalizeDiagramText(diagramCode.value)

    // Creamos el nodo .mermaid que Mermaid espera
    const codeEl = document.createElement('div')
    codeEl.className = 'mermaid'
    codeEl.textContent = code
    container.appendChild(codeEl)

    // ✅ IMPORTANTE: pasar el nodo .mermaid, no el contenedor
    await mermaid.run({ nodes: [codeEl] })

    error.value = null
  } catch (err: any) {
    console.error('Mermaid render error:', err)
    error.value = err?.message || 'Error al renderizar el diagrama'
    if (renderedDiagram.value) {
      renderedDiagram.value.innerHTML = ''
    }
  }
}

const handleClick = () => {
  editing.value = true
}

const handleBlur = () => {
  if (!editing.value) return
  handleSubmit()
}

const handleSubmit = () => {
  editing.value = false
  const clean = normalizeDiagramText(diagramCode.value)
  diagramCode.value = clean
  props.updateAttributes({ content: clean })
  renderDiagram()
}

const handleCancel = () => {
  editing.value = false
  diagramCode.value = normalizeDiagramText(props.node.attrs.content)
  renderDiagram()
}

onMounted(() => {
  renderDiagram()
})

watch(
  () => props.node.attrs.content,
  newVal => {
    if (!editing.value && typeof newVal === 'string') {
      diagramCode.value = normalizeDiagramText(newVal)
      renderDiagram()
    }
  },
)
</script>

<style scoped>
.mermaid-node {
  position: relative;
  display: block;
  cursor: pointer;
  margin: 1em 0;
}

.mermaid-rendered {
  min-height: 120px;
  min-width: 200px;
  text-align: center;
}

.mermaid-input {
  width: 100%;
  min-height: 120px;
  margin-top: 8px;
  padding: 8px;
  font-family: monospace;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

.mermaid-error {
  margin-top: 4px;
  color: #b00020;
  font-size: 12px;
}

.mermaid-node:focus,
.mermaid-node:hover {
  outline: 2px solid #6a5af944;
}
</style>
