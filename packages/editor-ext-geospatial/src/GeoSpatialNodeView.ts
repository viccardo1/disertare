// packages/editor-ext-geospatial/src/GeoSpatialNodeView.ts
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import GeoSpatialNodeViewComponent from './GeoSpatialNodeView.vue'

export const GeoSpatialNodeView: NodeViewRenderer =
VueNodeViewRenderer(GeoSpatialNodeViewComponent)
