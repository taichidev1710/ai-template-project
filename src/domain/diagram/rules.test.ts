import { describe, it, expect } from 'vitest';
import { effectiveRules, validate, edgeWouldViolate } from './rules';
import { BUILTIN_RULE_SETS } from './seed';
import type { Diagram, DiagramEdge, DiagramNode, Rule } from './types';
import { defaultVisibility } from './types';

const node = (id: string, blockTypeId: string, extra?: Partial<DiagramNode>): DiagramNode => ({
  id, blockTypeId, label: id, pos: { x: 0, y: 0 }, ...extra,
});
const edge = (id: string, relationId: string, source: string, target: string): DiagramEdge => ({
  id, relationId, source, target,
});

function diagram(nodes: DiagramNode[], edges: DiagramEdge[], overrides?: Partial<Diagram>): Diagram {
  return {
    id: 'd', name: 't', nodes, edges, ruleSetIds: [], localRules: [],
    visibility: defaultVisibility(), createdAt: '', updatedAt: '', ...overrides,
  };
}

describe('validate — require / limit (node degree)', () => {
  it('require: a person with < 2 parents is flagged', () => {
    const rules: Rule[] = [{ id: 'r', type: 'require', blockType: 'bt_person', relation: 'rel_parent', dir: 'in', min: 2 }];
    const d = diagram(
      [node('p', 'bt_person'), node('m', 'bt_person'), node('c', 'bt_person')],
      [edge('e1', 'rel_parent', 'p', 'c')], // c has only 1 parent
    );
    const v = validate(d, rules);
    // p and m are roots (0 parents) and c has only 1 — all three fail "≥ 2 parents".
    expect(v).toHaveLength(3);
    expect(v.some((x) => x.id === 'c' && x.ruleType === 'require')).toBe(true);
  });

  it('require: exempt nodes are skipped', () => {
    const rules: Rule[] = [{ id: 'r', type: 'require', blockType: 'bt_person', relation: 'rel_parent', dir: 'in', min: 2 }];
    const d = diagram([node('root', 'bt_person', { exempt: true })], []);
    expect(validate(d, rules)).toHaveLength(0);
  });

  it('limit: more than 2 parents violates', () => {
    const rules: Rule[] = [{ id: 'r', type: 'limit', blockType: '*', relation: 'rel_parent', dir: 'in', max: 2 }];
    const d = diagram(
      [node('a', 'bt_person'), node('b', 'bt_person'), node('c', 'bt_person'), node('k', 'bt_person')],
      [edge('e1', 'rel_parent', 'a', 'k'), edge('e2', 'rel_parent', 'b', 'k'), edge('e3', 'rel_parent', 'c', 'k')],
    );
    const v = validate(d, rules);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ id: 'k', ruleType: 'limit' });
  });
});

describe('validate — edge allow-lists (ends / chain / same)', () => {
  it('chain: only adjacent tiers may connect', () => {
    const rules: Rule[] = [
      { id: 'r', type: 'chain', relation: 'rel_reports', order: ['bt_company', 'bt_dept', 'bt_manager', 'bt_employee'] },
    ];
    const ok = diagram(
      [node('co', 'bt_company'), node('dp', 'bt_dept')],
      [edge('e', 'rel_reports', 'co', 'dp')], // adjacent → ok
    );
    expect(validate(ok, rules)).toHaveLength(0);

    const skip = diagram(
      [node('co', 'bt_company'), node('mg', 'bt_manager')],
      [edge('e', 'rel_reports', 'co', 'mg')], // company → manager skips dept → violation
    );
    expect(validate(skip, rules)).toHaveLength(1);
  });

  it('same: relation must connect two nodes of the same block type', () => {
    const rules: Rule[] = [{ id: 'r', type: 'same', relation: 'rel_spouse', blockTypes: ['bt_person'] }];
    const bad = diagram(
      [node('a', 'bt_person'), node('u', 'bt_unknown')],
      [edge('e', 'rel_spouse', 'a', 'u')],
    );
    expect(validate(bad, rules)).toHaveLength(1);
  });

  it('ends: multiple ends rules on one relation act as an OR allow-list', () => {
    const rules: Rule[] = [
      { id: 'r1', type: 'ends', relation: 'rel_x', from: ['A'], to: ['B'] },
      { id: 'r2', type: 'ends', relation: 'rel_x', from: ['B'], to: ['C'] },
    ];
    const d = diagram(
      [node('a', 'A'), node('b', 'B'), node('c', 'C')],
      [edge('e1', 'rel_x', 'a', 'b'), edge('e2', 'rel_x', 'b', 'c'), edge('e3', 'rel_x', 'a', 'c')],
    );
    const v = validate(d, rules);
    expect(v).toHaveLength(1); // a→b ok, b→c ok, a→c matches neither
    expect(v[0]?.id).toBe('e3');
  });

  it('an unconstrained relation (no allow-list rule) is always valid', () => {
    const d = diagram(
      [node('a', 'A'), node('b', 'B')],
      [edge('e', 'rel_free', 'a', 'b')],
    );
    expect(validate(d, [])).toHaveLength(0);
  });
});

describe('effectiveRules — applying multiple rule sets', () => {
  it('merges rules from every applied rule set plus local rules', () => {
    const d = diagram([], [], {
      ruleSetIds: ['rs_family', 'rs_org'],
      localRules: [{ id: 'local', type: 'limit', blockType: '*', relation: 'rel_x', dir: 'any', max: 1 }],
    });
    const rules = effectiveRules(d, BUILTIN_RULE_SETS);
    const family = BUILTIN_RULE_SETS.find((s) => s.id === 'rs_family')!;
    const org = BUILTIN_RULE_SETS.find((s) => s.id === 'rs_org')!;
    expect(rules).toHaveLength(family.rules.length + org.rules.length + 1);
    expect(rules.some((r) => r.id === 'local')).toBe(true);
  });
});

describe('edgeWouldViolate — pre-draw guard for the canvas', () => {
  it('blocks a 3rd parent under a max-2 limit', () => {
    const rules: Rule[] = [{ id: 'r', type: 'limit', blockType: '*', relation: 'rel_parent', dir: 'in', max: 2 }];
    const d = diagram(
      [node('a', 'bt_person'), node('b', 'bt_person'), node('c', 'bt_person'), node('k', 'bt_person')],
      [edge('e1', 'rel_parent', 'a', 'k'), edge('e2', 'rel_parent', 'b', 'k')], // k already has 2
    );
    expect(edgeWouldViolate(d, rules, { relationId: 'rel_parent', source: 'c', target: 'k' })).not.toBeNull();
    expect(edgeWouldViolate(d, rules, { relationId: 'rel_parent', source: 'c', target: 'a' })).toBeNull();
  });

  it('blocks an edge that satisfies no allow-list rule', () => {
    const rules: Rule[] = [{ id: 'r', type: 'chain', relation: 'rel_reports', order: ['bt_company', 'bt_dept'] }];
    const d = diagram([node('co', 'bt_company'), node('mg', 'bt_manager')], []);
    expect(edgeWouldViolate(d, rules, { relationId: 'rel_reports', source: 'co', target: 'mg' })).not.toBeNull();
  });
});
