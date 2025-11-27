// packages/editor-ext-diagrams-adv/src/templates/index.ts
import type { DiagramKind } from '../types'

export interface DiagramTemplate {
  id: string
  kind: DiagramKind
  label: string
  description?: string
  /**
   * Configuración base para el diagrama.
   * La interpretación depende del kind.
   */
  config: Record<string, any>
}

/**
 * Plantillas mínimas sugeridas en F2.11.
 * (Se pueden ampliar dentro de la misma fase sin romper compatibilidad.)
 */
export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'ishikawa-6m',
    kind: 'ishikawa',
    label: 'Ishikawa 6M (calidad)',
    description: 'Método, Mano de obra, Maquinaria, Medición, Medio ambiente, Materiales.',
    config: {
      categories: ['Método', 'Mano de obra', 'Maquinaria', 'Medición', 'Medio ambiente', 'Materiales'],
    },
  },
  {
    id: 'ishikawa-educacion',
    kind: 'ishikawa',
    label: 'Ishikawa Educación / Proyectos terminales',
    description:
      'Factores académicos, administrativos, metodológicos, recursos, tiempo y contexto.',
    config: {
      categories: [
        'Académicos',
        'Administrativos',
        'Metodológicos',
        'Recursos',
        'Tiempo',
        'Contexto',
      ],
    },
  },
  {
    id: 'venn-3',
    kind: 'venn',
    label: 'Venn de 3 conjuntos',
    config: {
      sets: ['A', 'B', 'C'],
    },
  },
  {
    id: 'risk-5x5',
    kind: 'riskMatrix',
    label: 'Matriz de riesgo 5×5',
    config: {
      size: 5,
    },
  },
  {
    id: 'process-basic',
    kind: 'processMap',
    label: 'Mapa de proceso básico',
    config: {
      layout: 'left-to-right',
    },
  },
  {
    id: 'systems-causal',
    kind: 'systemsModel',
    label: 'Diagrama causal simple',
    config: {
      defaultNodes: 3,
    },
  },
]
