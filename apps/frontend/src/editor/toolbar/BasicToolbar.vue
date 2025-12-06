<!--
╔══════════════════════════════════════════════════════════════════╗
║  D  DISERTARE                                                    ║
║  Plataforma avanzada de edición técnica, científica y            ║
║  multidisciplinaria.                                             ║
║                                                                  ║
║  © 2025 Disertare Project — Licencia Privativa.                  ║
║  Todos los derechos reservados.                                  ║
╚══════════════════════════════════════════════════════════════════╝
-->

<template>
  <div class="dsr-toolbar">
    <button type="button" @click="exec('toggleBold')"><b>B</b></button>
    <button type="button" @click="exec('toggleItalic')"><i>I</i></button>
    <button type="button" @click="exec('toggleHeading', { level: 2 })">H2</button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  editor: any
}>()

function exec(cmd: string, args?: any) {
  const e = props.editor
  if (!e) return

  const chain = e.chain().focus()

  if (args !== undefined) {
    chain[cmd](args).run()
  } else {
    chain[cmd]().run()
  }
}
</script>

<style scoped>
.dsr-toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.4rem;
  background: #f3f3f3;
  border-bottom: 1px solid #ddd;
}
</style>
