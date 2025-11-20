<!-- packages/editor-ext-cad/src/CadNodeView.vue -->
<template>
  <NodeViewWrapper class="cad-node">
    <div class="cad-inner" @click.stop="selectNode">
      <div class="cad-header">
        <span class="cad-chip">CAD</span>
        <span class="cad-title">{{ title }}</span>
      </div>

      <div
        class="cad-canvas-placeholder"
        :style="{ width, height }"
      >
        <div class="cad-filename">{{ fileName }}</div>
        <div class="cad-hint">
          Vista previa CAD básica (F2).
        </div>
      </div>

      <div class="cad-meta">
        <span v-if="src" class="cad-src">Origen: {{ src }}</span>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

// Placeholder i18n F4.2+
const t = (key: string) => key

const title = computed(() => props.node.attrs.title || t('editor.ext.cad.default_title'))
const fileName = computed(
  () => props.node.attrs.fileName || props.node.attrs.src || 'modelo.dxf',
)
const src = computed(() => props.node.attrs.src || '')
const width = computed(() => props.node.attrs.width || '100%')
const height = computed(() => props.node.attrs.height || '260px')

const selectNode = () => {
  props.editor.commands.setNodeSelection(props.getPos() as number)
}
</script>

<style scoped>
.cad-node {
  display: block;
  margin: 1rem 0;
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
}

.cad-inner {
  border: 1px solid #e0d6ff;
  border-radius: 6px;
  background: #faf7ff;
  padding: 8px 10px;
}

.cad-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.cad-chip {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #6a5af9;
  color: #fff;
}

.cad-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.cad-canvas-placeholder {
  border-radius: 4px;
  background: repeating-linear-gradient(
    45deg,
    #ede7ff,
    #ede7ff 6px,
    #f7f2ff 6px,
    #f7f2ff 12px
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  text-align: center;
  color: #555;
}

.cad-filename {
  font-weight: 600;
  margin-bottom: 4px;
}

.cad-hint {
  font-size: 12px;
}

.cad-meta {
  margin-top: 4px;
  font-size: 11px;
  color: #777;
}
</style>
