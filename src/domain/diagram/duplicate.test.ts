import { describe, it, expect } from 'vitest';
import { edgeWouldViolate } from './rules';
import { generateSample } from './sample';
import { BUILTIN_TEMPLATES } from './seed';
import { defaultVisibility, type Diagram, type Relation } from './types';

const style = { line: 'solid', arrow: 'none', curve: 'straight', color: '#000000', width: 1 } as const;

/** Hai quan hệ giống hệt nhau, khác đúng một chỗ: một cái khai `symmetric`. */
const CATALOG: Relation[] = [
  { id: 'flow', name: 'Luồng tới', kind: 'base', role: 'primary', style },
  { id: 'friend', name: 'Bạn bè', kind: 'base', role: 'secondary', symmetric: true, style },
];

/** A và B, nối đúng một lần bằng `relationId`, vẽ theo chiều A→B. */
const linked = (relationId: string): Diagram => ({
  id: 'd',
  name: 't',
  nodes: [
    { id: 'a', blockTypeId: 'x', label: 'A', pos: { x: 0, y: 0 } },
    { id: 'b', blockTypeId: 'x', label: 'B', pos: { x: 0, y: 0 } },
  ],
  edges: [{ id: 'e1', relationId, source: 'a', target: 'b' }],
  ruleSetIds: [],
  localRules: [],
  visibility: defaultVisibility(),
  createdAt: '',
  updatedAt: '',
});

const draw = (d: Diagram, relationId: string, source: string, target: string, catalog: Relation[] = CATALOG) =>
  edgeWouldViolate(d, [], { relationId, source, target }, catalog);

describe('không vẽ lại liên kết đã có', () => {
  it('vẽ lại y nguyên chiều cũ thì chặn — quan hệ nào cũng thế', () => {
    expect(draw(linked('flow'), 'flow', 'a', 'b')).not.toBeNull();
    expect(draw(linked('friend'), 'friend', 'a', 'b')).not.toBeNull();
  });

  it('quan hệ HAI CHIỀU: vẽ ngược lại vẫn là trùng', () => {
    // Đây là lỗi người dùng gặp: A–B đã là bạn bè, bấm nối B–A vẫn lọt, canvas
    // đè hai đường lên nhau. Bạn bè hai chiều thì B–A chính là A–B nói lần nữa.
    expect(draw(linked('friend'), 'friend', 'b', 'a')).not.toBeNull();
  });

  it('quan hệ CÓ CHIỀU: vẽ ngược lại là cạnh THẬT, không được chặn', () => {
    // Quy trình quay ngược về bước trước là chuyện bình thường — chặn mới là sai.
    expect(draw(linked('flow'), 'flow', 'b', 'a')).toBeNull();
  });

  it('quan hệ khác trên cùng cặp khối thì không phải trùng', () => {
    expect(draw(linked('flow'), 'friend', 'a', 'b')).toBeNull();
  });

  it('thiếu danh mục thì chỉ so đúng chiều, không đoán bừa', () => {
    // Không có danh mục thì không biết quan hệ nào hai chiều, nên im lặng đúng
    // kiểu luật cấm khi `when` trỏ ra ngoài vốn từ vựng (DESIGN §8.4).
    expect(draw(linked('friend'), 'friend', 'a', 'b', [])).not.toBeNull();
    expect(draw(linked('friend'), 'friend', 'b', 'a', [])).toBeNull();
  });
});

describe('dữ liệu mẫu — không cặp nào nhân đôi được', () => {
  const asDiagram = (nodes: Diagram['nodes'], edges: Diagram['edges']): Diagram => ({
    id: 'd', name: 'x', nodes, edges, ruleSetIds: [], localRules: [],
    visibility: defaultVisibility(), createdAt: '', updatedAt: '',
  });

  // Ba loại có bộ luật: mọi quan hệ đều tự nói mình có chiều hay không, nên
  // không cạnh nào của mẫu vẽ ngược lại được.
  it.each(['tpl_family', 'tpl_org', 'tpl_school'])('%s: không cạnh nào vẽ ngược lại được', (id) => {
    const t = BUILTIN_TEMPLATES.find((x) => x.id === id)!;
    const { nodes, edges } = generateSample(t);
    const d = asDiagram(nodes, edges);
    const rules = t.ruleSets.flatMap((rs) => rs.rules);
    const leaks = edges.filter(
      (e) => !edgeWouldViolate(d, rules, { relationId: e.relationId, source: e.target, target: e.source }, t.relations),
    );
    expect(leaks.map((e) => `${e.relationId}: ${e.target}→${e.source}`)).toEqual([]);
  });

  it('loại CỐ Ý tự do thì vẫn cho vẽ ngược — không có khai báo thì không cấm', () => {
    // “Quy trình” không khai quan hệ nào hai chiều, và đó là chủ ý: Bước 2 → Bước 1
    // là vòng lặp có thật. Engine không suy ra hộ.
    const t = BUILTIN_TEMPLATES.find((x) => x.id === 'tpl_process')!;
    const { nodes, edges } = generateSample(t);
    const first = edges[0]!;
    expect(
      edgeWouldViolate(asDiagram(nodes, edges), [], { relationId: first.relationId, source: first.target, target: first.source }, t.relations),
    ).toBeNull();
  });
});
