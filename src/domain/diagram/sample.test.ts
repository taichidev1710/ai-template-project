import { describe, it, expect } from 'vitest';
import { computeDerivedPairs } from './derive';
import { validate } from './rules';
import { generateSample } from './sample';
import { BUILTIN_TEMPLATES } from './seed';
import { defaultVisibility, isBaseRelation, isDerivedRelation, type Diagram, type DiagramTemplate } from './types';

/** The generated content as a whole Diagram — what the engine functions expect. */
function asDiagram(template: DiagramTemplate, ruleSetIds?: string[]): Diagram {
  const { nodes, edges } = generateSample(template, ruleSetIds);
  return {
    id: 'd',
    name: template.name,
    templateId: template.id,
    nodes,
    edges,
    ruleSetIds: ruleSetIds ?? template.ruleSets.map((rs) => rs.id),
    localRules: [],
    visibility: defaultVisibility(),
    createdAt: '',
    updatedAt: '',
  };
}

const rulesOf = (template: DiagramTemplate) => template.ruleSets.flatMap((rs) => rs.rules);

describe.each(BUILTIN_TEMPLATES.map((t) => [t.name, t] as const))('generateSample — %s', (_name, template) => {
  it('never stacks two blocks on top of each other', () => {
    // 60 ≈ node size (54) + breathing room. Small samples: plain O(n²) is fine.
    const { nodes } = generateSample(template);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]?.pos;
        const b = nodes[j]?.pos;
        if (!a || !b) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        expect(d, `${nodes[i]?.label} đè lên ${nodes[j]?.label}`).toBeGreaterThanOrEqual(60);
      }
    }
  });

  it('satisfies every rule of the type', () => {
    const d = asDiagram(template);
    // `relations` matters: without the catalog a `forbid` rule resolves to
    // nothing and this assertion would pass while never checking it.
    expect(validate(d, rulesOf(template), template.relations)).toEqual([]);
  });

  it('uses every block type, so each one can be exercised', () => {
    const d = asDiagram(template);
    const used = new Set(d.nodes.map((n) => n.blockTypeId));
    expect([...template.blockTypes].map((b) => b.id).filter((id) => !used.has(id))).toEqual([]);
  });

  it('draws every base relation at least once', () => {
    const d = asDiagram(template);
    const drawn = new Set(d.edges.map((e) => e.relationId));
    const missing = template.relations.filter((r) => isBaseRelation(r) && !drawn.has(r.id));
    expect(missing.map((r) => r.name)).toEqual([]);
  });

  it('gives every derived relation something to compute', () => {
    const d = asDiagram(template);
    const barren = template.relations
      .filter(isDerivedRelation)
      .filter((r) => computeDerivedPairs(d, r).length === 0);
    expect(barren.map((r) => r.name)).toEqual([]);
  });

  it('leaves no edge pointing at a node that does not exist', () => {
    const d = asDiagram(template);
    const ids = new Set(d.nodes.map((n) => n.id));
    expect(d.edges.filter((e) => !ids.has(e.source) || !ids.has(e.target))).toEqual([]);
  });
});

describe('generator không suy diễn ý tác giả', () => {
  // Generator từng đọc `limit(x, R, 'in')` như tác giả "ngụ ý" x là đầu nhận, rồi
  // xếp hạng tầng theo độ sâu — tức bịa ra luật không ai viết. Cách chữa là DỮ
  // LIỆU: loại sơ đồ nói hẳn hai đầu ra bằng `ends`/`chain`/`same`. Test này chốt
  // rằng các loại dựng sẵn ĐÃ nói, nên chẳng còn gì để đoán.
  const SHOULD_DECLARE = ['tpl_family', 'tpl_org', 'tpl_school'];
  // Bốn loại này CỐ Ý không ràng buộc — "nối gì cũng được" là ý đồ, không phải thiếu.
  const FREEFORM = ['tpl_process', 'tpl_network', 'tpl_mindmap', 'tpl_free'];

  it.each(SHOULD_DECLARE)('%s: mọi quan hệ nền đều tự khai báo hai đầu', (id) => {
    const t = BUILTIN_TEMPLATES.find((x) => x.id === id)!;
    const rules = t.ruleSets.flatMap((rs) => rs.rules);
    const undeclared = t.relations
      .filter(isBaseRelation)
      .filter(
        (r) =>
          !rules.some(
            (x) => (x.type === 'ends' || x.type === 'chain' || x.type === 'same') && x.relation === r.id,
          ),
      );
    expect(undeclared.map((r) => r.name)).toEqual([]);
  });

  it('các loại tự do vẫn dựng được mẫu dù không khai báo gì', () => {
    for (const id of FREEFORM) {
      const t = BUILTIN_TEMPLATES.find((x) => x.id === id)!;
      const { nodes, edges } = generateSample(t);
      expect(nodes.length, id).toBeGreaterThan(0);
      expect(edges.length, id).toBeGreaterThan(0);
    }
  });
});

describe('Trường học — không giữ luật chết', () => {
  // `rc_student_limit` cũ đếm liên kết ĐI RA của Học sinh, nhưng `rc_ends` chỉ cho
  // Trường/Lớp làm nguồn ⇒ số đó vĩnh viễn = 0 ⇒ luật không bao giờ chạy. Test này
  // bắt mọi luật đếm một chiều mà loại khối đó không bao giờ có.
  it('không luật limit nào đếm chiều mà `ends` đã cấm khối đó đứng', () => {
    const school = BUILTIN_TEMPLATES.find((t) => t.id === 'tpl_school')!;
    const rules = school.ruleSets.flatMap((rs) => rs.rules);
    const dead = rules.filter((r) => {
      if (r.type !== 'limit' || r.blockType === '*') return false;
      const ends = rules.filter((e) => e.type === 'ends' && e.relation === r.relation);
      if (ends.length === 0) return false;
      const canBeSource = ends.some((e) => e.type === 'ends' && e.from.includes(r.blockType));
      const canBeTarget = ends.some((e) => e.type === 'ends' && e.to.includes(r.blockType));
      return (r.dir === 'out' && !canBeSource) || (r.dir === 'in' && !canBeTarget);
    });
    expect(dead.map((r) => r.id)).toEqual([]);
  });
});

describe('generateSample — applied rule sets', () => {
  it('obeys only the rule sets that were ticked', () => {
    const family = BUILTIN_TEMPLATES.find((t) => t.id === 'tpl_family')!;
    // Ticking nothing means an unconstrained diagram: still drawable, still valid.
    const none = asDiagram(family, []);
    expect(validate(none, [])).toEqual([]);
    expect(none.nodes.length).toBeGreaterThan(0);
  });

  it('is deterministic — the same type always yields the same sample', () => {
    const org = BUILTIN_TEMPLATES.find((t) => t.id === 'tpl_org')!;
    expect(generateSample(org)).toEqual(generateSample(org));
  });
});

describe('generateSample — an unknown type', () => {
  it('handles a type with no relations at all', () => {
    const bare: DiagramTemplate = {
      id: 'tpl_bare',
      name: 'Trống',
      blockTypes: [{ id: 'bt_x', name: 'X', shape: 'ellipse', color: '#000000' }],
      relations: [],
      ruleSets: [],
    };
    expect(generateSample(bare)).toEqual({ nodes: [], edges: [] });
  });

  it('roots the tree at the one block type nothing requires parents of', () => {
    // Mirrors the family shape without its vocabulary: `person` must have 2
    // parents, so only `root` can head the tree — otherwise the top row would
    // itself fail the require and the sample could never be valid.
    const t: DiagramTemplate = {
      id: 'tpl_gen',
      name: 'Chung',
      blockTypes: [
        { id: 'bt_person', name: 'P', shape: 'ellipse', color: '#000000' },
        { id: 'bt_root', name: 'R', shape: 'hexagon', color: '#111111' },
      ],
      relations: [
        {
          id: 'rel_p',
          name: 'P',
          kind: 'base',
          role: 'primary',
          style: { line: 'solid', arrow: 'triangle', curve: 'straight', color: '#000000', width: 2 },
        },
      ],
      ruleSets: [
        {
          id: 'rs',
          name: 'S',
          rules: [
            { id: 'q', type: 'require', blockType: 'bt_person', relation: 'rel_p', dir: 'in', min: 2 },
            { id: 'l', type: 'limit', blockType: '*', relation: 'rel_p', dir: 'in', max: 2 },
          ],
        },
      ],
    };
    const d = asDiagram(t);
    expect(validate(d, rulesOf(t))).toEqual([]);
    const top = d.nodes.filter((n) => !d.edges.some((e) => e.target === n.id));
    expect(top.every((n) => n.blockTypeId === 'bt_root')).toBe(true);
  });
});

describe('generateSample — co-parents are a couple, not siblings', () => {
  // The tier build chunks a row into consecutive parent groups and the lateral
  // pass pairs those very same consecutive nodes. That is what makes the two
  // parents of a node a SPOUSE PAIR rather than two siblings — a property no
  // rule states, so nothing but this test pins it down.
  const family = BUILTIN_TEMPLATES.find((t) => t.id === 'tpl_family')!;

  it('joins each pair of co-parents with a spouse link', () => {
    const d = asDiagram(family);
    const parentsOf = (id: string) =>
      d.edges.filter((e) => e.relationId === 'rel_parent' && e.target === id).map((e) => e.source);
    const married = (a: string, b: string) =>
      d.edges.some(
        (e) =>
          e.relationId === 'rel_spouse' &&
          ((e.source === a && e.target === b) || (e.source === b && e.target === a)),
      );

    const couples = d.nodes
      .map((n) => parentsOf(n.id))
      .filter((ps) => ps.length === 2)
      // Roots stand in for unrecorded ancestors and take no spouse of their own.
      .filter(([a]) => d.nodes.find((n) => n.id === a)?.blockTypeId === 'bt_person');

    expect(couples.length).toBeGreaterThan(0);
    for (const [a, b] of couples) expect(married(a!, b!)).toBe(true);
  });

  it('never makes two siblings the parents of the same node', () => {
    const d = asDiagram(family);
    const parentsOf = (id: string) =>
      d.edges.filter((e) => e.relationId === 'rel_parent' && e.target === id).map((e) => e.source);

    for (const node of d.nodes) {
      const [a, b] = parentsOf(node.id);
      if (!a || !b) continue;
      const shared = parentsOf(a).filter((p) => parentsOf(b).includes(p));
      expect(shared).toEqual([]);
    }
  });
});
