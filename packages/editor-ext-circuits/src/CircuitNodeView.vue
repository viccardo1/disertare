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

<!-- packages/editor-ext-circuits/src/CircuitNodeView.vue -->
<template>
  <NodeViewWrapper
    class="dsr-circuit-node"
    :class="{ 'dsr-circuit-node--selected': selected }"
    role="group"
    aria-label="Bloque de circuito (F2.9)"
    contenteditable="false"
  >
    <div class="dsr-circuit-card" @click.stop="selectNode">
      <!-- Header -->
      <header class="dsr-circuit-card__header">
        <div class="dsr-circuit-card__title-block">
          <span class="dsr-circuit-card__badge">CIRCUITO</span>
          <input
            v-model="localLabel"
            class="dsr-circuit-card__title-input"
            type="text"
            :placeholder="defaultLabelPlaceholder"
            @blur="syncLabel"
          />
        </div>
      </header>

      <!-- Body -->
      <section class="dsr-circuit-card__body">
        <div class="dsr-circuit-card__notation">
          <label class="dsr-circuit-card__field-label">
            Notación / descripción
          </label>
          <textarea
            v-model="localNotation"
            class="dsr-circuit-card__textarea"
            rows="3"
            placeholder="Ej.: Divisor resistivo R1‖R2, entrada Vin, salida Vout…"
            @blur="syncNotation"
          />
        </div>

        <div class="dsr-circuit-card__notes">
          <label class="dsr-circuit-card__field-label">
            Notas didácticas
          </label>
          <textarea
            v-model="localNotes"
            class="dsr-circuit-card__textarea dsr-circuit-card__textarea--notes"
            rows="3"
            placeholder="Explica aquí el objetivo del circuito, supuestos, advertencias, etc."
            @blur="syncNotes"
          />
        </div>
      </section>

      <!-- Footer (F2.9: sólo texto resumen) -->
      <footer class="dsr-circuit-card__footer">
        <p class="dsr-circuit-card__hint">
          Este bloque guarda el circuito en el documento.
          En fases posteriores se podrá vincular a simuladores o vistas IEC/ANSI avanzadas.
        </p>
      </footer>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const localLabel = ref<string>(props.node.attrs.label || '')
const localNotation = ref<string>(props.node.attrs.notation || '')
const localNotes = ref<string>(props.node.attrs.notes || '')

const defaultLabelPlaceholder = computed(
  () => 'Circuito sin título',
)

function syncLabel() {
  props.updateAttributes({ label: localLabel.value || null })
}

function syncNotation() {
  props.updateAttributes({ notation: localNotation.value })
}

function syncNotes() {
  props.updateAttributes({ notes: localNotes.value })
}

// Mantener reactivo si el documento cambia desde fuera
watch(
  () => props.node.attrs.label,
  (value) => {
    if (value !== localLabel.value) {
      localLabel.value = value || ''
    }
  },
)

watch(
  () => props.node.attrs.notation,
  (value) => {
    if (value !== localNotation.value) {
      localNotation.value = value || ''
    }
  },
)

watch(
  () => props.node.attrs.notes,
  (value) => {
    if (value !== localNotes.value) {
      localNotes.value = value || ''
    }
  },
)

function selectNode() {
  // Permite seleccionar el nodo completo al hacer clic en la tarjeta
  props.editor?.chain().setNodeSelection(props.getPos()).run()
}
</script>

<style scoped>
.dsr-circuit-node {
  margin: 0.75rem 0;
  /* Nos aseguramos de que el wrapper no tenga borde propio */
  border: none;
  outline: none;
}

.dsr-circuit-card {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 0.75rem 0.9rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dsr-circuit-node--selected .dsr-circuit-card {
  border-color: #4b3f72;
  box-shadow: 0 0 0 1px rgba(75, 63, 114, 0.35);
}

.dsr-circuit-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dsr-circuit-card__title-block {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dsr-circuit-card__badge {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: #ede9fe;
  color: #4c1d95;
}

.dsr-circuit-card__title-input {
  border: none;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  min-width: 0;
}

.dsr-circuit-card__title-input::placeholder {
  color: #9ca3af;
}

.dsr-circuit-card__title-input:focus {
  outline: none;
}

.dsr-circuit-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dsr-circuit-card__field-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.dsr-circuit-card__textarea {
  width: 100%;
  border-radius: 0.4rem;
  border: 1px solid #e5e7eb;
  padding: 0.4rem 0.5rem;
  font-size: 0.82rem;
  font-family: inherit;
  resize: vertical;
  min-height: 2.6rem;
}

.dsr-circuit-card__textarea--notes {
  min-height: 3.1rem;
}

.dsr-circuit-card__textarea:focus {
  outline: none;
  border-color: #4b3f72;
  box-shadow: 0 0 0 1px rgba(75, 63, 114, 0.22);
}

.dsr-circuit-card__footer {
  margin-top: 0.25rem;
}

.dsr-circuit-card__hint {
  font-size: 0.72rem;
  color: #6b7280;
}
</style>
