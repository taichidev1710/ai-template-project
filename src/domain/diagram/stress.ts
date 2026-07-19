/**
 * Stress-data generator — a PERFORMANCE tool, not a sample.
 *
 * `generateSample` builds small, rule-valid content; this builds BIG content
 * (the demo's `makeStressState`) to exercise the canvas: viewport culling, the
 * render cap, pan/zoom, search across thousands of blocks. Like everything in
 * this folder it reads only the template's own vocabulary — block types cycle
 * by tier, the primary relation forms the tree, the remaining base relations
 * join random peers — and it deliberately does NOT consult the rules: stress
 * data may violate them, and the violations panel saying so honestly is part
 * of what gets exercised. The demo behaved the same.
 *
 * Deterministic on purpose (fixed-seed PRNG): the same request builds the same
 * diagram, so a perf comparison across code changes measures the code, not the
 * dice.
 */
import { isBaseRelation, type DiagramEdge, type DiagramNode, type DiagramTemplate } from './types';
import type { SampleContent } from './sample';

/** Same grid the demo laid its stress tree on. */
const COL_GAP = 95;
const ROW_GAP = 175;
/** Lateral links: 5% of the block count, but never more than this. */
const MAX_PEER_EDGES = 300;
/** The first peer edges animate, so the ants loop is part of the exercise. */
const ANIMATED_PEERS = 25;
export const MAX_STRESS_BLOCKS = 20000;

/** mulberry32 — tiny deterministic PRNG, uniform in [0, 1). */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface StressNode {
  id: string;
  depth: number;
  children: StressNode[];
  parent?: StressNode;
  x: number;
  y: number;
}

/**
 * `count` blocks in a tree over the primary relation (2–4 children each), laid
 * out tier by tier, plus a sprinkle of lateral links. A template with no base
 * relation gets a plain grid of unlinked blocks — there is nothing to join
 * them with.
 */
export function generateStress(template: DiagramTemplate, count: number): SampleContent {
  const blockTypes = template.blockTypes;
  const firstType = blockTypes[0];
  if (!firstType) return { nodes: [], edges: [] };
  const n = Math.max(1, Math.min(MAX_STRESS_BLOCKS, Math.floor(count)));
  const rnd = prng(0xc0ffee);
  const randInt = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

  const bases = template.relations.filter(isBaseRelation);
  const primary = bases.find((r) => r.role === 'primary') ?? bases[0];

  const root: StressNode = { id: 's0', depth: 0, children: [], x: 0, y: 0 };
  const all: StressNode[] = [root];

  if (primary) {
    // Breadth-first: each parent takes 2–4 children until the budget runs out.
    const queue: StressNode[] = [root];
    while (all.length < n && queue.length > 0) {
      const parent = queue.shift();
      if (!parent) break;
      const want = randInt(2, 4);
      for (let i = 0; i < want && all.length < n; i++) {
        const child: StressNode = { id: `s${all.length}`, depth: parent.depth + 1, children: [], parent, x: 0, y: 0 };
        parent.children.push(child);
        all.push(child);
        queue.push(child);
      }
    }
    // Post-order layout: leaves take successive columns, parents centre on
    // their children — the demo's iterative walk, no recursion to overflow.
    let leaf = 0;
    const stack: { node: StressNode; next: number }[] = [{ node: root, next: 0 }];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (!frame) break;
      const pending = frame.node.children[frame.next];
      if (pending) {
        frame.next += 1;
        stack.push({ node: pending, next: 0 });
        continue;
      }
      const { node } = frame;
      const first = node.children[0];
      const last = node.children[node.children.length - 1];
      if (!first || !last) node.x = leaf++ * COL_GAP;
      else node.x = (first.x + last.x) / 2;
      node.y = node.depth * ROW_GAP;
      stack.pop();
    }
  } else {
    // No relations to build a tree with: a grid still measures raw rendering.
    const cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.4)));
    for (let i = 1; i < n; i++) all.push({ id: `s${i}`, depth: 0, children: [], x: 0, y: 0 });
    all.forEach((node, i) => {
      node.x = (i % cols) * 140;
      node.y = Math.floor(i / cols) * 165;
    });
  }

  const nodes: DiagramNode[] = all.map((node, i) => ({
    id: node.id,
    blockTypeId: (blockTypes[node.depth % blockTypes.length] ?? firstType).id,
    label: `Khối ${i}`,
    pos: { x: Math.round(node.x), y: Math.round(node.y) },
  }));

  const edges: DiagramEdge[] = [];
  if (primary) {
    for (const node of all) {
      if (node.parent) edges.push({ id: `se_${node.id}`, relationId: primary.id, source: node.parent.id, target: node.id });
    }
    // Lateral links spread across the OTHER base relations (or the primary when
    // it is all the template declares) — random pairs, so some will break the
    // rules; that is stress data being honest, not a bug.
    const peerRelations = bases.filter((r) => r !== primary);
    const pool = peerRelations.length > 0 ? peerRelations : [primary];
    const peerCount = Math.min(MAX_PEER_EDGES, Math.floor(n * 0.05));
    for (let i = 0; i < peerCount; i++) {
      const a = all[randInt(0, all.length - 1)];
      const b = all[randInt(0, all.length - 1)];
      const relation = pool[i % pool.length];
      if (!a || !b || !relation || a === b) continue;
      edges.push({
        id: `pe_${i}`,
        relationId: relation.id,
        source: a.id,
        target: b.id,
        ...(i < ANIMATED_PEERS ? { animated: true } : {}),
      });
    }
  }

  return { nodes, edges };
}
