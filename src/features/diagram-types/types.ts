import type { ListParams } from '@/shared/api';
import type { DiagramTemplate } from '@/domain/diagram';

export type { DiagramTemplate };

/** Editable header fields; the catalog (blocks/relations/rule sets) is edited in the tabs. */
export type DiagramTypeInput = Pick<DiagramTemplate, 'name' | 'icon' | 'description'>;

export type DiagramTypesListParams = ListParams;

export type DiagramTypesViewMode = 'table' | 'grid';
