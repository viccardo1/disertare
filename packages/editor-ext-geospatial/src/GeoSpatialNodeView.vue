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

<!-- packages/editor-ext-geospatial/src/GeoSpatialNodeView.vue -->
<template>
  <NodeViewWrapper class="geo-node">
    <div class="geo-inner" @click.stop="selectNode">
      <div class="geo-header">
        <span class="geo-chip">MAP</span>
        <span class="geo-title">{{ title }}</span>
      </div>

      <div
        class="geo-map-placeholder"
        :style="{ width, height }"
      >
        <div class="geo-filename">{{ fileName }}</div>
        <div class="geo-hint">
          Vista GeoSpatial básica (F2).
        </div>
        <div v-if="hasSummary" class="geo-summary">
          {{ summary }}
        </div>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const t = (key: string) => key

const title = computed(
  () => props.node.attrs.title || t('editor.ext.geospatial.default_title'),
)
const fileName = computed(
  () => props.node.attrs.fileName || 'map.geojson',
)
const width = computed(() => props.node.attrs.width || '100%')
const height = computed(() => props.node.attrs.height || '260px')
const geojson = computed(() => props.node.attrs.geojson || props.node.attrs.geoJson || '')

const hasSummary = computed(() => !!geojson.value && geojson.value.length > 0)
const summary = computed(() =>
  geojson.value.length > 80
    ? geojson.value.slice(0, 80) + '…'
    : geojson.value,
)

const selectNode = () => {
  props.editor.commands.setNodeSelection(props.getPos() as number)
}
</script>

<style scoped>
.geo-node {
  display: block;
  margin: 1rem 0;
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
}

.geo-inner {
  border: 1px solid #e0d6ff;
  border-radius: 6px;
  background: #faf7ff;
  padding: 8px 10px;
}

.geo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.geo-chip {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #10b981;
  color: #fff;
}

.geo-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.geo-map-placeholder {
  border-radius: 4px;
  background: repeating-linear-gradient(
    -45deg,
    #e0f7ff,
    #e0f7ff 6px,
    #f2fbff 6px,
    #f2fbff 12px
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  text-align: center;
  color: #444;
}

.geo-filename {
  font-weight: 600;
  margin-bottom: 4px;
}

.geo-hint {
  font-size: 12px;
  margin-bottom: 4px;
}

.geo-summary {
  font-size: 11px;
  max-width: 90%;
  word-break: break-word;
}
</style>
