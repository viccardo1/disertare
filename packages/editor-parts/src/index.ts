// packages/editor-parts/src/index.ts
import type {
  AcademicFormatId,
  AcademicPartId,
  AcademicFormatDefinition,
  AcademicPartDefinition,
} from './types'

export type {
  AcademicFormatId,
  AcademicPartId,
  AcademicFormatDefinition,
  AcademicPartDefinition,
} from './types'

export const defaultAcademicFormats: AcademicFormatDefinition[] = [
  {
    id: 'thesis',
    label: 'Tesis',
    description:
    'Estructura típica de trabajos de tesis y disertaciones académicas.',
    parts: [
      {
        id: 'cover',
        label: { es: 'Portada', en: 'Cover' },
        defaultSelected: true,
          includeInToc: false,
      },
      {
        id: 'dedication',
        label: { es: 'Dedicatoria', en: 'Dedication' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'acknowledgements',
        label: { es: 'Agradecimientos', en: 'Acknowledgements' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'abstract',
        label: { es: 'Resumen / Abstract', en: 'Abstract' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'results',
        label: { es: 'Resultados', en: 'Results' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'conclusions',
        label: { es: 'Conclusiones', en: 'Conclusions' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'references',
        label: { es: 'Bibliografía / Referencias', en: 'References' },
        defaultSelected: true,
          includeInToc: true,
      },
      {
        id: 'appendices',
        label: { es: 'Anexos', en: 'Appendices' },
        defaultSelected: false,
          includeInToc: true,
      },
      {
        id: 'ethics',
        label: { es: 'Declaraciones éticas', en: 'Ethics statements' },
        defaultSelected: false,
          includeInToc: true,
      },
    ],
  },
{
  id: 'article',
  label: 'Artículo',
  description: 'Estructura típica de artículos académicos.',
  parts: [
    {
      id: 'cover',
      label: { es: 'Portada (opcional)', en: 'Cover (optional)' },
      defaultSelected: false,
        includeInToc: false,
    },
    {
      id: 'abstract',
      label: { es: 'Resumen / Abstract', en: 'Abstract' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'results',
      label: { es: 'Resultados', en: 'Results' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'conclusions',
      label: { es: 'Conclusiones', en: 'Conclusions' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'references',
      label: { es: 'Bibliografía / Referencias', en: 'References' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'appendices',
      label: { es: 'Anexos', en: 'Appendices' },
      defaultSelected: false,
        includeInToc: true,
    },
  ],
},
{
  id: 'report',
  label: 'Reporte',
  description: 'Estructura sugerida para reportes técnicos o ejecutivos.',
  parts: [
    {
      id: 'cover',
      label: { es: 'Portada', en: 'Cover' },
      defaultSelected: true,
        includeInToc: false,
    },
    {
      id: 'executiveSummary',
      label: { es: 'Resumen ejecutivo', en: 'Executive summary' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'results',
      label: { es: 'Resultados', en: 'Results' },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'conclusionsRecommendations',
      label: {
        es: 'Conclusiones / Recomendaciones',
        en: 'Conclusions / Recommendations',
      },
      defaultSelected: true,
        includeInToc: true,
    },
    {
      id: 'references',
      label: { es: 'Referencias', en: 'References' },
      defaultSelected: false,
        includeInToc: true,
    },
    {
      id: 'appendices',
      label: { es: 'Anexos', en: 'Appendices' },
      defaultSelected: false,
        includeInToc: true,
    },
  ],
},
]
