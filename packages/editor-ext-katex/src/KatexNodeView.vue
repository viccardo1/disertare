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
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/vue-3'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = defineProps<NodeViewProps>()

const renderedFormula = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// inline depende de los attrs del nodo (por si cambian desde comandos)
const inline = computed<boolean>(() => props.node.attrs.inline ?? true)

// fórmula local inicializada desde attrs
const formula = ref<string>(
  typeof props.node.attrs.content === 'string'
    ? props.node.attrs.content
    : '\\sqrt{a^2 + b^2}',
)
const editing = ref(false)

// Placeholder para i18n
const t = (key: string) => key

function renderFormula() {
  if (!renderedFormula.value) return

  try {
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

async function handleClick() {
  editing.value = true
  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
}

function handleSubmit() {
  editing.value = false
  props.updateAttributes({
    content: formula.value,
    inline: inline.value,
  })
  renderFormula()
}

function handleCancel() {
  editing.value = false
  // restaurar a lo que tenga el nodo actualmente
  formula.value =
    typeof props.node.attrs.content === 'string'
      ? props.node.attrs.content
      : formula.value
  renderFormula()
}

// Render inicial
onMounted(() => {
  renderFormula()
})

// Si el nodo cambia desde fuera (otro comando, colaborador, etc.)
watch(
  () => props.node.attrs.content,
  newContent => {
    if (!editing.value && typeof newContent === 'string') {
      formula.value = newContent
      renderFormula()
    }
  },
)

// Si alguien cambia inline/display desde un comando
watch(
  () => inline.value,
  () => {
    renderFormula()
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
