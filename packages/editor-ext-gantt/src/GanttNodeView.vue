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

<!-- packages/editor-ext-gantt/src/GanttNodeView.vue -->
<template>
  <NodeViewWrapper class="gantt-node" :data-mode="mode">
    <!-- Cabecera / título -->
    <header class="gantt-header">
      <span class="gantt-badge">GANTT</span>
      <div class="gantt-title-group">
        <div class="gantt-title">
          {{ t('editor.ext.gantt.default_title') }}
        </div>
        <div class="gantt-subtitle">
          {{ t('editor.ext.gantt.subtitle') }}
        </div>
      </div>
    </header>

    <!-- Barra de controles -->
    <div class="gantt-toolbar">
      <label class="gantt-mode-select">
        <span>{{ t('editor.ext.gantt.mode_label') }}</span>
        <select v-model="mode">
          <option value="gantt">Gantt</option>
          <option value="kanban">Kanban</option>
        </select>
      </label>

      <textarea
        v-model="rawData"
        class="gantt-data-input"
        :placeholder="t('editor.ext.gantt.placeholder')"
      ></textarea>
    </div>

    <!-- Vista Gantt -->
    <div v-if="mode === 'gantt'" class="gantt-chart">
      <div v-if="parsedTasks.length === 0" class="gantt-empty">
        {{ t('editor.ext.gantt.empty_hint') }}
      </div>

      <div
        v-else
        class="gantt-track"
        @click.stop="selectNode"
      >
        <!-- Grid de fondo -->
        <div class="gantt-grid">
          <div
            v-for="day in totalDays"
            :key="'grid-' + day"
            class="gantt-grid-column"
          ></div>
        </div>

        <!-- Barras de tareas -->
        <div
          v-for="task in parsedTasks"
          :key="task.id"
          class="gantt-task-row"
        >
          <div class="gantt-task-label">
            {{ task.label }}
          </div>

          <div class="gantt-task-bar-wrapper">
            <div
              class="gantt-task-bar"
              :style="{
                left: taskLeft(task) + '%',
                width: taskWidth(task) + '%',
              }"
            >
              <span class="gantt-task-bar-text">
                {{ task.duration }}d
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista Kanban -->
    <div v-else class="kanban-board" @click.stop="selectNode">
      <div
        v-for="column in kanbanColumns"
        :key="column.id"
        class="kanban-column"
      >
        <div class="kanban-column-header">
          {{ column.name }}
        </div>

        <div class="kanban-column-body">
          <div
            v-for="task in column.tasks"
            :key="task.id"
            class="kanban-card"
          >
            <div class="kanban-card-title">{{ task.title }}</div>
            <div v-if="task.date" class="kanban-card-date">
              {{ task.date }}
            </div>
          </div>

          <div v-if="column.tasks.length === 0" class="kanban-empty">
            {{ t('editor.ext.gantt.kanban_empty') }}
          </div>
        </div>
      </div>
    </div>

    <footer class="gantt-footer">
      <span class="gantt-footer-hint">
        {{ t('editor.ext.gantt.footer_hint') }}
      </span>
    </footer>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

// i18n placeholder
const t = (key: string) => key

// --- Estado básico ---
const mode = ref<'gantt' | 'kanban'>(
  (props.node.attrs.mode as 'gantt' | 'kanban') ?? 'gantt',
)

const DEFAULT_DATA =
  'Tarea A,2025-11-10,5\n' +
  'Tarea B,2025-11-15,3\n' +
  'Tarea C,2025-11-18,4'

const rawData = ref<string>(props.node.attrs.content ?? DEFAULT_DATA)

type GanttTask = {
  id: string
  label: string
  start: Date
  duration: number
}

type KanbanTask = {
  id: string
  title: string
  date?: string
}

type KanbanColumn = {
  id: string
  name: string
  tasks: KanbanTask[]
}

const parsedTasks = ref<GanttTask[]>([])

const kanbanColumns = ref<KanbanColumn[]>([
  { id: 'todo', name: 'Por hacer', tasks: [] },
  { id: 'doing', name: 'En progreso', tasks: [] },
  { id: 'done', name: 'Hecho', tasks: [] },
])

// --- Parsing de datos ---
const parseData = () => {
  const lines = rawData.value
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const tasks: GanttTask[] = []
  lines.forEach((line, index) => {
    const [labelRaw, dateRaw, durationRaw] = line.split(',').map(p => p?.trim() ?? '')
    const label = labelRaw || `Task ${index + 1}`

    let start = new Date()
    if (dateRaw) {
      const d = new Date(dateRaw)
      if (!Number.isNaN(d.getTime())) {
        start = d
      }
    }

    const duration = Number(durationRaw || '1') || 1

    tasks.push({
      id: `task-${index}`,
      label,
      start,
      duration,
    })
  })

  parsedTasks.value = tasks

  // Rellenar Kanban de forma muy sencilla: todas las tareas en "Por hacer"
  kanbanColumns.value[0].tasks = tasks.map(t => ({
    id: t.id,
    title: t.label,
    date: t.start.toISOString().slice(0, 10),
  }))
  kanbanColumns.value[1].tasks = []
  kanbanColumns.value[2].tasks = []
}

// --- Cálculos para el Gantt ---
const minDate = computed(() => {
  if (!parsedTasks.value.length) return new Date()
  return parsedTasks.value.reduce(
    (min, t) => (t.start < min ? t.start : min),
    parsedTasks.value[0].start,
  )
})

const maxDate = computed(() => {
  if (!parsedTasks.value.length) return new Date()
  return parsedTasks.value.reduce((max, t) => {
    const end = new Date(t.start.getTime() + t.duration * 24 * 60 * 60 * 1000)
    return end > max ? end : max
  }, parsedTasks.value[0].start)
})

const totalDays = computed(() => {
  const diffMs = maxDate.value.getTime() - minDate.value.getTime()
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000)) || 1
  return days
})

const taskLeft = (task: GanttTask) => {
  const diffMs = task.start.getTime() - minDate.value.getTime()
  const daysFromStart = diffMs / (24 * 60 * 60 * 1000)
  const ratio = daysFromStart / totalDays.value
  return Math.max(0, Math.min(100, ratio * 100))
}

const taskWidth = (task: GanttTask) => {
  const ratio = task.duration / totalDays.value
  return Math.max(5, Math.min(100, ratio * 100))
}

// --- Sincronización con TipTap ---
const syncAttrs = () => {
  props.updateAttributes({
    mode: mode.value,
    content: rawData.value,
  })
}

// Seleccionar el nodo completo al hacer clic en el área principal
const selectNode = () => {
  try {
    props.editor.commands.setNodeSelection(props.getPos() as number)
  } catch {
    // no-op en caso de que getPos no esté disponible
  }
}

onMounted(() => {
  parseData()
  syncAttrs()
})

// Cuando cambian los datos o el modo, volvemos a parsear y sincronizar attrs
watch([rawData, mode], () => {
  parseData()
  syncAttrs()
})
</script>

<style scoped>
.gantt-node {
  margin: 1rem 0;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(106, 90, 249, 0.25);
  background: #fbf9ff;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
}

/* Header */
.gantt-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.gantt-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  background: #f1ecff;
  color: #5b48f0;
}

.gantt-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gantt-title {
  font-weight: 600;
}

.gantt-subtitle {
  font-size: 11px;
  color: #666;
}

/* Toolbar */
.gantt-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.gantt-mode-select {
  display: flex;
  align-items: center;
  gap: 4px;
}

.gantt-mode-select select {
  padding: 2px 4px;
  font-size: 12px;
}

.gantt-data-input {
  flex: 1;
  min-height: 60px;
  padding: 4px 6px;
  font-size: 12px;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, 'Liberation Mono', 'Courier New', monospace;
  border-radius: 4px;
  border: 1px solid #d4cef7;
  resize: vertical;
}

/* Gantt view */
.gantt-chart {
  position: relative;
  padding: 8px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e2dcff;
}

.gantt-empty {
  font-size: 12px;
  color: #777;
  font-style: italic;
}

.gantt-track {
  position: relative;
  overflow-x: auto;
}

.gantt-grid {
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
}

.gantt-grid-column {
  flex: 1;
  border-right: 1px dashed rgba(148, 131, 255, 0.25);
}

.gantt-task-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-block: 4px;
}

.gantt-task-label {
  min-width: 120px;
  max-width: 160px;
  font-size: 12px;
  color: #333;
}

.gantt-task-bar-wrapper {
  position: relative;
  flex: 1;
  height: 20px;
}

.gantt-task-bar {
  position: absolute;
  top: 2px;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, #a394ff, #6a5af9);
  display: flex;
  align-items: center;
  padding-inline: 6px;
  color: #fff;
  font-size: 11px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(31, 22, 86, 0.3);
}

.gantt-task-bar-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Kanban view */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.kanban-column {
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e2dcff;
  display: flex;
  flex-direction: column;
  max-height: 260px;
}

.kanban-column-header {
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 600;
  background: #f4f0ff;
  border-bottom: 1px solid #e2dcff;
}

.kanban-column-body {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.kanban-card {
  padding: 4px 6px;
  border-radius: 4px;
  background: #f7f4ff;
  border: 1px solid #ddd4ff;
}

.kanban-card-title {
  font-size: 12px;
  font-weight: 500;
}

.kanban-card-date {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.kanban-empty {
  font-size: 11px;
  color: #888;
  font-style: italic;
}

/* Footer */
.gantt-footer {
  margin-top: 6px;
  font-size: 11px;
  color: #777;
}

.gantt-footer-hint {
  font-style: italic;
}
</style>
