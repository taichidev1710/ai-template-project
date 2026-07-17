import type { ListParams } from '@/shared/api';
import type { Diagram, DiagramEdge, DiagramNode, DiagramVisibility, Rule } from '@/domain/diagram';

export type { Diagram };

/** What the canvas owns and writes back — everything the form does NOT touch. */
export interface DiagramContentInput {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  visibility: DiagramVisibility;
  localRules: Rule[];
}

/**
 * Editable header fields of a diagram. `nodes`/`edges` are drawn on the canvas,
 * not typed into a form; `templateId` is the Loại sơ đồ that owns this diagram's
 * vocabulary, and `ruleSetIds` is the subset of THAT type's rule sets to apply.
 */
export interface DiagramInput {
  name: string;
  templateId: string;
  ruleSetIds: string[];
}

/**
 * Creating may seed the canvas with generated sample data. Only `create` takes
 * it: `update` must never touch nodes/edges (that is `saveContent`'s job), so
 * the flag would be a lie on the shared input.
 */
export interface DiagramCreateInput extends DiagramInput {
  withSample?: boolean;
}

export type DiagramsListParams = ListParams & {
  /** Narrow the list to one Loại sơ đồ. */
  templateId?: string;
};

export type DiagramsViewMode = 'table' | 'grid';
