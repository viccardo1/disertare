<!-- packages/editor-ext-katex/src/KatexNodeView.vue -->
<template>
  <NodeViewWrapper
    class="katex-node"
    :class="{ 'katex-inline': inline, 'katex-display': !inline }"
    :tabindex="0"
    :aria-label="t('editor.ext.katex.edit_formula')"
    role="button"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Siempre se muestra KaTeX -->
    <div ref="renderedFormula" class="katex-rendered"></div>

    <!-- El input solo aparece en modo edición, debajo de la fórmula -->
    <input
      v-if="editing"
      ref="inputRef"
      v-model="formula"
      class="katex-input"
      :aria-label="t('editor.ext.katex.input_formula')"
      spellcheck="false"
      @blur="handleSubmit"
      @keydown.enter.stop.prevent="handleSubmit"
      @keydown.escape.stop.prevent="handleCancel"
      @keydown.tab.stop.prevent
    />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

const renderedFormula = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// inline depende de los attrs del nodo (por si cambian desde comandos)
const inline = computed<boolean>(() => props.node.attrs.inline ?? true)

// fórmula local inicializada desde attrs
const formula = ref<string>(props.node.attrs.content ?? '\\sqrt{a^2 + b^2}')
const editing = ref(false)

// Placeholder para i18n
const t = (key: string) => key

// Cache global de KaTeX para no re-importar
declare global {
  interface Window {
    __katexPromise?: Promise<any>
  }
}

const loadKaTeX = async () => {
  if (window.__katexPromise) return window.__katexPromise

  window.__katexPromise = import('katex').then(mod => {
    let link = document.getElementById('katex-stylesheet') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = 'katex-stylesheet'
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'
      document.head.appendChild(link)
    }
    return mod
  })

  return window.__katexPromise
}

const renderFormula = async () => {
  if (!renderedFormula.value) return

  try {
    const { default: katex } = await loadKaTeX()
    katex.render(formula.value || '', renderedFormula.value, {
      throwOnError: false,
      displayMode: !inline.value,
    })
    renderedFormula.value.style.color = 'inherit'
  } catch (error) {
    console.error('[KatexNodeView] render error:', error)
    renderedFormula.value.textContent = formula.value || 'Invalid formula'
    renderedFormula.value.style.color = 'red'
  }
}

const handleClick = async () => {
  editing.value = true
  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
}

const handleSubmit = () => {
  editing.value = false
  props.updateAttributes({
    content: formula.value,
    inline: inline.value,
  })
  void renderFormula()
}

const handleCancel = () => {
  editing.value = false
  // restaurar a lo que tenga el nodo actualmente
  formula.value = props.node.attrs.content ?? formula.value
  void renderFormula()
}

// Render inicial
onMounted(() => {
  void renderFormula()
})

// Si el nodo cambia desde fuera (otro comando, colaborador, etc.)
watch(
  () => props.node.attrs.content,
  newContent => {
    if (!editing.value && typeof newContent === 'string') {
      formula.value = newContent
      void renderFormula()
    }
  },
)
</script>

<style scoped>
.katex-node {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.katex-rendered {
  min-width: 40px;
  min-height: 24px;
  padding: 4px;
}

.katex-input {
  margin-top: 4px;
  width: 100%;
  padding: 4px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
}

.katex-node:focus,
.katex-node:hover {
  outline: 2px solid #6a5af944;
}

.katex-inline {
  display: inline-block;
  vertical-align: middle;
}

.katex-display {
  display: block;
  text-align: center;
  margin: 1em 0;
}
</style>
