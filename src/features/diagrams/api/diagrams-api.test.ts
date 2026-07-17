import { describe, it, expect, beforeEach } from 'vitest';
import { effectiveRules, validate } from '@/domain/diagram';
import { getTypeOrThrow, tables } from '@/shared/diagram-db/db';
import { diagramsApi } from './diagrams-api';

/** The mock db is module state shared by every test — start each one clean. */
beforeEach(() => {
  tables.diagrams = [];
});

const FAMILY = 'tpl_family';

describe('diagramsApi.create — seeding with sample data', () => {
  it('leaves the canvas empty unless asked', async () => {
    const d = await diagramsApi.create({ name: 'A', templateId: FAMILY, ruleSetIds: ['rs_family'] });
    expect(d.nodes).toEqual([]);
    expect(d.edges).toEqual([]);
  });

  it('seeds a diagram that already satisfies the rule sets it applies', async () => {
    const d = await diagramsApi.create({
      name: 'B',
      templateId: FAMILY,
      ruleSetIds: ['rs_family'],
      withSample: true,
    });
    expect(d.nodes.length).toBeGreaterThan(0);
    expect(d.edges.length).toBeGreaterThan(0);
    const type = getTypeOrThrow(FAMILY);
    expect(validate(d, effectiveRules(d, type.ruleSets), type.relations)).toEqual([]);
  });

  it('seeds against the SCOPED sets, not the ones that were asked for', async () => {
    // A rule set belonging to another type is dropped by `scopedRuleSetIds`, so
    // the sample must be built without it too — generating against the raw input
    // would shape the data around rules the diagram does not actually run.
    const d = await diagramsApi.create({
      name: 'C',
      templateId: FAMILY,
      ruleSetIds: ['rs_family', 'rs_org'],
      withSample: true,
    });
    expect(d.ruleSetIds).toEqual(['rs_family']);
    const type = getTypeOrThrow(FAMILY);
    expect(validate(d, effectiveRules(d, type.ruleSets), type.relations)).toEqual([]);
  });

  it('still seeds when no rule set is ticked', async () => {
    const d = await diagramsApi.create({ name: 'D', templateId: FAMILY, ruleSetIds: [], withSample: true });
    expect(d.ruleSetIds).toEqual([]);
    expect(d.nodes.length).toBeGreaterThan(0);
    expect(validate(d, [])).toEqual([]);
  });
});

describe('diagramsApi.update — the form must not touch the canvas', () => {
  it('keeps seeded content when the header fields are edited', async () => {
    const created = await diagramsApi.create({
      name: 'E',
      templateId: FAMILY,
      ruleSetIds: ['rs_family'],
      withSample: true,
    });
    const nodeCount = created.nodes.length;
    const updated = await diagramsApi.update(created.id, {
      name: 'E đổi tên',
      templateId: FAMILY,
      ruleSetIds: ['rs_family'],
    });
    expect(updated.name).toBe('E đổi tên');
    expect(updated.nodes).toHaveLength(nodeCount);
  });
});
