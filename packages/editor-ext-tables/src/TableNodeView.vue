<template>
  <NodeViewWrapper class="table-node" :aria-label="t('editor.ext.tables.edit_table')">
    <div class="table-toolbar">
      <button @click="addRow" :aria-label="t('editor.ext.tables.add_row')">+ Fila</button>
      <button @click="addColumn" :aria-label="t('editor.ext.tables.add_column')">+ Col</button>
      <button @click="deleteRow" :aria-label="t('editor.ext.tables.delete_row')">- Fila</button>
      <button @click="deleteColumn" :aria-label="t('editor.ext.tables.delete_column')">- Col</button>
      <button @click="toggleHeader" :aria-label="t('editor.ext.tables.toggle_header')">
        {{ hasHeader ? 'Sin encabezado' : 'Con encabezado' }}
      </button>
      <input
        v-model="formulaInput"
        type="text"
        class="formula-bar"
        :placeholder="t('editor.ext.tables.formula_placeholder')"
        @keydown.enter.prevent="applyFormula"
      />
    </div>

    <div class="table-frame">
      <table>
        <thead v-if="hasHeader">
          <tr>
            <th
              v-for="col in numCols"
              :key="'header-' + col"
              @click="selectCell(0, col - 1)"
            >
              {{ getHeaderLabel(col) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in numRows" :key="'row-' + row">
            <td
              v-for="col in numCols"
              :key="'cell-' + row + '-' + col"
              :class="{ selected: isSelected(row - 1, col - 1) }"
              contenteditable="true"
              @input="updateCell(row - 1, col - 1, $event)"
              @click="selectCell(row - 1, col - 1)"
            >
              {{ getCellValue(row - 1, col - 1) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

// --- Estado reactivo ---
const hasHeader = computed(() => props.node.attrs.hasHeader ?? true)
const numRows = ref<number>(props.node.attrs.rows ?? 3)
const numCols = ref<number>(props.node.attrs.cols ?? 3)
const cellData = ref<string[][]>([])
const selectedCell = ref<{ row: number; col: number } | null>(null)
const formulaInput = ref('')

// Placeholder i18n
const t = (key: string) => key

// --- Inicialización segura de la tabla ---
const initTable = () => {
  // Intentamos tomar filas/columnas desde attrs; si no, desde el contenido real
  const suggestedRows =
    props.node.attrs.rows ?? props.node.content.childCount ?? 3
  const firstRowNode = props.node.content.childCount
    ? props.node.content.child(0)
    : null
  const suggestedCols =
    props.node.attrs.cols ??
    (firstRowNode && firstRowNode.content
      ? firstRowNode.content.childCount
      : 3)

  numRows.value = suggestedRows || 3
  numCols.value = suggestedCols || 3

  const data: string[][] = []

  for (let r = 0; r < numRows.value; r++) {
    const rowNode =
      r < props.node.content.childCount
        ? props.node.content.child(r)
        : null

    const row: string[] = []

    for (let c = 0; c < numCols.value; c++) {
      const cellNode =
        rowNode && c < rowNode.content.childCount
          ? rowNode.content.child(c)
          : null

      const text = cellNode?.textContent ?? ''
      row.push(text)
    }

    data.push(row)
  }

  cellData.value = data
}

// Llamamos una vez en setup
initTable()

onMounted(() => {
  // Por si los attrs cambian justo después del mount
  initTable()
})

// Si cambian los attrs del nodo (por ejemplo, desde un comando), re-sync
watch(
  () => props.node.attrs,
  () => {
    initTable()
  },
)

// --- Helpers de vista ---
const getHeaderLabel = (col: number) => {
  const A = 'A'.charCodeAt(0)
  return String.fromCharCode(A + col - 1)
}

const isSelected = (row: number, col: number) => {
  return selectedCell.value?.row === row && selectedCell.value?.col === col
}

const selectCell = (row: number, col: number) => {
  selectedCell.value = { row, col }
}

const getCellValue = (row: number, col: number) => {
  return cellData.value[row]?.[col] ?? ''
}

// --- Actualizaciones / edición ---
const ensureCellExists = (row: number, col: number) => {
  if (!cellData.value[row]) {
    cellData.value[row] = []
  }
  if (cellData.value[row][col] === undefined) {
    cellData.value[row][col] = ''
  }
}

const updateCell = (row: number, col: number, event: Event) => {
  const target = event.target as HTMLTableCellElement
  ensureCellExists(row, col)
  cellData.value[row][col] = target.innerText ?? ''
  syncToNode()
}

const applyFormula = () => {
  if (!selectedCell.value) return
  // En F2 no hay motor de fórmulas; simplemente sincronizamos
  syncToNode()
}

const syncToNode = () => {
  // F2: estado sólo local.
  // En F2.1+ se podrá serializar cellData a attrs/JSON si se desea.
}

// --- Botones de toolbar ---
const addRow = () => {
  const newRow = Array(numCols.value).fill('')
  cellData.value.push(newRow)
  numRows.value++
}

const addColumn = () => {
  cellData.value.forEach(row => row.push(''))
  numCols.value++
}

const deleteRow = () => {
  if (numRows.value <= 1) return
  cellData.value.pop()
  numRows.value--
}

const deleteColumn = () => {
  if (numCols.value <= 1) return
  cellData.value.forEach(row => row.pop())
  numCols.value--
}

const toggleHeader = () => {
  props.updateAttributes({ hasHeader: !hasHeader.value })
}
</script>

<style scoped>
.table-node {
  margin: 1em 0;
  padding: 6px;
  border-radius: 6px;
  border: 1px dashed #6a5af944;
  background: rgba(106, 90, 249, 0.02); /* marco muy suave pero visible */
}

.table-toolbar {
  margin-bottom: 4px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.table-toolbar button {
  padding: 2px 6px;
  font-size: 12px;
}

.formula-bar {
  flex: 1;
  min-width: 120px;
  padding: 2px 4px;
  font-size: 12px;
}

.table-frame {
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  border: 1px solid #d0c8ff;
  padding: 4px 6px;
  min-width: 40px;
  font-size: 13px;
  background: #ffffff;
}

th {
  background: #f3efff;
  font-weight: 600;
}

td.selected {
  outline: 2px solid #6a5af9aa;
}
</style>
