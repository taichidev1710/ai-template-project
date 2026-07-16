import type { DiagramsListParams } from '../types';

/** Query key factory. */
export const diagramsKeys = {
  all: ['diagrams'] as const,
  lists: () => [...diagramsKeys.all, 'list'] as const,
  list: (params: DiagramsListParams) => [...diagramsKeys.lists(), params] as const,
  details: () => [...diagramsKeys.all, 'detail'] as const,
  detail: (id: string) => [...diagramsKeys.details(), id] as const,
};
