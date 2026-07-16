import { delay, genId, getTypeOrThrow } from '@/shared/diagram-db/db';
import type { Rule, RuleSet, RuleSetInput, RuleInput } from '../types';

function findSet(typeId: string, setId: string): RuleSet {
  const rs = getTypeOrThrow(typeId).ruleSets.find((s) => s.id === setId);
  if (!rs) throw new Error('Rule set not found');
  return rs;
}

/** Feature API layer — rule sets (and their rules) scoped to a Loại sơ đồ. */
export const ruleSetsApi = {
  list: async (typeId: string): Promise<RuleSet[]> => {
    await delay();
    return getTypeOrThrow(typeId).ruleSets;
  },

  createSet: async (typeId: string, input: RuleSetInput): Promise<RuleSet> => {
    await delay();
    const type = getTypeOrThrow(typeId);
    const created: RuleSet = { id: genId('rs'), name: input.name, icon: input.icon, description: input.description, rules: [] };
    type.ruleSets = [...type.ruleSets, created];
    return created;
  },

  updateSet: async (typeId: string, setId: string, input: RuleSetInput): Promise<RuleSet> => {
    await delay();
    const rs = findSet(typeId, setId);
    Object.assign(rs, input);
    return rs;
  },

  removeSet: async (typeId: string, setId: string): Promise<void> => {
    await delay();
    const type = getTypeOrThrow(typeId);
    type.ruleSets = type.ruleSets.filter((s) => s.id !== setId);
  },

  addRule: async (typeId: string, setId: string, input: RuleInput): Promise<Rule> => {
    await delay();
    const rs = findSet(typeId, setId);
    const rule = { ...input, id: genId('r') } as Rule;
    rs.rules = [...rs.rules, rule];
    return rule;
  },

  updateRule: async (typeId: string, setId: string, ruleId: string, input: RuleInput): Promise<void> => {
    await delay();
    const rs = findSet(typeId, setId);
    rs.rules = rs.rules.map((x) => (x.id === ruleId ? ({ ...input, id: ruleId } as Rule) : x));
  },

  removeRule: async (typeId: string, setId: string, ruleId: string): Promise<void> => {
    await delay();
    const rs = findSet(typeId, setId);
    rs.rules = rs.rules.filter((x) => x.id !== ruleId);
  },
};
