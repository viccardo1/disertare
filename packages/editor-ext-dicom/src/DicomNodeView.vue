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

<!-- packages/editor-ext-dicom/src/DicomNodeView.vue -->
<template>
  <NodeViewWrapper class="dicom-node">
    <div class="dicom-inner" @click.stop="selectNode">
      <div class="dicom-header">
        <span class="dicom-chip">DICOM</span>
        <span class="dicom-title">{{ heading }}</span>
      </div>

      <div
        class="dicom-viewport"
        :style="{ width, height }"
      >
        <div class="dicom-filename">{{ fileName }}</div>
        <div class="dicom-placeholder">
          Vista previa DICOM básica (F2).
        </div>
      </div>

      <div class="dicom-meta">
        <span v-if="patient">Paciente: {{ patient }}</span>
        <span v-if="study"> · Estudio: {{ study }}</span>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

// i18n placeholder
const t = (key: string) => key

const heading = computed(
  () => props.node.attrs.title || t('editor.ext.dicom.default_title'),
)
const fileName = computed(
  () => props.node.attrs.fileName || props.node.attrs.src || 'imagen.dcm',
)
const patient = computed(() => props.node.attrs.patient || '')
const study = computed(() => props.node.attrs.study || '')
const width = computed(() => props.node.attrs.width || '100%')
const height = computed(() => props.node.attrs.height || '260px')

const selectNode = () => {
  props.editor.commands.setNodeSelection(props.getPos() as number)
}
</script>

<style scoped>
.dicom-node {
  display: block;
  margin: 1rem 0;
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
}

.dicom-inner {
  border: 1px solid #e0d6ff;
  border-radius: 6px;
  background: #faf7ff;
  padding: 8px 10px;
}

.dicom-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.dicom-chip {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #f97373;
  color: #fff;
}

.dicom-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.dicom-viewport {
  border-radius: 4px;
  background: radial-gradient(circle at 30% 30%, #ffffff, #e5e5e5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  text-align: center;
  color: #444;
}

.dicom-filename {
  font-weight: 600;
  margin-bottom: 4px;
}

.dicom-placeholder {
  font-size: 12px;
}

.dicom-meta {
  margin-top: 4px;
  font-size: 11px;
  color: #777;
}
</style>
