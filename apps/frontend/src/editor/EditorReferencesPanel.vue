<!-- apps/frontend/src/editor/EditorReferencesPanel.vue -->
<template>
  <div class="references-panel">
    <!-- Encabezado -->
    <div class="references-panel__header">
      <div class="references-panel__title">
        <span class="references-panel__title-main">Gestor de citas</span>
        <span class="references-panel__title-sub">Referencias y estilo</span>
      </div>

      <button
        type="button"
        class="references-panel__close"
        @click="emit('close')"
        aria-label="Cerrar gestor de citas"
      >
        ×
      </button>
    </div>

    <!-- Estilo de cita -->
    <div class="references-panel__row references-panel__row--style">
      <label>
        <span class="references-panel__label">Estilo de cita</span>
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

    <!-- Alta / edición rápida -->
    <div class="references-panel__row">
      <div class="references-panel__row-title">
        {{ editingRefId ? 'Editar referencia' : 'Nueva referencia rápida' }}
      </div>

      <label>
        <span class="references-panel__label">
          Autor (Apellido, Nombre o institución)
        </span>
        <input
          v-model="newRefAuthor"
          placeholder="Pérez, Ana / INEGI / Secretaría de Salud"
        />
      </label>

      <label>
        <span class="references-panel__label">Año</span>
        <input
          v-model="newRefYear"
          placeholder="2020"
        />
      </label>

      <label>
        <span class="references-panel__label">Título</span>
        <input
          v-model="newRefTitle"
          placeholder="Título de la obra / norma / ley / informe"
        />
      </label>

      <div class="references-panel__new-actions">
        <button
          type="button"
          class="references-panel__button references-panel__button--primary"
          @click="handleAddQuickReference"
        >
          {{ editingRefId ? 'Guardar cambios' : 'Agregar y citar' }}
        </button>

        <button
          v-if="editingRefId"
          type="button"
          class="references-panel__button references-panel__button--secondary"
          @click="handleCancelEdit"
        >
          Cancelar
        </button>
      </div>
    </div>

    <!-- Lista de referencias -->
    <div class="references-panel__list-container">
      <div class="references-panel__list-header">
        <span class="references-panel__list-title">Referencias guardadas</span>
        <span class="references-panel__list-count">
          {{ references.length }} referencia<span v-if="references.length !== 1">s</span>
        </span>
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
              class="references-panel__button references-panel__button--small"
              @click="emitInsertCitation(ref.id)"
            >
              Citar
            </button>
            <button
              type="button"
              class="references-panel__button references-panel__button--small"
              @click="startEditReference(ref)"
            >
              Editar
            </button>
            <button
              type="button"
              class="references-panel__button references-panel__button--delete"
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
          Aún no hay referencias. Crea una arriba o importa BibTeX / CSL-JSON.
        </p>
      </div>
    </div>

    <!-- Opciones de cita en texto (prefijo / páginas / sufijo) -->
    <div class="references-panel__row references-panel__row--citation-options">
      <div class="references-panel__row-title">
        Opciones de cita en texto
      </div>
      <div class="references-panel__options-grid">
        <label>
          <span class="references-panel__label">Prefijo</span>
          <input
            v-model="citationPrefix"
            placeholder="Ej.: véase"
          />
        </label>
        <label>
          <span class="references-panel__label">Páginas (locator)</span>
          <input
            v-model="citationLocator"
            placeholder="Ej.: 141-146"
          />
        </label>
        <label>
          <span class="references-panel__label">Sufijo</span>
          <input
            v-model="citationSuffix"
            placeholder="Texto después de la cita"
          />
        </label>
      </div>
      <p class="references-panel__hint">
        El campo de páginas se usa para generar citas como
        <code>(Autor, Año, pp. 141-146)</code>. En Vancouver se mostrará como
        <code>[n] (pp. 141-146)</code>.
      </p>
    </div>

    <!-- Import / Export BibTeX / CSL-JSON -->
    <div class="references-panel__import">
      <details>
        <summary>Importar BibTeX / CSL-JSON</summary>

        <div class="references-panel__import-section">
          <label>
            <span class="references-panel__label">BibTeX</span>
            <textarea
              v-model="bibtexText"
              rows="4"
              spellcheck="false"
            ></textarea>
          </label>
          <div class="references-panel__import-actions">
            <button
              type="button"
              class="references-panel__button references-panel__button--primary"
              @click="handleImportBibtex"
            >
              Importar BibTeX
            </button>
          </div>

          <label>
            <span class="references-panel__label">CSL-JSON</span>
            <textarea
              v-model="cslJsonText"
              rows="4"
              spellcheck="false"
            ></textarea>
          </label>
          <div class="references-panel__import-actions">
            <button
              type="button"
              class="references-panel__button references-panel__button--primary"
              @click="handleImportCslJson"
            >
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
  (e: 'insert-citation', payload: {
    refId: string
    locator?: string
    prefix?: string
    suffix?: string
  }): void
  (e: 'update:currentCitationStyle', value: CitationStyleId): void
}>()

const references = ref<Reference[]>([])
const newRefAuthor = ref('')
const newRefYear = ref('')
const newRefTitle = ref('')
const editingRefId = ref<string | null>(null)
const bibtexText = ref('')
const cslJsonText = ref('')

const citationPrefix = ref('')
const citationLocator = ref('')
const citationSuffix = ref('')

const selectedStyle = computed<CitationStyleId>({
  get: () => props.currentCitationStyle,
  set: (value: CitationStyleId) => {
    emit('update:currentCitationStyle', value)
  },
})

function stripTrailingDots(value: string): string {
  return value.replace(/[.]+$/g, '')
}

function normalizeTitle(title: string): string {
  return stripTrailingDots(title.trim())
}

function parsePersonName(input: string): PersonName | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Para instituciones o leyes, usamos literal.
  if (!trimmed.includes(',')) {
    return { literal: stripTrailingDots(trimmed) }
  }

  const [familyRaw, givenRaw = ''] = trimmed.split(',', 2)
  const family = stripTrailingDots(familyRaw.trim())
  const given = stripTrailingDots(givenRaw.trim())

  if (!family && !given) return null
  if (!given) return { family }
  return { family, given }
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

  const normalizedTitle =
    newRefTitle.value.trim() !== ''
      ? normalizeTitle(newRefTitle.value)
      : 'Referencia sin título'

  // Modo edición
  if (editingRefId.value) {
    const id = editingRefId.value
    props.citationManager.updateReference(id, {
      title: normalizedTitle,
      author: authorName ? [authorName] : undefined,
      issued,
    })

    editingRefId.value = null
    resetQuickForm()
    loadFromManager()
    emit('references-changed')
    return
  }

  // Alta rápida
  const ref = props.citationManager.addReference({
    type: 'article-journal',
    title: normalizedTitle,
    author: authorName ? [authorName] : undefined,
    issued,
  })

  resetQuickForm()
  loadFromManager()
  emit('references-changed')

  // Insertar cita con las opciones actuales (prefijo/páginas/sufijo)
  emit('insert-citation', {
    refId: ref.id,
    locator: citationLocator.value || undefined,
    prefix: citationPrefix.value || undefined,
    suffix: citationSuffix.value || undefined,
  })
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
  emit('insert-citation', {
    refId,
    locator: citationLocator.value || undefined,
    prefix: citationPrefix.value || undefined,
    suffix: citationSuffix.value || undefined,
  })
}

onMounted(() => {
  loadFromManager()
})
</script>

<style scoped>
.references-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e0d6ff;
  box-shadow:
    0 0 0 1px #f4f0ff,
    0 8px 24px rgba(15, 23, 42, 0.08);
  font-size: 13px;
  color: #1f2933;
  /* Mantener el panel siempre dentro de la ventana, sobre el footer */
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}

/* Header */
.references-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.references-panel__title {
  display: flex;
  flex-direction: column;
}

.references-panel__title-main {
  font-weight: 700;
  font-size: 14px;
  color: #312e81;
}

.references-panel__title-sub {
  font-size: 11px;
  color: #6b7280;
}

.references-panel__close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0 4px;
  color: #6a5af9;
}

/* Rows */
.references-panel__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px solid #f3f0ff;
}

.references-panel__row--style {
  padding-top: 0;
}

.references-panel__row--citation-options {
  background: #faf9ff;
  border-radius: 8px;
  padding: 8px;
  border: 1px dashed #e0d6ff;
}

.references-panel__row-title {
  font-size: 12px;
  font-weight: 600;
  color: #4b3f72;
  margin-bottom: 4px;
}

.references-panel__label {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
}

.references-panel__row label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.references-panel__row input,
.references-panel__row select {
  border-radius: 6px;
  border: 1px solid #d3cfff;
  padding: 4px 6px;
  font-size: 13px;
}

.references-panel__options-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 4px;
}

.references-panel__hint {
  font-size: 11px;
  color: #6b7280;
}

/* Botones */
.references-panel__button {
  border-radius: 999px;
  border: 1px solid #d3cfff;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1.2;
  background: #f3ecff;
  color: #4338ca;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.05s ease;
}

.references-panel__button--primary {
  background: #4f46e5;
  border-color: #4338ca;
  color: #f9fafb;
}

.references-panel__button--primary:hover {
  background: #4338ca;
  border-color: #3730a3;
  box-shadow: 0 2px 6px rgba(55, 48, 163, 0.35);
}

.references-panel__button--secondary {
  background: #ffffff;
  color: #4b3f72;
}

.references-panel__button--secondary:hover {
  background: #f9f5ff;
}

.references-panel__button--small {
  padding: 3px 8px;
}

.references-panel__button--delete {
  background: #ffecec;
  border-color: #ffc5c5;
  color: #c53030;
}

.references-panel__button--delete:hover {
  background: #fed7d7;
}

.references-panel__new-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
}

/* Lista de referencias */
.references-panel__list-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.references-panel__list-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 11px;
  color: #6b7280;
}

.references-panel__list-title {
  font-weight: 600;
  color: #4b3f72;
}

.references-panel__list-count {
  font-style: italic;
}

.references-panel__list {
  max-height: 220px;
  overflow-y: auto;
  padding-right: 2px;
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

/* Estado vacío */
.references-panel__empty {
  font-size: 12px;
  color: #7a7399;
  margin: 4px 0 0;
}

/* Import / Export */
.references-panel__import {
  margin-top: 4px;
  border-top: 1px solid #f1ecff;
  padding-top: 4px;
}

.references-panel__import summary {
  cursor: pointer;
  font-weight: 600;
  color: #4b3f72;
  font-size: 12px;
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
</style>
