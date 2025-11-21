import { Table as TiptapTable } from '@tiptap/extension-table'
import TableRowBase from '@tiptap/extension-table-row'
import TableHeaderBase from '@tiptap/extension-table-header'
import TableCellBase from '@tiptap/extension-table-cell'
import type { NodeViewRenderer } from '@tiptap/core'
import { TableNodeView } from './TableNodeView'

/**
 * Nodo principal de tabla.
 *
 * Mantiene el nombre de exportación `Table` porque así lo importa Editor.vue:
 *
 *   import { Table } from '@disertare/editor-ext-tables'
 */
export const Table = TiptapTable.extend({
  group: 'block',

  addAttributes() {
    return {
      ...this.parent?.(),
                                        rows: {
                                          default: 3,
                                        },
                                        cols: {
                                          default: 3,
                                        },
                                        hasHeader: {
                                          default: true,
                                        },
    }
  },

  addNodeView(): NodeViewRenderer {
    return TableNodeView
  },
})

/**
 * Fila y encabezado se dejan sin cambios por ahora.
 * Si más adelante se quieren attrs extra, se pueden extender aquí.
 */
export const TableRow = TableRowBase
export const TableHeader = TableHeaderBase

/**
 * Celda de tabla extendida con attrs para F2.1:
 * - formula: string | null → fórmula original (si empieza con "=")
 * - value:   string | null → valor calculado o literal
 * - error:   string | null → código de error tipo "#REF!", "#DIV/0!", etc.
 *
 * Las tablas sin fórmulas siguen funcionando porque estos attrs
 * son opcionales y con default null.
 */
export const TableCell = TableCellBase.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
                                              formula: {
                                          default: null,
                                              },
                                              value: {
                                          default: null,
                                              },
                                              error: {
                                          default: null,
                                              },
    }
  },
})

/**
 * Export por defecto conveniente si quieres registrar todo el paquete
 * de golpe en el Editor:
 *
 *   import TablesExtensions from '@disertare/editor-ext-tables'
 *   ...
 *   extensions: [
 *     StarterKit,
 *     ...TablesExtensions,
 *   ]
 */
export default [Table, TableRow, TableHeader, TableCell]
