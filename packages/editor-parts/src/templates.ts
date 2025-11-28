// packages/editor-parts/src/templates.ts
import type {
  AcademicFormatTemplate,
  AcademicPartDefinition,
  AcademicFormatId,
} from './types'

const es = 'es-MX'
const en = 'en-US'

function createPart(def: {
  id: string
  kind: AcademicPartDefinition['kind']
  required: boolean
  labelEs: string
  labelEn: string
  descriptionEs?: string
  descriptionEn?: string
}): AcademicPartDefinition {
  return {
    id: def.id,
    kind: def.kind,
    required: def.required,
    label: {
      [es]: def.labelEs,
      [en]: def.labelEn,
    },
    description:
      def.descriptionEs || def.descriptionEn
        ? {
            ...(def.descriptionEs ? { [es]: def.descriptionEs } : {}),
            ...(def.descriptionEn ? { [en]: def.descriptionEn } : {}),
          }
        : undefined,
  }
}

/**
 * Plantillas base por formato.
 * Estas plantillas son configurables por el módulo de mantenimiento;
 * aquí solo se define un conjunto inicial razonable para F2.x.
 */
export const defaultAcademicFormats: AcademicFormatTemplate[] = [
  {
    id: 'thesis',
    name: {
      [es]: 'Tesis',
      [en]: 'Thesis',
    },
    parts: [
      createPart({
        id: 'cover',
        kind: 'cover',
        required: true,
        labelEs: 'Portada',
        labelEn: 'Cover',
      }),
      createPart({
        id: 'dedication',
        kind: 'dedication',
        required: false,
        labelEs: 'Dedicatoria',
        labelEn: 'Dedication',
      }),
      createPart({
        id: 'acknowledgements',
        kind: 'acknowledgements',
        required: false,
        labelEs: 'Agradecimientos',
        labelEn: 'Acknowledgements',
      }),
      createPart({
        id: 'abstract',
        kind: 'abstract',
        required: true,
        labelEs: 'Resumen / Abstract',
        labelEn: 'Abstract',
      }),
      createPart({
        id: 'results',
        kind: 'results',
        required: false,
        labelEs: 'Resultados',
        labelEn: 'Results',
      }),
      createPart({
        id: 'conclusions',
        kind: 'conclusions',
        required: false,
        labelEs: 'Conclusiones',
        labelEn: 'Conclusions',
      }),
      createPart({
        id: 'references',
        kind: 'references',
        required: true,
        labelEs: 'Bibliografía / Referencias',
        labelEn: 'References',
      }),
      createPart({
        id: 'appendices',
        kind: 'appendices',
        required: false,
        labelEs: 'Anexos',
        labelEn: 'Appendices',
      }),
      createPart({
        id: 'ethics',
        kind: 'ethics',
        required: false,
        labelEs: 'Declaraciones éticas',
        labelEn: 'Ethics statements',
      }),
    ],
  },
  {
    id: 'article',
    name: {
      [es]: 'Artículo',
      [en]: 'Article',
    },
    parts: [
      createPart({
        id: 'cover',
        kind: 'cover',
        required: false,
        labelEs: 'Portada (opcional)',
        labelEn: 'Cover (optional)',
      }),
      createPart({
        id: 'abstract',
        kind: 'abstract',
        required: true,
        labelEs: 'Resumen / Abstract',
        labelEn: 'Abstract',
      }),
      createPart({
        id: 'results',
        kind: 'results',
        required: false,
        labelEs: 'Resultados',
        labelEn: 'Results',
      }),
      createPart({
        id: 'conclusions',
        kind: 'conclusions',
        required: false,
        labelEs: 'Conclusiones',
        labelEn: 'Conclusions',
      }),
      createPart({
        id: 'references',
        kind: 'references',
        required: true,
        labelEs: 'Bibliografía / Referencias',
        labelEn: 'References',
      }),
      createPart({
        id: 'appendices',
        kind: 'appendices',
        required: false,
        labelEs: 'Anexos',
        labelEn: 'Appendices',
      }),
    ],
  },
  {
    id: 'report',
    name: {
      [es]: 'Reporte',
      [en]: 'Report',
    },
    parts: [
      createPart({
        id: 'cover',
        kind: 'cover',
        required: true,
        labelEs: 'Portada',
        labelEn: 'Cover',
      }),
      createPart({
        id: 'abstract',
        kind: 'abstract',
        required: false,
        labelEs: 'Resumen ejecutivo',
        labelEn: 'Executive summary',
      }),
      createPart({
        id: 'results',
        kind: 'results',
        required: false,
        labelEs: 'Resultados',
        labelEn: 'Results',
      }),
      createPart({
        id: 'conclusions',
        kind: 'conclusions',
        required: false,
        labelEs: 'Conclusiones / Recomendaciones',
        labelEn: 'Conclusions / Recommendations',
      }),
      createPart({
        id: 'references',
        kind: 'references',
        required: true,
        labelEs: 'Referencias',
        labelEn: 'References',
      }),
      createPart({
        id: 'appendices',
        kind: 'appendices',
        required: false,
        labelEs: 'Anexos',
        labelEn: 'Appendices',
      }),
    ],
  },
]

export function getAcademicFormatById(
  id: AcademicFormatId,
): AcademicFormatTemplate | undefined {
  return defaultAcademicFormats.find((fmt) => fmt.id === id)
}
