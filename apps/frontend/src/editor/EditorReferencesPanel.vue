<!-- apps/frontend/src/editor/EditorReferencesPanel.vue -->
<template>
  <div class="references-panel">
    <div class="references-panel__header">
      <span><strong>Citas</strong></span>
      <button
        type="button"
        class="references-panel__close"
        @click="emit('close')"
      >
        ×
      </button>
    </div>

    <div class="references-panel__row">
      <label>
        Estilo de cita
        <select v-model="selectedStyle">
          <option
            v-for="style in citationStyles"
            :key="style"
            :value="style"
          >
            {{ style.toUpperCase() }}
          </option>
        </select>
      </label>
    </div>

    <div class="references-panel__row">
      <div class="references-panel__row-title">
        {{ editingRefId ? 'Editar referencia' : 'Nueva referencia rápida' }}
      </div>
      <label>
        Autor (Apellido, Nombre)
        <input
          v-model="newRefAuthor"
          placeholder="Pérez, Ana"
        />
      </label>
      <label>
        Año
        <input
          v-model="newRefYear"
          placeholder="2020"
        />
      </label>
      <label>
        Título
        <input
          v-model="newRefTitle"
          placeholder="Título de la obra"
        />
      </label>
      <div class="references-panel__new-actions">
        <button type="button" @click="handleAddQuickReference">
          {{ editingRefId ? 'Guardar cambios' : 'Agregar y citar' }}
        </button>
        <button
          v-if="editingRefId"
          type="button"
          class="references-panel__secondary"
          @click="handleCancelEdit"
        >
          Cancelar
        </button>
      </div>
    </div>

    <div class="references-panel__list">
      <div
        v-for="ref in references"
        :key="ref.id"
        class="references-panel__item"
      >
        <div class="references-panel__item-main">
          <div class="references-panel__item-title">
            {{ ref.title || '[Sin título]' }}
          </div>
          <div class="references-panel__item-meta">
            {{ primaryAuthorLabel(ref) }} ·
            {{ ref.issued?.year ?? 's. f.' }}
          </div>
        </div>
        <div class="references-panel__item-actions">
          <button
            type="button"
            @click="emitInsertCitation(ref.id)"
          >
            Citar
          </button>
          <button
            type="button"
            @click="startEditReference(ref)"
          >
            Editar
          </button>
          <button
            type="button"
            class="references-panel__delete"
            @click="deleteReference(ref.id)"
          >
            ✕
          </button>
        </div>
      </div>

      <p
        v-if="references.length === 0"
        class="references-panel__empty"
      >
        Aún no hay referencias. Crea una arriba.
      </p>
    </div>

    <!-- Import/Export BibTeX / CSL-JSON -->
    <div class="references-panel__import">
      <details>
        <summary>BibTeX / CSL-JSON</summary>
        <div class="references-panel__import-section">
          <label>
            BibTeX
            <textarea
              v-model="bibtexText"
              rows="4"
              spellcheck="false"
            ></textarea>
          </label>
          <div class="references-panel__import-actions">
            <button type="button" @click="handleImportBibtex">
              Importar BibTeX
            </button>
          </div>

          <label>
            CSL-JSON
            <textarea
              v-model="cslJsonText"
              rows="4"
              spellcheck="false"
            ></textarea>
          </label>
          <div class="references-panel__import-actions">
            <button type="button" @click="handleImportCslJson">
              Importar CSL-JSON
            </button>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  parseBibTeX,
  formatBibTeX,
  toCslJson,
  fromCslJson,
  createCitationManager,
} from '@disertare/editor-citations'
import type {
  Reference,
  PersonName,
  CitationStyleId,
} from '@disertare/editor-citations'

type CitationManager = ReturnType<typeof createCitationManager>

const props = defineProps<{
  citationManager: CitationManager
  currentCitationStyle: CitationStyleId
  citationStyles: CitationStyleId[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'references-changed'): void
  (e: 'insert-citation', refId: string): void
  (e: 'update:currentCitationStyle', value: CitationStyleId): void
}>()

const references = ref<Reference[]>([])
const newRefAuthor = ref('')
const newRefYear = ref('')
const newRefTitle = ref('')
const editingRefId = ref<string | null>(null)
const bibtexText = ref('')
const cslJsonText = ref('')

const selectedStyle = computed({
  get: () => props.currentCitationStyle,
  set: (value: CitationStyleId) => {
    emit('update:currentCitationStyle', value)
  },
})

function parsePersonName(input: string): PersonName | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const parts = trimmed.split(',')
  if (parts.length === 2) {
    const family = parts[0].trim()
    const given = parts[1].trim()
    return { family, given }
  }
  return { literal: trimmed }
}

function resetQuickForm(): void {
  newRefAuthor.value = ''
  newRefYear.value = ''
  newRefTitle.value = ''
}

function loadFromManager(): void {
  const refs = props.citationManager.listReferences()
  references.value = refs
  bibtexText.value = formatBibTeX(refs)
  cslJsonText.value = JSON.stringify(toCslJson(refs), null, 2)
}

function handleAddQuickReference(): void {
  const authorName = parsePersonName(newRefAuthor.value)
  const yearNum = parseInt(newRefYear.value, 10)
  const issued =
    Number.isFinite(yearNum) && !Number.isNaN(yearNum)
      ? { year: yearNum }
      : undefined

  // modo edición
  if (editingRefId.value) {
    const id = editingRefId.value
    props.citationManager.updateReference(id, {
      title: newRefTitle.value || 'Referencia sin título',
      author: authorName ? [authorName] : undefined,
      issued,
    })

    editingRefId.value = null
    resetQuickForm()
    loadFromManager()
    emit('references-changed')
    return
  }

  // modo alta rápida
  const ref = props.citationManager.addReference({
    type: 'article-journal',
    title: newRefTitle.value || 'Referencia sin título',
    author: authorName ? [authorName] : undefined,
    issued,
  })

  resetQuickForm()
  loadFromManager()
  emit('references-changed')

  // Insertar cita en el documento (TipTap) lo hace el padre
  emit('insert-citation', ref.id)
}

function handleCancelEdit(): void {
  editingRefId.value = null
  resetQuickForm()
}

function startEditReference(ref: Reference): void {
  editingRefId.value = ref.id
  newRefTitle.value = ref.title ?? ''

  const a = ref.author && ref.author[0]
  if (a?.family && a?.given) {
    newRefAuthor.value = `${a.family}, ${a.given}`
  } else if (a?.literal) {
    newRefAuthor.value = a.literal
  } else {
    newRefAuthor.value = a?.family ?? a?.given ?? ''
  }

  newRefYear.value =
    ref.issued && typeof ref.issued.year === 'number'
      ? String(ref.issued.year)
      : ''
}

function deleteReference(id: string): void {
  props.citationManager.removeReference(id)
  if (editingRefId.value === id) {
    editingRefId.value = null
    resetQuickForm()
  }
  loadFromManager()
  emit('references-changed')
}

function primaryAuthorLabel(ref: Reference): string {
  const a = ref.author && ref.author[0]
  if (!a) return 'Autor desconocido'
  if (a.family && a.given) return `${a.family}, ${a.given}`
  if (a.literal) return a.literal
  return a.family ?? a.given ?? 'Autor'
}

function handleImportBibtex(): void {
  try {
    const parsed = parseBibTeX(bibtexText.value)
    for (const ref of parsed) {
      const { id, ...rest } = ref
      props.citationManager.addReference({ ...rest, id })
    }
    loadFromManager()
    emit('references-changed')
  } catch (error) {
    console.error('[F2.3] Error al importar BibTeX:', error)
  }
}

function handleImportCslJson(): void {
  let data: unknown
  try {
    data = JSON.parse(cslJsonText.value)
  } catch (error) {
    console.error('[F2.3] CSL-JSON inválido:', error)
    return
  }

  const arr = Array.isArray(data) ? data : [data]
  const refs = fromCslJson(arr as any[])

  for (const ref of refs) {
    const { id, ...rest } = ref
    props.citationManager.addReference({ ...rest, id })
  }

  loadFromManager()
  emit('references-changed')
}

function emitInsertCitation(refId: string): void {
  emit('insert-citation', refId)
}

onMounted(() => {
  loadFromManager()
})
</script>

<style scoped>
.references-panel {
  position: fixed;
  right: 24px;
  bottom: 72px;
  width: 320px;
  max-height: 60vh;
  background: #ffffff;
  border-radius: 6px;
  box-shadow:
    0 0 0 1px #e0d6ff,
    0 10px 30px rgba(0, 0, 0, 0.15);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 50;
  font-size: 13px;
}

.references-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.references-panel__close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
  color: #6a5af9;
}

.references-panel__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.references-panel__row-title {
  font-size: 12px;
  font-weight: 600;
  color: #4b3f72;
}

.references-panel__row label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.references-panel__row input,
.references-panel__row select {
  border-radius: 4px;
  border: 1px solid #d3cfff;
  padding: 4px 6px;
  font-size: 13px;
}

.references-panel__new-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
}

.references-panel__new-actions button,
.references-panel__item button {
  border-radius: 4px;
  border: 1px solid #d3cfff;
  background: #f3ecff;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
}

.references-panel__secondary {
  background: #ffffff;
}

.references-panel__list {
  margin-top: 4px;
  border-top: 1px solid #f1ecff;
  padding-top: 4px;
  overflow-y: auto;
}

.references-panel__item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px dashed #f1ecff;
}

.references-panel__item-main {
  flex: 1;
  min-width: 0;
}

.references-panel__item-title {
  font-weight: 600;
  color: #3c366b;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.references-panel__item-meta {
  font-size: 11px;
  color: #6b6b8f;
}

.references-panel__item-actions {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.references-panel__delete {
  background: #ffecec;
  border-color: #ffc5c5;
  color: #c53030;
}

.references-panel__empty {
  font-size: 12px;
  color: #7a7399;
  margin: 4px 0 0;
}

/* Import/Export BibTeX / CSL */
.references-panel__import {
  margin-top: 6px;
  border-top: 1px solid #f1ecff;
  padding-top: 4px;
}

.references-panel__import summary {
  cursor: pointer;
  font-weight: 600;
  color: #4b3f72;
}

.references-panel__import-section {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.references-panel__import textarea {
  width: 100%;
  min-height: 60px;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  border-radius: 4px;
  border: 1px solid #d3cfff;
  padding: 4px 6px;
}

.references-panel__import-actions {
  display: flex;
  justify-content: flex-end;
}

.references-panel__import-actions button {
  border-radius: 4px;
  border: 1px solid #d3cfff;
  background: #f3ecff;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
}
</style>
