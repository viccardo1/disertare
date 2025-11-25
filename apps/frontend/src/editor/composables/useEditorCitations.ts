// apps/frontend/src/editor/composables/useEditorCitations.ts
import { ref, computed } from 'vue'
import type { Editor } from '@tiptap/core'
import {
  createCitationManager,
  type CitationStyleId,
  type CitationManager,
} from '@disertare/editor-citations'

export function useEditorCitations(getEditor: () => Editor | null) {
  const citationManager: CitationManager = createCitationManager()

  const currentCitationStyle = ref<CitationStyleId>('apa')
  const citationStyles = ['apa', 'vancouver', 'ieee', 'mla', 'chicago'] as CitationStyleId[]

  const styleLabel = computed(() => currentCitationStyle.value.toUpperCase())

  function insertCitation() {
    const editor = getEditor()
    if (!editor) return

      const refs = citationManager.listReferences()
      if (!refs.length) return

        const ref = refs[0]!
        editor
        .chain()
        .focus()
        .insertContent({
          type: 'citationInline',
          attrs: {
            refId: ref.id,
          },
        })
        .run()
  }

  function insertCitationFor(
    refId: string,
    locator?: string,
    prefix?: string,
    suffix?: string,
  ) {
    const editor = getEditor()
    if (!editor) return
      const ref = citationManager.getReference(refId)
      if (!ref) return

        editor
        .chain()
        .focus()
        .insertContent({
          type: 'citationInline',
          attrs: {
            refId,
            locator: locator || null,
            prefix: prefix || null,
            suffix: suffix || null,
          },
        })
        .run()
  }

  function insertBibliographyBlock() {
    const editor = getEditor()
    if (!editor) return

      editor
      .chain()
      .focus()
      .insertContent({
        type: 'bibliography',
        attrs: {
          title: 'Referencias',
          style: currentCitationStyle.value,
        },
      })
      .run()
  }

  function forceRerenderCitationsAndBibliography() {
    const editor = getEditor()
    if (!editor) return

      const renderVersion = Date.now()

      editor
      .chain()
      .setMeta('addToHistory', false)
      .updateAttributes('bibliography', { renderVersion })
      .run()
  }

  return {
    citationManager,
    currentCitationStyle,
    citationStyles,
    styleLabel,
    insertCitation,
    insertCitationFor,
    insertBibliographyBlock,
    forceRerenderCitationsAndBibliography,
  }
}
