import { describe, it, expect } from 'vitest';
import { validate, edgeWouldViolate } from './rules';
import { generateSample } from './sample';
import { BUILTIN_TEMPLATES } from './seed';
import { defaultVisibility, type Diagram, type DiagramEdge, type DiagramNode, type Relation, type RelationStep, type Rule } from './types';

const node = (id: string): DiagramNode => ({ id, blockTypeId: 'p', label: id, pos: { x: 0, y: 0 } });
const kid = (id: string, ...parents: string[]): DiagramEdge[] =>
  parents.map((p, i) => ({ id: `${p}>${id}${i}`, relationId: 'par', source: p, target: id }));

const style = { line: 'solid', arrow: 'none', curve: 'straight', color: '#000000', width: 1 } as const;
const up = { relationId: 'par', dir: 'up' } as const;
const down = { relationId: 'par', dir: 'down' } as const;

/** A catalog a rule may refer to: the base hierarchy plus two derived kinships. */
const CATALOG: Relation[] = [
  { id: 'par', name: 'Cha mẹ – con', kind: 'base', role: 'primary', style },
  { id: 'spouse', name: 'Vợ chồng', kind: 'base', role: 'secondary', style },
  { id: 'der_sibling', name: 'Anh chị em', kind: 'derived', pattern: [up, down], exclude: ['self'], style },
  { id: 'der_cousin', name: 'Anh chị em họ', kind: 'derived', pattern: [up, up, down, down], exclude: ['self', 'siblings'], style },
];

const forbid = (id: string, when: string): Rule => ({ id, type: 'forbid', relation: 'spouse', when });

/**
 * gp1+gp2 → a, b (anh chị em ruột). a→a1, b→b1 (anh chị em họ).
 * a1→a2, b1→b2 (đời 4). ax/bx/a1x/b1x là dâu rể ngoài họ.
 */
const PEDIGREE: Diagram = {
  id: 'd', name: 't',
  nodes: ['gp1', 'gp2', 'a', 'b', 'ax', 'bx', 'a1', 'b1', 'a1x', 'b1x', 'a2', 'b2'].map(node),
  edges: [
    ...kid('a', 'gp1', 'gp2'), ...kid('b', 'gp1', 'gp2'),
    ...kid('a1', 'a', 'ax'), ...kid('b1', 'b', 'bx'),
    ...kid('a2', 'a1', 'a1x'), ...kid('b2', 'b1', 'b1x'),
  ],
  ruleSetIds: [], localRules: [], visibility: defaultVisibility(), createdAt: '', updatedAt: '',
};
const wed = (a: string, b: string): Diagram => ({
  ...PEDIGREE,
  edges: [...PEDIGREE.edges, { id: 'w', relationId: 'spouse', source: a, target: b }],
});

describe('forbid — cấm nếu đã có quan hệ khác', () => {
  const NO_SIBLING = [forbid('f', 'der_sibling')];

  it('trỏ vào quan hệ suy ra: anh chị em ruột thì cấm', () => {
    expect(validate(wed('a', 'b'), NO_SIBLING, CATALOG)).toHaveLength(1);
    expect(validate(wed('a', 'b'), NO_SIBLING, CATALOG)[0]?.message).toContain('Anh chị em');
  });

  it('không phải anh chị em thì không đụng tới', () => {
    expect(validate(wed('a', 'ax'), NO_SIBLING, CATALOG)).toEqual([]);
    // Anh chị em HỌ không bị luật "anh chị em ruột" chặn — mỗi quan hệ một luật.
    expect(validate(wed('a1', 'b1'), NO_SIBLING, CATALOG)).toEqual([]);
  });

  it('muốn cấm anh chị em họ thì phải có luật trỏ vào quan hệ đó', () => {
    const NO_COUSIN = [forbid('f2', 'der_cousin')];
    expect(validate(wed('a1', 'b1'), NO_COUSIN, CATALOG)).toHaveLength(1);
    // Đời 4 không khớp quan hệ nào ⇒ được lấy nhau.
    expect(validate(wed('a2', 'b2'), NO_COUSIN, CATALOG)).toEqual([]);
  });

  it('trỏ vào quan hệ NỀN cũng được: cha mẹ – con', () => {
    expect(validate(wed('gp1', 'a'), [forbid('f3', 'par')], CATALOG)).toHaveLength(1);
    expect(validate(wed('gp1', 'b'), [forbid('f3', 'par')], CATALOG)).toHaveLength(1);
    expect(validate(wed('gp1', 'a1'), [forbid('f3', 'par')], CATALOG)).toEqual([]); // cháu, không phải con
  });

  it('xét CẢ HAI chiều — vẽ ngược lại vẫn chặn', () => {
    expect(validate(wed('a', 'b'), NO_SIBLING, CATALOG)).toHaveLength(1);
    expect(validate(wed('b', 'a'), NO_SIBLING, CATALOG)).toHaveLength(1);
  });

  it('là VETO, không phải một vế OR của allow-list', () => {
    // `same` cho phép; nếu forbid bị gộp vào nhóm OR thì cạnh sẽ lọt vì đã thoả same.
    const rules: Rule[] = [{ id: 's', type: 'same', relation: 'spouse' }, ...NO_SIBLING];
    expect(validate(wed('a', 'b'), rules, CATALOG)).toHaveLength(1);
  });

  it('chặn trước khi vẽ, không phải báo lỗi sau', () => {
    expect(edgeWouldViolate(PEDIGREE, NO_SIBLING, { relationId: 'spouse', source: 'a', target: 'b' }, CATALOG)).not.toBeNull();
    expect(edgeWouldViolate(PEDIGREE, NO_SIBLING, { relationId: 'spouse', source: 'a', target: 'ax' }, CATALOG)).toBeNull();
  });

  it('chỉ đụng đúng quan hệ bị cấm, không đụng quan hệ khác', () => {
    const friends: Diagram = {
      ...PEDIGREE,
      edges: [...PEDIGREE.edges, { id: 'f', relationId: 'friend', source: 'a', target: 'b' }],
    };
    expect(validate(friends, NO_SIBLING, CATALOG)).toEqual([]);
  });

  it('trỏ vào quan hệ KHÔNG có trong danh mục thì im lặng, không chặn bừa', () => {
    // Cùng lối hành xử với mọi luật viết cho vốn từ vựng của loại khác (§8.4).
    expect(validate(wed('a', 'b'), [forbid('f', 'der_khong_ton_tai')], CATALOG)).toEqual([]);
    expect(validate(wed('a', 'b'), NO_SIBLING, [])).toEqual([]);
  });
});

describe('forbid — lối thoát: tự dựng đường đi khi danh mục chưa có', () => {
  const inline = (pattern: RelationStep[]): Rule[] => [{ id: 'f', type: 'forbid', relation: 'spouse', pattern }];

  it('dựng được quan hệ mà danh mục không có tên cho', () => {
    // “Chắt của cùng một cụ” — CATALOG không khai báo, vẫn cấm được.
    const FAR = inline([up, up, up, down, down, down]);
    expect(validate(wed('a2', 'b2'), FAR, CATALOG)).toHaveLength(1);
    expect(validate(wed('a2', 'a1x'), FAR, CATALOG)).toEqual([]);
  });

  it('cũng xét cả hai chiều', () => {
    const UNCLE = inline([up, up, down]);
    expect(validate(wed('a1', 'b'), UNCLE, CATALOG)).toHaveLength(1);
    expect(validate(wed('b', 'a1'), UNCLE, CATALOG)).toHaveLength(1);
  });

  it('đường đi rỗng thì không cấm gì — luật dở dang không chặn bừa', () => {
    expect(validate(wed('a', 'b'), inline([]), CATALOG)).toEqual([]);
  });

  it('`when` thắng khi lỡ đặt cả hai', () => {
    const both: Rule[] = [{ id: 'f', type: 'forbid', relation: 'spouse', when: 'der_sibling', pattern: [up, up, down, down] }];
    expect(validate(wed('a', 'b'), both, CATALOG)).toHaveLength(1); // anh em ruột → `when` bắt
    expect(validate(wed('a1', 'b1'), both, CATALOG)).toEqual([]); // anh em họ → pattern bị bỏ qua
  });
});

describe('forbid — cạnh mới phá cạnh đã vẽ', () => {
  // Guard cũ chỉ đọc những luật cấm có `relation` TRÙNG cạnh đang vẽ. Nó gác được
  // "cưới em gái mình", nhưng không gác chiều ngược lại: cưới trước, cho chung cha
  // sau. Canvas cho vẽ xong `validate` lập tức kêu vi phạm — guard và validate cãi
  // nhau về đúng một luật. Luật cấm cấm một CẶP ĐÔI, nên nó bị phá ngang nhau bởi
  // cạnh tạo ra quan hệ họ hàng và bởi chính cạnh bị cấm.
  const NO_SIBLING = [forbid('f', 'der_sibling')];
  const withEdges = (base: Diagram, ...edges: DiagramEdge[]): Diagram => ({ ...base, edges: [...base.edges, ...edges] });

  // ax, bx là dâu rể ngoài họ — cưới nhau vô tư. Cho ax một người cha (gp1) thì
  // cạnh cưới vẫn sạch; nhưng cho bx CHÍNH người cha đó thì hai người hoá anh em.
  const marriedThenKin = withEdges(wed('ax', 'bx'), { id: 'p1', relationId: 'par', source: 'gp1', target: 'ax' });

  it('cho hai người ĐÃ CƯỚI chung một cha ⇒ hoá anh chị em ⇒ chặn', () => {
    expect(validate(marriedThenKin, NO_SIBLING, CATALOG)).toEqual([]); // sạch trước khi vẽ
    const blocked = edgeWouldViolate(marriedThenKin, NO_SIBLING, { relationId: 'par', source: 'gp1', target: 'bx' }, CATALOG);
    expect(blocked).not.toBeNull();
    expect(blocked).toContain('Anh chị em');
  });

  it('guard và validate không được cãi nhau: cái gì guard cho lọt thì validate phải nhận', () => {
    const cand = { relationId: 'par', source: 'gp1', target: 'bx' };
    const after = withEdges(marriedThenKin, { id: 'c', ...cand });
    // Trước khi sửa, hai dòng này cùng đúng một lúc — đó chính là lỗi.
    expect(edgeWouldViolate(marriedThenKin, NO_SIBLING, cand, CATALOG)).not.toBeNull();
    expect(validate(after, NO_SIBLING, CATALOG)).toHaveLength(1);
  });

  it('cạnh không đẻ ra quan hệ bị cấm thì vẫn vẽ được', () => {
    // gp2 làm cha ax thì ax vẫn chẳng dính dáng gì tới bx.
    expect(
      edgeWouldViolate(wed('ax', 'bx'), NO_SIBLING, { relationId: 'par', source: 'gp2', target: 'ax' }, CATALOG),
    ).toBeNull();
  });

  it('phạm sẵn từ trước thì KHÔNG chặn lây — sơ đồ sai vẫn phải sửa được', () => {
    // a♥b vốn là anh em ruột nên đã phạm luật. Nếu guard chặn mọi cạnh chỉ vì cặp
    // này đang sai, sơ đồ sẽ kẹt cứng: không thêm được gì để gỡ nó ra.
    expect(validate(wed('a', 'b'), NO_SIBLING, CATALOG)).toHaveLength(1);
    expect(
      edgeWouldViolate(wed('a', 'b'), NO_SIBLING, { relationId: 'par', source: 'a', target: 'ax' }, CATALOG),
    ).toBeNull();
  });
});

describe('forbid — engine không biết gì về gia đình', () => {
  it('cùng luật đó chạy trên sơ đồ tổ chức: cấm phối hợp với người cùng sếp', () => {
    const orgCatalog: Relation[] = [
      { id: 'rel_reports', name: 'Trực thuộc', kind: 'base', role: 'primary', style },
      { id: 'rel_coord', name: 'Phối hợp', kind: 'base', role: 'secondary', style },
      {
        id: 'der_peer', name: 'Cùng sếp (suy ra)', kind: 'derived',
        pattern: [{ relationId: 'rel_reports', dir: 'up' }, { relationId: 'rel_reports', dir: 'down' }],
        exclude: ['self'], style,
      },
    ];
    const org: Diagram = {
      id: 'o', name: 'org',
      nodes: [
        { id: 'sep', blockTypeId: 'bt_manager', label: 'Sếp', pos: { x: 0, y: 0 } },
        { id: 'nv1', blockTypeId: 'bt_employee', label: 'NV1', pos: { x: 0, y: 0 } },
        { id: 'nv2', blockTypeId: 'bt_employee', label: 'NV2', pos: { x: 0, y: 0 } },
        { id: 'ngoai', blockTypeId: 'bt_employee', label: 'NV ngoài', pos: { x: 0, y: 0 } },
      ],
      edges: [
        { id: 'e1', relationId: 'rel_reports', source: 'sep', target: 'nv1' },
        { id: 'e2', relationId: 'rel_reports', source: 'sep', target: 'nv2' },
      ],
      ruleSetIds: [], localRules: [], visibility: defaultVisibility(), createdAt: '', updatedAt: '',
    };
    const rules: Rule[] = [{ id: 'f', type: 'forbid', relation: 'rel_coord', when: 'der_peer' }];
    expect(edgeWouldViolate(org, rules, { relationId: 'rel_coord', source: 'nv1', target: 'nv2' }, orgCatalog)).not.toBeNull();
    expect(edgeWouldViolate(org, rules, { relationId: 'rel_coord', source: 'nv1', target: 'ngoai' }, orgCatalog)).toBeNull();
  });
});

describe('forbid — dữ liệu mẫu Gia đình', () => {
  // Lúc mới có luật này, generator đang đẻ ra 4 cặp anh chị em HỌ lấy nhau
  // (Người 5♥6, 7♥8, 9♥10, 11♥12): mẹo chia vòng chỉ tách được anh em RUỘT.
  // Sửa bằng cách cho mỗi node tầng 1 một nhóm cha mẹ riêng ở tầng gốc.
  const family = BUILTIN_TEMPLATES.find((t) => t.id === 'tpl_family')!;
  const sample = (): Diagram => {
    const { nodes, edges } = generateSample(family);
    return {
      id: 'd', name: 'x', nodes, edges, ruleSetIds: [], localRules: [],
      visibility: defaultVisibility(), createdAt: '', updatedAt: '',
    };
  };

  it('mọi luật cấm của loại này đều trỏ vào quan hệ CÓ THẬT trong danh mục', () => {
    const ids = new Set(family.relations.map((r) => r.id));
    const dangling = family.ruleSets
      .flatMap((rs) => rs.rules)
      .filter((r) => r.type === 'forbid' && r.when != null && !ids.has(r.when));
    expect(dangling).toEqual([]);
  });

  it('không cặp vợ chồng nào phạm luật cấm của chính loại này', () => {
    const forbidRules = family.ruleSets.flatMap((rs) => rs.rules).filter((r) => r.type === 'forbid');
    expect(forbidRules.length).toBeGreaterThan(0);
    expect(validate(sample(), forbidRules, family.relations).map((v) => v.message)).toEqual([]);
  });

  it('vẫn đủ cặp vợ chồng để thử quan hệ suy ra con dâu/rể', () => {
    expect(sample().edges.filter((e) => e.relationId === 'rel_spouse').length).toBeGreaterThanOrEqual(2);
  });
});
