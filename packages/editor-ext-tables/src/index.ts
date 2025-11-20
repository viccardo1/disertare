// packages/editor-ext-tables/src/index.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { TableNodeView } from './TableNodeView'

// === 1. Nodo principal: Table ===
export const Table = Node.create({
  name: 'table',
  group: 'block',                // ✅ ahora el doc lo acepta como bloque
  content: 'tableRow+',
  tableRole: 'table',
  isolating: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      hasHeader: {
        default: true,
          parseHTML: element =>
          element.getAttribute('data-has-header') !== 'false',
                                 renderHTML: attributes => ({
                                   'data-has-header': attributes.hasHeader ? 'true' : 'false',
                                 }),
      },
      rows: {
        default: 3,
          parseHTML: element => {
            const value = element.getAttribute('data-rows')
            return value ? parseInt(value, 10) || 3 : 3
          },
          renderHTML: attributes => ({
            'data-rows': attributes.rows,
          }),
      },
      cols: {
        default: 3,
          parseHTML: element => {
            const value = element.getAttribute('data-cols')
            return value ? parseInt(value, 10) || 3 : 3
          },
          renderHTML: attributes => ({
            'data-cols': attributes.cols,
          }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'table[data-disertare-table]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'table',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-table': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setTable:
      (attrs?: { rows?: number; cols?: number; hasHeader?: boolean }) =>
      ({ chain }) => {
        const rows = attrs?.rows ?? 3
        const cols = attrs?.cols ?? 3
        const hasHeader = attrs?.hasHeader ?? true

        const content: any[] = []

        for (let i = 0; i < rows; i++) {
          const cells: any[] = []

          for (let j = 0; j < cols; j++) {
            const cellContent = [{ type: 'text', text: ' ' }]

            // Fila 0 con encabezado → tableHeader
            if (i === 0 && hasHeader) {
              cells.push({ type: 'tableHeader', content: cellContent })
            } else {
              cells.push({ type: 'tableCell', content: cellContent })
            }
          }

          content.push({
            type: 'tableRow',
            content: cells,
          })
        }

        return chain()
        .insertContent({
          type: this.name,
          attrs: { hasHeader, rows, cols }, // ✅ guardamos filas/cols en attrs
          content,
        })
        .run()
      },
    }
  },

  addNodeView() {
    return TableNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tablePasteHandler'),
                 props: {
                   handlePaste(view, event) {
                     const text = event.clipboardData?.getData('text/plain')
                     if (!text || !/[,;\t]/.test(text)) return false

                       const lines = text.trim().split(/\r?\n/)
                       const rows = lines.map(line => line.split(/[,;\t]/))
                       if (rows.length < 2) return false

                         const { schema, dispatch } = view.state
                         const tableContent = rows.map(row => {
                           const cells = row.map(cell =>
                           schema.nodes.tableCell.createChecked({}, [
                             schema.text((cell ?? '').trim() || ' '),
                           ]),
                           )
                           return schema.nodes.tableRow.createChecked({}, cells)
                         })

                         const tableNode = schema.nodes.table.createChecked(
                           {
                             // podrías llenar attrs aquí si quieres
                           },
                           tableContent,
                         )

                         const tr = view.state.tr.replaceSelectionWith(tableNode)
                         dispatch(tr)
                         event.preventDefault()
                         return true
                   },
                 },
      }),
    ]
  },
})

// === 2. Nodo: TableRow ===
export const TableRow = Node.create({
  name: 'tableRow',
  content: '(tableCell | tableHeader)*',
                                    tableRole: 'row',

                                    parseHTML() {
                                      return [{ tag: 'tr' }]
                                    },

                                    renderHTML() {
                                      return ['tr', 0]
                                    },
})

// === 3. Nodo: TableHeader ===
export const TableHeader = Node.create({
  name: 'tableHeader',
  content: 'text*',
  tableRole: 'header_cell',
  isolating: true,

  parseHTML() {
    return [{ tag: 'th' }]
  },

  renderHTML() {
    return ['th', 0]
  },
})

// === 4. Nodo: TableCell ===
export const TableCell = Node.create({
  name: 'tableCell',
  content: 'text*',
  tableRole: 'cell',
  isolating: true,

  parseHTML() {
    return [{ tag: 'td' }]
  },

  renderHTML() {
    return ['td', 0]
  },
})
