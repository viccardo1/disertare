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
  <div class="dsr-editor-host">
    <BasicToolbar :editor="editor" />
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { useEditorShell } from './useEditorShell'
import BasicToolbar from './toolbar/BasicToolbar.vue'

const { editor } = useEditorShell()
</script>

<style scoped>
.dsr-editor-host {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
