import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { GanttNodeView } from './GanttNodeView'

export interface GanttOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gantt: {
      /**
       * Inserta un diagrama Gantt o tablero Kanban editable
       */
      setGantt: (attrs?: { mode?: 'gantt' | 'kanban'; content?: string }) => ReturnType
    }
  }
}

export const Gantt = Node.create<GanttOptions>({
  name: 'gantt',
  group: 'block',
  content: 'text*',
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      mode: {
        default: 'gantt',
        parseHTML: element => element.getAttribute('data-mode') || 'gantt',
        renderHTML: attributes => {
          return { 'data-mode': attributes.mode }
        },
      },
      content: {
        default: 'Tarea A,2025-11-10,5\nTarea B,2025-11-12,3',
        parseHTML: element => element.getAttribute('data-content'),
        renderHTML: attributes => {
          return { 'data-content': attributes.content }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-gantt]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-gantt': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setGantt:
        attrs =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                mode: attrs?.mode ?? 'gantt',
                content: attrs?.content ?? 'Tarea A,2025-11-10,5\nTarea B,2025-11-12,3',
              },
            })
            .run()
        },
    }
  },

  addNodeView() {
    return GanttNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('ganttPasteHandler'),
        props: {
          // Opcional: detectar listas de tareas en portapapeles
        },
      }),
    ]
  },
})
