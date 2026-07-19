import { describe, it, expect } from 'vitest';
import type cytoscape from 'cytoscape';
import { buildStylesheet, type CanvasTheme } from './cy-style';

const theme: CanvasTheme = {
  colorText: '#000000',
  colorTextSecondary: '#666666',
  colorBgContainer: '#ffffff',
  colorBorder: '#cccccc',
  colorError: '#ff0000',
  colorWarning: '#ffaa00',
  colorSuccess: '#00aa00',
  fontFamily: 'sans-serif',
};

/** Run the stylesheet's own `label` mapper over a fake edge's data. */
function labelOf(sheet: cytoscape.StylesheetJson, data: Record<string, unknown>): string {
  const edgeRule = (sheet as { selector: string; style: Record<string, unknown> }[]).find(
    (s) => s.selector === 'edge',
  );
  const mapper = edgeRule?.style.label as (e: cytoscape.EdgeSingular) => string;
  return mapper({ data: (k: string) => data[k] } as unknown as cytoscape.EdgeSingular);
}

/** Run the stylesheet's node `label` mapper over a fake node's data. */
function nodeLabelOf(sheet: cytoscape.StylesheetJson, data: Record<string, unknown>): string {
  const nodeRule = (sheet as { selector: string; style: Record<string, unknown> }[]).find(
    (s) => s.selector === 'node',
  );
  const mapper = nodeRule?.style.label as (e: cytoscape.NodeSingular) => string;
  return mapper({ data: (k: string) => data[k] } as unknown as cytoscape.NodeSingular);
}

const parentEdge = { rel: 'rel_parent', label: '', relName: 'Cha mẹ – con' };
const derivedEdge = { rel: 'der_sibling', label: '', relName: 'Anh chị em (suy ra)' };

describe('node label', () => {
  it('appends ⊕N while the node hides a collapsed branch, and only then', () => {
    const sheet = buildStylesheet(theme, false, true);
    expect(nodeLabelOf(sheet, { label: 'Quản lý 2', hc: 3 })).toBe('Quản lý 2 ⊕3');
    expect(nodeLabelOf(sheet, { label: 'Quản lý 2' })).toBe('Quản lý 2');
    expect(nodeLabelOf(sheet, { label: 'Quản lý 2', hc: 0 })).toBe('Quản lý 2');
  });
});

describe('edge label', () => {
  it('falls back to the relation name when the edge has none of its own', () => {
    expect(labelOf(buildStylesheet(theme, false, true), parentEdge)).toBe('Cha mẹ – con');
    expect(labelOf(buildStylesheet(theme, false, true), derivedEdge)).toBe('Anh chị em (suy ra)');
  });

  it("prefers the edge's own label over the relation name", () => {
    const sheet = buildStylesheet(theme, false, true);
    expect(labelOf(sheet, { ...parentEdge, label: 'nuôi' })).toBe('nuôi');
  });

  it('the master switch mutes every label', () => {
    expect(labelOf(buildStylesheet(theme, false, false), parentEdge)).toBe('');
    expect(labelOf(buildStylesheet(theme, false, false), { ...parentEdge, label: 'nuôi' })).toBe('');
  });

  it('mutes only the relations named — the rest keep their labels', () => {
    const sheet = buildStylesheet(theme, false, true, ['der_sibling']);
    expect(labelOf(sheet, derivedEdge)).toBe('');
    expect(labelOf(sheet, parentEdge)).toBe('Cha mẹ – con');
  });

  it('muting a label does NOT drop the edge — that is what hiddenRelations is for', () => {
    // The mapper only ever returns the text; nothing here can remove a line.
    const sheet = buildStylesheet(theme, false, true, ['rel_parent']);
    expect(labelOf(sheet, parentEdge)).toBe('');
    const edgeRule = (sheet as { selector: string }[]).find((s) => s.selector === 'edge');
    expect(edgeRule).toBeDefined();
  });
});
