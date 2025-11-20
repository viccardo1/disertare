import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DicomNodeView } from './DicomNodeView'

export interface DicomOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dicom: {
      /**
       * Inserta una imagen médica DICOM como objeto editable
       */
      setDicom: (attrs: { dicomArrayBuffer: ArrayBuffer; fileName?: string }) => ReturnType
    }
  }
}

export const Dicom = Node.create<DicomOptions>({
  name: 'dicom',
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
      fileName: {
        default: 'imagen.dcm',
        parseHTML: element => element.getAttribute('data-file-name'),
        renderHTML: attributes => {
          return { 'data-file-name': attributes.fileName }
        },
      },
      patient: {
        default: '',
        parseHTML: element => element.getAttribute('data-patient'),
        renderHTML: attributes => {
          return { 'data-patient': attributes.patient }
        },
      },
      study: {
        default: '',
        parseHTML: element => element.getAttribute('data-study'),
        renderHTML: attributes => {
          return { 'data-study': attributes.study }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-disertare-dicom]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-disertare-dicom': '',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setDicom:
        attrs =>
        ({ chain }) => {
          // Nota: TipTap no serializa ArrayBuffer; usamos base64 en atributos solo para UI
          // El contenido real se maneja en el NodeView
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                fileName: attrs.fileName || 'imagen.dcm',
                patient: attrs.patient || '',
                study: attrs.study || '',
              },
            })
            .run()
        },
    }
  },

  addNodeView() {
    return DicomNodeView
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('dicomDropHandler'),
        props: {
          handleDOMEvents: {
            drop(view, event) {
              const files = Array.from(event.dataTransfer?.files || [])
              const dcmFile = files.find(f => f.name.toLowerCase().endsWith('.dcm'))
              if (!dcmFile) return false

              event.preventDefault()
              const reader = new FileReader()
              reader.onload = () => {
                const arrayBuffer = reader.result as ArrayBuffer
                const { schema, dispatch } = view.state

                // Extraer metadatos básicos (simulado)
                const metadata = parseDicomMetadata(arrayBuffer)
                const node = schema.nodes.dicom.create({
                  fileName: dcmFile.name,
                  patient: metadata.PatientName || '',
                  study: metadata.StudyDescription || '',
                })

                const transaction = view.state.tr.replaceSelectionWith(node)
                // Adjuntar buffer al nodo (solo en runtime, no serializable)
                ;(transaction as any).setMeta('dicomBuffer', arrayBuffer)
                dispatch(transaction)
              }
              reader.readAsArrayBuffer(dcmFile)
              return true
            },
          },
        },
      }),
    ]
  },
})

// Parser mínimo de metadatos DICOM (grupo 0x0010 y 0x0008)
function parseDicomMetadata(buffer: ArrayBuffer): Record<string, string> {
  const dataView = new DataView(buffer)
  let offset = 0
  const metadata: Record<string, string> = {}

  // Saltar encabezado de 128 bytes + "DICM"
  if (new TextDecoder().decode(new Uint8Array(buffer, 128, 4)) === 'DICM') {
    offset = 132
  }

  while (offset < buffer.byteLength - 8) {
    const group = dataView.getUint16(offset, true)
    const element = dataView.getUint16(offset + 2, true)
    const vr = new TextDecoder().decode(new Uint8Array(buffer, offset + 4, 2))
    let length = dataView.getUint32(offset + 6, true)
    let valueStart = offset + 12

    if (vr === 'OB' || vr === 'OW' || vr === 'OF' || vr === 'SQ') {
      // Skip binary data
      offset += 8 + ((length + 1) & ~1)
      continue
    }

    if (length === 0xffffffff) {
      // Undefined length — skip
      break
    }

    let value = ''
    if (length > 0 && length < 1000) {
      try {
        value = new TextDecoder().decode(new Uint8Array(buffer, valueStart, length)).trim()
      } catch {}
    }

    if (group === 0x0010 && element === 0x0010) metadata.PatientName = value
    if (group === 0x0008 && element === 0x1030) metadata.StudyDescription = value

    offset += 8 + ((length + 1) & ~1)
  }

  return metadata
}
