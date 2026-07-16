import type { DiagramTypesListParams } from '../types';

/** Query key factory. */
export const diagramTypesKeys = {
  all: ['diagram-types'] as const,
  lists: () => [...diagramTypesKeys.all, 'list'] as const,
  list: (params: DiagramTypesListParams) => [...diagramTypesKeys.lists(), params] as const,
  /** Unpaginated list, for pickers that must offer every type. */
  options: () => [...diagramTypesKeys.all, 'options'] as const,
  details: () => [...diagramTypesKeys.all, 'detail'] as const,
  detail: (id: string) => [...diagramTypesKeys.details(), id] as const,
};
