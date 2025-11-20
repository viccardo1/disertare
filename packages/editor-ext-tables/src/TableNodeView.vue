<template>
  <NodeViewWrapper
    class="table-node"
    :aria-label="t('editor.ext.tables.edit_table')"
  >
    <div class="table-toolbar">
      <button
        @click="addRow"
        :aria-label="t('editor.ext.tables.add_row')"
      >
        + Fila
      </button>
      <button
        @click="addColumn"
        :aria-label="t('editor.ext.tables.add_column')"
      >
        + Col
      </button>
      <button
        @click="deleteRow"
        :aria-label="t('editor.ext.tables.delete_row')"
      >
        - Fila
      </button>
      <button
        @click="deleteColumn"
        :aria-label="t('editor.ext.tables.delete_column')"
      >
        - Col
      </button>
      <button
        @click="toggleHeader"
        :aria-label="t('editor.ext.tables.toggle_header')"
      >
        {{ hasHeader ? 'Sin encabezado' : 'Con encabezado' }}
      </button>
      <input
        v-model="formulaInput"
        type="text"
        class="formula-bar"
        :placeholder="t('editor.ext.tables.formula_placeholder')"
        @focus="onFormulaFocus"
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
              scope="col"
              @click="handleHeaderClick(col - 1, $event)"
            >
              {{ getHeaderLabel(col) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in numRows"
            :key="'row-' + row"
          >
            <td
              v-for="col in numCols"
              :key="'cell-' + row + '-' + col"
              :class="{ selected: isSelected(row - 1, col - 1) }"
              contenteditable="true"
              :data-row="row - 1"
              :data-col="col - 1"
              @blur="commitCellOnBlur(row - 1, col - 1, $event)"
              @keydown.enter.prevent="commitCellOnEnter(row - 1, col - 1, $event)"
              @click="handleCellClick(row - 1, col - 1, $event)"
              v-text="getCellDisplay(row - 1, col - 1)"
            />
          </tr>
        </tbody>
      </table>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

// ---------------------------------------------------------------------------
// Estado base
// ---------------------------------------------------------------------------

const hasHeader = computed<boolean>(() => props.node.attrs.hasHeader ?? true)

const numRows = ref<number>(props.node.attrs.rows ?? 3)
const numCols = ref<number>(props.node.attrs.cols ?? 3)

const cellValue = ref<string[][]>([])
const cellFormula = ref<(string | null)[][]>([])
const cellError = ref<(string | null)[][]>([])

const selectedCell = ref<{ row: number; col: number } | null>(null)

const formulaInput = ref('')
const formulaTarget = ref<{ row: number; col: number } | null>(null)
const formulaAnchor = ref<{ row: number; col: number } | null>(null)

const t = (key: string) => key

const isBuildingFormula = computed(() =>
  formulaInput.value.trim().startsWith('='),
)

// ---------------------------------------------------------------------------
// Inicialización desde el nodo ProseMirror
// ---------------------------------------------------------------------------

const initTable = () => {
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

  const values: string[][] = []
  const formulas: (string | null)[][] = []
  const errors: (string | null)[][] = []

  for (let r = 0; r < numRows.value; r++) {
    const rowNode =
      r < props.node.content.childCount
        ? props.node.content.child(r)
        : null

    const rowValues: string[] = []
    const rowFormulas: (string | null)[] = []
    const rowErrors: (string | null)[] = []

    for (let c = 0; c < numCols.value; c++) {
      const cellNode =
        rowNode && c < rowNode.content.childCount
          ? rowNode.content.child(c)
          : null

      const rawText = cellNode?.textContent ?? ''
      const normalizedText = rawText.replace(/\u00A0/g, ' ').trim()

      const formulaAttr =
        (cellNode?.attrs && (cellNode.attrs as any).formula) ?? null
      const valueAttr =
        (cellNode?.attrs && (cellNode.attrs as any).value) ?? null
      const errorAttr =
        (cellNode?.attrs && (cellNode.attrs as any).error) ?? null

      const effectiveValue =
        typeof valueAttr === 'string' && valueAttr.length > 0
          ? valueAttr
          : normalizedText

      rowValues.push(effectiveValue)
      rowFormulas.push(
        typeof formulaAttr === 'string' && formulaAttr.length > 0
          ? formulaAttr
          : null,
      )
      rowErrors.push(
        typeof errorAttr === 'string' && errorAttr.length > 0
          ? errorAttr
          : null,
      )
    }

    values.push(rowValues)
    formulas.push(rowFormulas)
    errors.push(rowErrors)
  }

  cellValue.value = values
  cellFormula.value = formulas
  cellError.value = errors
}

initTable()

onMounted(() => {
  initTable()
})

watch(
  () => props.node.attrs,
  () => {
    initTable()
  },
)

// ---------------------------------------------------------------------------
// Helpers de vista
// ---------------------------------------------------------------------------

const getHeaderLabel = (col: number) => {
  let n = col - 1
  let label = ''
  while (n >= 0) {
    label = String.fromCharCode((n % 26) + 65) + label
    n = Math.floor(n / 26) - 1
  }
  return label
}

const cellRefFromCoords = (row: number, col: number) =>
  `${getHeaderLabel(col + 1)}${row + 1}`

const isSelected = (row: number, col: number) =>
  selectedCell.value?.row === row && selectedCell.value?.col === col

const selectCell = (row: number, col: number) => {
  selectedCell.value = { row, col }
  const formula = cellFormula.value[row]?.[col] ?? null
  const value = cellValue.value[row]?.[col] ?? ''
  formulaInput.value = formula ?? value
}

const getCellDisplay = (row: number, col: number) => {
  const error = cellError.value[row]?.[col]
  if (error) return error
  return cellValue.value[row]?.[col] ?? ''
}

// ---------------------------------------------------------------------------
// Edición básica (literal vs fórmula) + comportamiento de Enter
// ---------------------------------------------------------------------------

const ensureCellExists = (row: number, col: number) => {
  if (!cellValue.value[row]) {
    for (let r = cellValue.value.length; r <= row; r++) {
      cellValue.value[r] = Array(numCols.value).fill('')
      cellFormula.value[r] = Array(numCols.value).fill(null)
      cellError.value[r] = Array(numCols.value).fill(null)
    }
  }

  if (cellValue.value[row][col] === undefined) {
    for (let c = cellValue.value[row].length; c <= col; c++) {
      cellValue.value[row][c] = ''
      cellFormula.value[row][c] = null
      cellError.value[row][c] = null
    }
  }
}

const commitCellCore = (row: number, col: number, text: string) => {
  ensureCellExists(row, col)

  if (text.startsWith('=')) {
    cellFormula.value[row][col] = text.trim()
    // valor y error se recalculan globalmente
  } else {
    cellFormula.value[row][col] = null
    cellValue.value[row][col] = text
    cellError.value[row][col] = null
  }

  recalculateAll()
}

const commitCellOnBlur = (row: number, col: number, event: FocusEvent) => {
  const target = event.target as HTMLTableCellElement
  const raw = target.innerText ?? ''
  const text = raw.replace(/\u00A0/g, ' ').trim()
  commitCellCore(row, col, text)
}

const moveFocusDown = (
  row: number,
  col: number,
  currentTd: HTMLTableCellElement,
) => {
  const table = currentTd.closest('table')
  if (!table) return

  // si hay fila siguiente, enfocamos la misma columna en la fila de abajo
  if (row + 1 < numRows.value) {
    const nextRow = row + 1
    const selector = `td[data-row="${nextRow}"][data-col="${col}"]`
    const nextTd =
      table.querySelector<HTMLTableCellElement>(selector)
    if (nextTd) {
      nextTd.focus()
      selectCell(nextRow, col)
      return
    }
  }

  // si no hay fila siguiente, simplemente salimos del modo edición
  currentTd.blur()
}

const commitCellOnEnter = (row: number, col: number, event: KeyboardEvent) => {
  const target = event.target as HTMLTableCellElement
  const raw = target.innerText ?? ''
  const text = raw.replace(/\u00A0/g, ' ').trim()
  commitCellCore(row, col, text)
  moveFocusDown(row, col, target)
}

// ---------------------------------------------------------------------------
// Barra de fórmulas y construcción con el mouse
// ---------------------------------------------------------------------------

const onFormulaFocus = () => {
  formulaTarget.value = selectedCell.value ? { ...selectedCell.value } : null
  formulaAnchor.value = formulaTarget.value
}

const insertRefIntoFormula = (ref: string, replaceLastRange = false) => {
  let value = formulaInput.value || ''

  if (!value) {
    formulaInput.value = `=${ref}`
    return
  }

  if (replaceLastRange) {
    formulaInput.value = value.replace(
      /([A-Z]+[0-9]+(:[A-Z]+[0-9]+)?)$/i,
      ref,
    )
    return
  }

  const lastChar = value[value.length - 1]
  if (lastChar === '(' || lastChar === ',' || lastChar === '=') {
    formulaInput.value = value + ref
  } else {
    formulaInput.value = value + ref
  }
}

const handleCellClick = (row: number, col: number, event: MouseEvent) => {
  if (isBuildingFormula.value) {
    const ref = cellRefFromCoords(row, col)

    if (event.shiftKey && (formulaAnchor.value || formulaTarget.value)) {
      const anchor = formulaAnchor.value ?? formulaTarget.value!
      const rowStart = Math.min(anchor.row, row)
      const rowEnd = Math.max(anchor.row, row)
      const colStart = Math.min(anchor.col, col)
      const colEnd = Math.max(anchor.col, col)

      const startRef = cellRefFromCoords(rowStart, colStart)
      const endRef = cellRefFromCoords(rowEnd, colEnd)
      const rangeRef = `${startRef}:${endRef}`

      insertRefIntoFormula(rangeRef, true)
    } else {
      formulaAnchor.value = { row, col }
      insertRefIntoFormula(ref, false)
    }
  } else {
    selectCell(row, col)
  }
}

const handleHeaderClick = (col: number, event: MouseEvent) => {
  if (!isBuildingFormula.value) return

  const startRef = cellRefFromCoords(0, col)
  const endRef = cellRefFromCoords(numRows.value - 1, col)
  const rangeRef = `${startRef}:${endRef}`

  insertRefIntoFormula(rangeRef, event.shiftKey)
}

const applyFormula = () => {
  const target = formulaTarget.value ?? selectedCell.value
  if (!target) return

  const { row, col } = target
  ensureCellExists(row, col)

  const txt = formulaInput.value.trim()
  if (txt.startsWith('=')) {
    cellFormula.value[row][col] = txt
  } else {
    cellFormula.value[row][col] = null
    cellValue.value[row][col] = txt
    cellError.value[row][col] = null
  }

  recalculateAll()

  formulaTarget.value = null
  formulaAnchor.value = null
}

// ---------------------------------------------------------------------------
// Motor de fórmulas: helpers generales
// ---------------------------------------------------------------------------

type FormulaFn = 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT'

const columnLabelToIndex = (label: string): number => {
  let result = 0
  const upper = label.toUpperCase()
  for (let i = 0; i < upper.length; i++) {
    const code = upper.charCodeAt(i)
    if (code < 65 || code > 90) return -1
    result = result * 26 + (code - 65 + 1)
  }
  return result - 1
}

const parseCellRef = (ref: string) => {
  const match = /^([A-Z]+)(\d+)$/.exec(ref.trim().toUpperCase())
  if (!match) return null
  const col = columnLabelToIndex(match[1])
  const row = Number.parseInt(match[2], 10) - 1
  if (Number.isNaN(row) || row < 0 || col < 0) return null
  return { row, col }
}

// rangos tipo A1:B3
const parseRange = (expr: string) => {
  const trimmed = expr.trim().toUpperCase()
  if (!trimmed) return [] as { row: number; col: number }[]

  const parts = trimmed.split(':')
  if (parts.length === 1) {
    const single = parseCellRef(parts[0])
    return single ? [single] : []
  }
  if (parts.length !== 2) return []

  const start = parseCellRef(parts[0])
  const end = parseCellRef(parts[1])
  if (!start || !end) return []

  const rowStart = Math.min(start.row, end.row)
  const rowEnd = Math.max(start.row, end.row)
  const colStart = Math.min(start.col, end.col)
  const colEnd = Math.max(start.col, end.col)

  const cells: { row: number; col: number }[] = []
  for (let r = rowStart; r <= rowEnd; r++) {
    for (let c = colStart; c <= colEnd; c++) {
      cells.push({ row: r, col: c })
    }
  }
  return cells
}

const collectCellsFromArg = (arg: string) => {
  const segments = arg
    .split(/[;,]/)
    .map(part => part.trim())
    .filter(Boolean)

  const all: { row: number; col: number }[] = []
  for (const segment of segments) {
    all.push(...parseRange(segment))
  }
  return all
}

const getNumericValueFromCell = (row: number, col: number) => {
  const raw = cellValue.value[row]?.[col] ?? ''
  if (!raw) return { value: NaN, isEmpty: true }

  if (raw.startsWith('#')) {
    return { value: NaN, isEmpty: false }
  }

  const normalized = raw.replace(',', '.')
  const num = Number.parseFloat(normalized)
  return { value: num, isEmpty: false }
}

// ---------------------------------------------------------------------------
// Parser aritmético + evaluación con errores diferenciados
// ---------------------------------------------------------------------------

type ArithTokenType = 'number' | 'cell' | 'op' | 'paren'
interface ArithToken {
  type: ArithTokenType
  value: string
}

type ExprNode =
  | { type: 'number'; value: number }
  | { type: 'cell'; row: number; col: number }
  | { type: 'unary'; op: '+' | '-'; arg: ExprNode }
  | {
      type: 'binary'
      op: '+' | '-' | '*' | '/' | '^'
      left: ExprNode
      right: ExprNode
    }

type EvalKind = 'ok' | 'div0' | 'value'
interface EvalResultOk {
  kind: 'ok'
  value: number
}
interface EvalResultErr {
  kind: 'div0' | 'value'
}
type EvalResult = EvalResultOk | EvalResultErr

const tokenizeArithmetic = (expr: string): ArithToken[] | null => {
  const tokens: ArithToken[] = []
  let i = 0
  const s = expr

  while (i < s.length) {
    const ch = s[i]

    if (/\s/.test(ch)) {
      i++
      continue
    }

    if ('+-*/^'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch })
      i++
      continue
    }

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = ''
      while (i < s.length) {
        const c = s[i]
        if ((c >= '0' && c <= '9') || c === '.') {
          numStr += c
          i++
        } else break
      }
      if (!numStr) return null
      tokens.push({ type: 'number', value: numStr })
      continue
    }

    if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) {
      let colPart = ''
      while (i < s.length) {
        const c = s[i]
        if (
          (c >= 'A' && c <= 'Z') ||
          (c >= 'a' && c <= 'z')
        ) {
          colPart += c
          i++
        } else break
      }
      let rowPart = ''
      while (i < s.length) {
        const c = s[i]
        if (c >= '0' && c <= '9') {
          rowPart += c
          i++
        } else break
      }
      if (!rowPart) return null
      tokens.push({ type: 'cell', value: `${colPart}${rowPart}`.toUpperCase() })
      continue
    }

    return null
  }

  return tokens
}

const evaluateArithmeticExpression = (expr: string): EvalResult => {
  const tokens = tokenizeArithmetic(expr)
  if (!tokens || !tokens.length) return { kind: 'value' }

  let index = 0
  const peek = () => tokens[index]
  const consume = () => tokens[index++]

  const parsePrimary = (): ExprNode | null => {
    const tok = peek()
    if (!tok) return null

    if (tok.type === 'number') {
      consume()
      const value = Number.parseFloat(tok.value)
      if (Number.isNaN(value)) return null
      return { type: 'number', value }
    }

    if (tok.type === 'cell') {
      consume()
      const ref = parseCellRef(tok.value)
      if (!ref) return null
      return { type: 'cell', row: ref.row, col: ref.col }
    }

    if (tok.type === 'paren' && tok.value === '(') {
      consume()
      const node = parseExpression()
      const closing = peek()
      if (!closing || closing.type !== 'paren' || closing.value !== ')') {
        return null
      }
      consume()
      return node
    }

    return null
  }

  const parseUnary = (): ExprNode | null => {
    const tok = peek()
    if (tok && tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
      consume()
      const arg = parseUnary()
      if (!arg) return null
      return { type: 'unary', op: tok.value as '+' | '-', arg }
    }
    return parsePrimary()
  }

  const parsePower = (): ExprNode | null => {
    let node = parseUnary()
    if (!node) return null

    while (true) {
      const tok = peek()
      if (!tok || tok.type !== 'op' || tok.value !== '^') break
      consume()
      const right = parseUnary()
      if (!right) return null
      node = { type: 'binary', op: '^', left: node, right }
    }

    return node
  }

  const parseMulDiv = (): ExprNode | null => {
    let node = parsePower()
    if (!node) return null

    while (true) {
      const tok = peek()
      if (
        !tok ||
        tok.type !== 'op' ||
        (tok.value !== '*' && tok.value !== '/')
      ) {
        break
      }
      const op = tok.value as '*' | '/'
      consume()
      const right = parsePower()
      if (!right) return null
      node = { type: 'binary', op, left: node, right }
    }

    return node
  }

  const parseExpression = (): ExprNode | null => {
    let node = parseMulDiv()
    if (!node) return null

    while (true) {
      const tok = peek()
      if (
        !tok ||
        tok.type !== 'op' ||
        (tok.value !== '+' && tok.value !== '-')
      ) {
        break
      }
      const op = tok.value as '+' | '-'
      consume()
      const right = parseMulDiv()
      if (!right) return null
      node = { type: 'binary', op, left: node, right }
    }

    return node
  }

  const ast = parseExpression()
  if (!ast || index !== tokens.length) return { kind: 'value' }

  const evalNode = (node: ExprNode): EvalResult => {
    switch (node.type) {
      case 'number':
        return { kind: 'ok', value: node.value }
      case 'cell': {
        const { value } = getNumericValueFromCell(node.row, node.col)
        if (Number.isNaN(value)) return { kind: 'value' }
        return { kind: 'ok', value }
      }
      case 'unary': {
        const res = evalNode(node.arg)
        if (res.kind !== 'ok') return res
        return { kind: 'ok', value: node.op === '-' ? -res.value : res.value }
      }
      case 'binary': {
        const left = evalNode(node.left)
        if (left.kind !== 'ok') return left
        const right = evalNode(node.right)
        if (right.kind !== 'ok') return right
        switch (node.op) {
          case '+':
            return { kind: 'ok', value: left.value + right.value }
          case '-':
            return { kind: 'ok', value: left.value - right.value }
          case '*':
            return { kind: 'ok', value: left.value * right.value }
          case '/':
            if (right.value === 0) return { kind: 'div0' }
            return { kind: 'ok', value: left.value / right.value }
          case '^':
            return { kind: 'ok', value: left.value ** right.value }
          default:
            return { kind: 'value' }
        }
      }
      default:
        return { kind: 'value' }
    }
  }

  return evalNode(ast)
}

// eval de funciones + aritmética, sin REF ni CYCLE (se manejan afuera)
const evaluateFormulaCore = (raw: string): EvalResult => {
  let expr = raw.trim()
  if (!expr) return { kind: 'value' }
  if (expr.startsWith('=')) expr = expr.slice(1)

  const upper = expr.toUpperCase()
  const fnMatch = /^([A-Z]+)\((.+)\)$/.exec(upper)

  if (fnMatch) {
    const fn = fnMatch[1] as FormulaFn
    const arg = fnMatch[2].trim()

    if (['SUM', 'AVG', 'MIN', 'MAX', 'COUNT'].includes(fn)) {
      const cells = collectCellsFromArg(arg)
      if (!cells.length && fn !== 'COUNT') {
        return { kind: 'value' }
      }

      const values: number[] = []
      let nonEmptyCount = 0

      for (const { row, col } of cells) {
        const { value, isEmpty } = getNumericValueFromCell(row, col)
        if (isEmpty) continue
        nonEmptyCount++
        if (!Number.isNaN(value)) values.push(value)
      }

      if (fn === 'COUNT') {
        return { kind: 'ok', value: nonEmptyCount }
      }

      if (!values.length) return { kind: 'value' }

      switch (fn) {
        case 'SUM':
          return {
            kind: 'ok',
            value: values.reduce((acc, v) => acc + v, 0),
          }
        case 'AVG': {
          const sum = values.reduce((acc, v) => acc + v, 0)
          if (values.length === 0) return { kind: 'value' }
          return { kind: 'ok', value: sum / values.length }
        }
        case 'MIN':
          return { kind: 'ok', value: Math.min(...values) }
        case 'MAX':
          return { kind: 'ok', value: Math.max(...values) }
        default:
          return { kind: 'value' }
      }
    }
  }

  return evaluateArithmeticExpression(expr)
}

// ---------------------------------------------------------------------------
// Grafo de dependencias + recálculo global
// ---------------------------------------------------------------------------

const collectDependenciesFromFormula = (
  formula: string,
  rows: number,
  cols: number,
): { deps: { row: number; col: number }[]; hasRefError: boolean } => {
  const deps: { row: number; col: number }[] = []
  let hasRefError = false

  let expr = formula.trim()
  if (!expr.startsWith('=')) return { deps, hasRefError }
  expr = expr.slice(1)
  const upper = expr.toUpperCase()

  const addDep = (coord: { row: number; col: number } | null) => {
    if (!coord) {
      hasRefError = true
      return
    }
    if (
      coord.row < 0 ||
      coord.row >= rows ||
      coord.col < 0 ||
      coord.col >= cols
    ) {
      hasRefError = true
      return
    }
    deps.push(coord)
  }

  const fnMatch = /^([A-Z]+)\((.+)\)$/.exec(upper)
  if (fnMatch) {
    const fn = fnMatch[1]
    const arg = fnMatch[2]
    if (['SUM', 'AVG', 'MIN', 'MAX', 'COUNT'].includes(fn)) {
      const cells = collectCellsFromArg(arg)
      for (const c of cells) addDep(c)
      return { deps, hasRefError }
    }
  }

  const tokens = tokenizeArithmetic(expr)
  if (!tokens) return { deps, hasRefError }

  for (const tok of tokens) {
    if (tok.type === 'cell') {
      const coord = parseCellRef(tok.value)
      addDep(coord)
    }
  }

  return { deps, hasRefError }
}

const recalculateAll = () => {
  const rows = numRows.value
  const cols = numCols.value

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!cellFormula.value[r]?.[c]) {
        cellError.value[r][c] = null
      }
    }
  }

  type Key = string
  const key = (r: number, c: number): Key => `${r},${c}`
  const fromKey = (k: Key) => {
    const [rs, cs] = k.split(',')
    return { row: Number.parseInt(rs, 10), col: Number.parseInt(cs, 10) }
  }

  const depsMap = new Map<Key, Key[]>()
  const indegree = new Map<Key, number>()
  const formulaNodes: Key[] = []
  const refErrorCells = new Set<Key>()

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const f = cellFormula.value[r]?.[c]
      if (!f) continue

      const k = key(r, c)
      const { deps, hasRefError } = collectDependenciesFromFormula(
        f,
        rows,
        cols,
      )

      if (hasRefError) {
        cellError.value[r][c] = '#REF!'
        cellValue.value[r][c] = '#REF!'
        refErrorCells.add(k)
        continue
      }

      formulaNodes.push(k)
      indegree.set(k, 0)
      depsMap.set(
        k,
        deps.map(d => key(d.row, d.col)),
      )
    }
  }

  const nodeSet = new Set(formulaNodes)
  for (const k of formulaNodes) {
    const deps = depsMap.get(k) ?? []
    for (const d of deps) {
      if (!nodeSet.has(d)) continue
      indegree.set(d, (indegree.get(d) ?? 0) + 1)
    }
  }

  const queue: Key[] = []
  for (const k of formulaNodes) {
    if ((indegree.get(k) ?? 0) === 0 && !refErrorCells.has(k)) {
      queue.push(k)
    }
  }

  const topo: Key[] = []
  while (queue.length) {
    const k = queue.shift() as Key
    topo.push(k)
    const deps = depsMap.get(k) ?? []
    for (const d of deps) {
      if (!nodeSet.has(d) || refErrorCells.has(d)) continue
      const newDeg = (indegree.get(d) ?? 0) - 1
      indegree.set(d, newDeg)
      if (newDeg === 0) queue.push(d)
    }
  }

  const processed = new Set(topo)
  const cyclic = formulaNodes.filter(
    k => !processed.has(k) && !refErrorCells.has(k),
  )

  for (const k of cyclic) {
    const { row, col } = fromKey(k)
    cellError.value[row][col] = '#CYCLE!'
    cellValue.value[row][col] = '#CYCLE!'
  }

  for (const k of topo) {
    if (refErrorCells.has(k)) continue
    if (cyclic.includes(k)) continue

    const { row, col } = fromKey(k)
    const f = cellFormula.value[row]?.[col]
    if (!f) continue

    const res = evaluateFormulaCore(f)
    if (res.kind === 'ok') {
      cellValue.value[row][col] = String(res.value)
      cellError.value[row][col] = null
    } else if (res.kind === 'div0') {
      cellValue.value[row][col] = '#DIV/0!'
      cellError.value[row][col] = '#DIV/0!'
    } else {
      cellValue.value[row][col] = '#VALUE!'
      cellError.value[row][col] = '#VALUE!'
    }
  }

  syncToNode()
}

// ---------------------------------------------------------------------------
// Sincronización con ProseMirror
// ---------------------------------------------------------------------------

const syncToNode = () => {
  const { editor } = props
  const { state, view } = editor
  const { schema } = state

  const tableType = schema.nodes.table
  const rowType = schema.nodes.tableRow
  const cellType = schema.nodes.tableCell

  if (!tableType || !rowType || !cellType) {
    console.warn(
      '[tables] tipos de nodo table/tableRow/tableCell no encontrados en schema',
    )
    return
  }

  const rowsNodes = []

  for (let r = 0; r < numRows.value; r++) {
    const cellsNodes = []
    for (let c = 0; c < numCols.value; c++) {
      const value = cellValue.value[r]?.[c] ?? ''
      const formula = cellFormula.value[r]?.[c] ?? null
      const error = cellError.value[r]?.[c] ?? null

      const attrs: Record<string, any> = {
        formula,
        value,
        error,
      }

      const content = value && !value.startsWith('#') ? [schema.text(value)] : []
      const cellNode =
        cellType.createAndFill(attrs, content) ||
        cellType.create(attrs, content)
      cellsNodes.push(cellNode)
    }
    const rowNode =
      rowType.createAndFill({}, cellsNodes) ||
      rowType.create({}, cellsNodes)
    rowsNodes.push(rowNode)
  }

  const newTableNode =
    tableType.create(
      {
        ...props.node.attrs,
        rows: numRows.value,
        cols: numCols.value,
        hasHeader: hasHeader.value,
      },
      rowsNodes,
    )

  const pos = props.getPos()
  if (typeof pos !== 'number') {
    console.warn('[tables] getPos() no es numérico, no se puede reemplazar nodo')
    return
  }

  const tr = state.tr.replaceWith(pos, pos + props.node.nodeSize, newTableNode)
  view.dispatch(tr)
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

const addRow = () => {
  const newVals = Array(numCols.value).fill('')
  const newFormulas = Array(numCols.value).fill(null)
  const newErrors = Array(numCols.value).fill(null)

  cellValue.value.push(newVals)
  cellFormula.value.push(newFormulas)
  cellError.value.push(newErrors)

  numRows.value++
  recalculateAll()
}

const addColumn = () => {
  for (let r = 0; r < numRows.value; r++) {
    if (!cellValue.value[r]) {
      cellValue.value[r] = []
      cellFormula.value[r] = []
      cellError.value[r] = []
    }
    cellValue.value[r].push('')
    cellFormula.value[r].push(null)
    cellError.value[r].push(null)
  }
  numCols.value++
  recalculateAll()
}

const deleteRow = () => {
  if (numRows.value <= 1) return
  cellValue.value.pop()
  cellFormula.value.pop()
  cellError.value.pop()
  numRows.value--
  recalculateAll()
}

const deleteColumn = () => {
  if (numCols.value <= 1) return
  for (let r = 0; r < numRows.value; r++) {
    cellValue.value[r]?.pop()
    cellFormula.value[r]?.pop()
    cellError.value[r]?.pop()
  }
  numCols.value--
  recalculateAll()
}

const toggleHeader = () => {
  props.editor
    .chain()
    .focus()
    .command(({ tr }) => {
      const pos = props.getPos()
      if (typeof pos !== 'number') return false
      const node = tr.doc.nodeAt(pos)
      if (!node) return false
      const newAttrs = {
        ...node.attrs,
        hasHeader: !hasHeader.value,
      }
      tr.setNodeMarkup(pos, node.type, newAttrs, node.marks)
      return true
    })
    .run()
}
</script>

<style scoped>
.table-node {
  margin: 1em 0;
  padding: 6px;
  border-radius: 6px;
  border: 1px dashed #6a5af944;
  background: rgba(106, 90, 249, 0.02);
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
  direction: ltr;
}

th {
  background: #f3efff;
  font-weight: 600;
}

td.selected {
  outline: 2px solid #6a5af9aa;
}
</style>
