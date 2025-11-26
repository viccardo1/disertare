<!-- apps/frontend/src/editor/EditorBioPanel.vue -->
<template>
  <aside
    class="bio-panel"
    role="complementary"
    aria-label="Secuencias biológicas (F2.8)"
  >
    <!-- Header -->
    <header class="bio-panel__header">
      <div class="bio-panel__title-block">
        <h2 class="bio-panel__title">
          Secuencias biológicas
          <span class="bio-panel__phase">(F2.8)</span>
        </h2>
        <p class="bio-panel__subtitle">
          Inserta una secuencia DNA/RNA/proteína directamente en el documento y
          obtén un análisis didáctico básico (longitud, GC, ORFs, motivos y
          transformaciones).
        </p>
      </div>
    </header>

    <!-- Formulario principal -->
    <section class="bio-panel__section">
      <h3 class="bio-panel__section-title">Entrada de secuencia</h3>

      <div class="bio-panel__field-row">
        <label class="bio-panel__field">
          <span class="bio-panel__label">Etiqueta (opcional)</span>
          <input
            v-model="label"
            type="text"
            class="bio-panel__input"
            placeholder="Ej. Secuencia promotora P1"
          />
        </label>

        <label class="bio-panel__field bio-panel__field--kind">
          <span class="bio-panel__label">Tipo de secuencia</span>
          <select v-model="kind" class="bio-panel__select">
            <option value="dna">DNA</option>
            <option value="rna">RNA</option>
            <option value="protein">Proteína</option>
          </select>
        </label>
      </div>

      <label class="bio-panel__field">
        <span class="bio-panel__label">
          Secuencia
          <span class="bio-panel__label-hint">
            (admite espacios y saltos de línea; se limpiará automáticamente)
          </span>
        </span>
        <textarea
          v-model="sequence"
          class="bio-panel__textarea"
          rows="5"
          placeholder="Ej. ATGCGTGA..."
        />
      </label>

      <label class="bio-panel__field">
        <span class="bio-panel__label">
          Motivos a buscar (opcional)
          <span class="bio-panel__label-hint">
            Escribe motivos separados por espacios o comas (ej. TATA ATG GAATTC).
          </span>
        </span>
        <input
          v-model="motifsText"
          type="text"
          class="bio-panel__input"
          placeholder="Ej. TATA ATG GAATTC"
        />
      </label>

      <div class="bio-panel__actions">
        <button
          type="button"
          class="bio-panel__btn bio-panel__btn--primary"
          :disabled="!hasSequence"
          @click="runAnalysis"
        >
          Analizar secuencia
        </button>

        <button
          type="button"
          class="bio-panel__btn"
          :disabled="!hasSequence || !canInsertBio"
          @click="handleInsert"
        >
          Insertar en el documento
        </button>

        <button
          type="button"
          class="bio-panel__btn bio-panel__btn--ghost"
          @click="reset"
        >
          Limpiar
        </button>
      </div>

      <p class="bio-panel__hint">
        El botón <strong>Insertar en el documento</strong> se habilita cuando
        hay una secuencia válida y el editor está listo. Se insertará un bloque
        <code>bioSequence</code> que podrás editar desde el propio documento.
      </p>
    </section>

    <!-- Análisis básico -->
    <section class="bio-panel__section">
      <h3 class="bio-panel__section-title">Análisis básico</h3>

      <div v-if="analysis" class="bio-panel__grid">
        <div class="bio-panel__card">
          <h4 class="bio-panel__card-title">Resumen</h4>
          <p class="bio-panel__stat">
            Longitud original:
            <strong>{{ analysis.rawLength }}</strong>
            caracteres
          </p>
          <p class="bio-panel__stat">
            Longitud limpia:
            <strong>{{ analysis.cleanedLength }}</strong>
            símbolos
          </p>
          <p class="bio-panel__stat">
            GC% aproximado:
            <strong>{{ analysis.gcPercent.toFixed(1) }} %</strong>
          </p>
        </div>

        <div class="bio-panel__card">
          <h4 class="bio-panel__card-title">Conteo de símbolos</h4>
          <ul class="bio-panel__stats-list">
            <li>A: {{ analysis.counts.A }}</li>
            <li>C: {{ analysis.counts.C }}</li>
            <li>G: {{ analysis.counts.G }}</li>
            <li>T: {{ analysis.counts.T }}</li>
            <li v-if="analysis.counts.U > 0">U: {{ analysis.counts.U }}</li>
            <li v-if="analysis.counts.other > 0">
              Otros: {{ analysis.counts.other }}
            </li>
          </ul>
        </div>

        <div class="bio-panel__card">
          <h4 class="bio-panel__card-title">ORFs (forward)</h4>
          <p v-if="!analysis.orfs.length" class="bio-panel__empty">
            No se detectaron ORFs forward en los tres marcos de lectura.
          </p>
          <ul v-else class="bio-panel__orfs-list">
            <li v-for="orf in analysis.orfs" :key="`${orf.frame}-${orf.start}`">
              Marco {{ orf.frame }} · inicio {{ orf.start + 1 }} · fin
              {{ orf.end + 1 }} · longitud {{ orf.length }} bases
            </li>
          </ul>
        </div>

        <div class="bio-panel__card">
          <h4 class="bio-panel__card-title">Motivos encontrados</h4>
          <p v-if="!analysis.motifs.length" class="bio-panel__empty">
            No se encontraron motivos con la lista actual.
          </p>
          <ul v-else class="bio-panel__motifs-list">
            <li v-for="motif in analysis.motifs" :key="motif.motif">
              <code>{{ motif.motif }}</code>
              — posiciones:
              <span>{{ motif.positions.map((p) => p + 1).join(', ') }}</span>
            </li>
          </ul>
        </div>
      </div>

      <p v-else class="bio-panel__empty">
        Introduce una secuencia y pulsa
        <strong>Analizar secuencia</strong> para ver el resumen.
      </p>
    </section>

    <!-- Transformaciones -->
    <section class="bio-panel__section" v-if="analysis">
      <h3 class="bio-panel__section-title">Transformaciones</h3>

      <div class="bio-panel__transform-grid">
        <label class="bio-panel__field">
          <span class="bio-panel__label">Complementaria</span>
          <textarea
            class="bio-panel__textarea bio-panel__textarea--small"
            readonly
            :value="analysis.complement"
          />
        </label>

        <label class="bio-panel__field">
          <span class="bio-panel__label">Reversa</span>
          <textarea
            class="bio-panel__textarea bio-panel__textarea--small"
            readonly
            :value="analysis.reverse"
          />
        </label>

        <label class="bio-panel__field">
          <span class="bio-panel__label">Reversa complementaria</span>
          <textarea
            class="bio-panel__textarea bio-panel__textarea--small"
            readonly
            :value="analysis.reverseComplement"
          />
        </label>
      </div>
    </section>

    <!-- Alineamiento didáctico -->
    <section class="bio-panel__section">
      <h3 class="bio-panel__section-title">
        Alineamiento didáctico (identidad aproximada)
      </h3>

      <label class="bio-panel__field">
        <span class="bio-panel__label">
          Segunda secuencia (para alinear)
          <span class="bio-panel__label-hint">
            Se usa un alineamiento muy simple de identidad posición a posición.
          </span>
        </span>
        <textarea
          v-model="alignmentSeq2"
          class="bio-panel__textarea"
          rows="4"
          placeholder="Introduce una segunda secuencia para comparar."
        />
      </label>

      <div class="bio-panel__actions">
        <button
          type="button"
          class="bio-panel__btn"
          :disabled="!hasAlignmentInput"
          @click="runAlignment"
        >
          Calcular identidad
        </button>
      </div>

      <p v-if="alignmentError" class="bio-panel__error">
        {{ alignmentError }}
      </p>

      <div v-if="alignmentResult" class="bio-panel__alignment-block">
        <pre class="bio-panel__alignment-pre">{{ alignmentResult }}</pre>
        <p v-if="alignmentInsights" class="bio-panel__alignment-insights">
          {{ alignmentInsights }}
        </p>
      </div>
    </section>

    <!-- Mensajes educativos -->
    <section class="bio-panel__section" v-if="analysis && analysis.messages.length">
      <h3 class="bio-panel__section-title">Notas educativas</h3>
      <ul class="bio-panel__tips-list">
        <li v-for="(msg, idx) in analysis.messages" :key="idx">
          {{ msg }}
        </li>
      </ul>
    </section>

    <!-- Pruebas sugeridas -->
    <section class="bio-panel__section bio-panel__section--tips">
      <h3 class="bio-panel__section-title">Pruebas sugeridas (F2.8)</h3>
      <ul class="bio-panel__tips-list">
        <li>
          Inserta la secuencia
          <code>ATGCGTGA</code>
          como DNA, analiza y verifica el GC%.
        </li>
        <li>
          Busca el motivo <code>ATG</code> y comprueba las posiciones
          detectadas.
        </li>
        <li>
          Inserta la secuencia en el documento y confirma que aparece el bloque
          <code>bioSequence</code>.
        </li>
        <li>
          Escribe una segunda secuencia parecida y calcula la identidad
          aproximada.
        </li>
      </ul>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { useEditorBio } from './composables/useEditorBio'

const props = defineProps<{
  editor: Editor | null
  onClose?: () => void
}>()

const {
  kind,
  label,
  sequence,
  motifsText,
  analysis,
  hasSequence,
  canInsertBio,
  runAnalysis,
  reset,
  insertBioSequence,
  alignmentSeq2,
  alignmentResult,
  alignmentInsights,
  alignmentError,
  hasAlignmentInput,
  runAlignment,
} = useEditorBio(() => props.editor)

function handleInsert() {
  insertBioSequence()
  if (props.onClose) {
    props.onClose()
  }
}
</script>

<style scoped>
.bio-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 14px 16px;
  background: #faf5ff;
  border-radius: 12px;
  box-shadow:
    0 0 0 1px #ede9fe,
    0 8px 24px rgba(15, 23, 42, 0.06);
  font-size: 13px;
  color: #111827;
}

.bio-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.bio-panel__title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bio-panel__title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.bio-panel__phase {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #6d28d9;
}

.bio-panel__subtitle {
  font-size: 12px;
  color: #4b5563;
}

.bio-panel__section {
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
}

.bio-panel__section--tips {
  padding-bottom: 4px;
}

.bio-panel__section-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.bio-panel__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.bio-panel__field-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.bio-panel__field--kind {
  max-width: 150px;
}

.bio-panel__label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.bio-panel__label-hint {
  margin-left: 4px;
  font-size: 11px;
  font-weight: 400;
  color: #6b7280;
}

.bio-panel__input,
.bio-panel__select,
.bio-panel__textarea {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
  font-size: 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  color: #111827;
  background-color: #ffffff;
}

.bio-panel__textarea {
  resize: vertical;
  min-height: 72px;
}

.bio-panel__textarea--small {
  min-height: 40px;
  max-height: 90px;
}

.bio-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 6px;
}

.bio-panel__btn {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  background: #f9fafb;
  color: #111827;
  cursor: pointer;
  transition:
    background-color 0.12s ease-out,
    box-shadow 0.12s ease-out,
    transform 0.12s ease-out,
    border-color 0.12s ease-out;
}

.bio-panel__btn--primary {
  background: #4f46e5;
  border-color: #4338ca;
  color: #ffffff;
}

.bio-panel__btn--ghost {
  background: transparent;
}

.bio-panel__btn:disabled {
  opacity: 0.4;
  cursor: default;
  box-shadow: none;
  transform: none;
}

.bio-panel__btn:not(:disabled):hover {
  box-shadow:
    0 0 0 1px rgba(79, 70, 229, 0.08),
    0 8px 18px rgba(79, 70, 229, 0.09);
  transform: translateY(-0.5px);
}

.bio-panel__hint {
  margin: 0;
  font-size: 11px;
  color: #6b7280;
}

.bio-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}

.bio-panel__card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 8px;
  background: #ffffff;
}

.bio-panel__card-title {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.bio-panel__stat {
  margin: 0 0 2px;
  font-size: 11px;
  color: #374151;
}

.bio-panel__stats-list,
.bio-panel__orfs-list,
.bio-panel__motifs-list,
.bio-panel__tips-list {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
  color: #374151;
}

.bio-panel__empty {
  margin: 0;
  font-size: 11px;
  color: #9ca3af;
}

.bio-panel__transform-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.bio-panel__error {
  margin: 0;
  font-size: 11px;
  color: #b91c1c;
}

.bio-panel__alignment-block {
  margin-top: 6px;
}

.bio-panel__alignment-pre {
  margin: 0 0 4px;
  padding: 6px 8px;
  border-radius: 8px;
  background: #111827;
  color: #f9fafb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  overflow-x: auto;
}

.bio-panel__alignment-insights {
  margin: 0;
  font-size: 11px;
  color: #374151;
}

.bio-panel__tips-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #6b7280;
}

.bio-panel__tips-list code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  background: #f3f4ff;
  padding: 1px 4px;
  border-radius: 3px;
}
</style>
