import { describe, it, expect } from 'vitest';
import type { DiagramNode } from '@/domain/diagram';
import { noDia, searchNodes } from './search';

const node = (id: string, label: string, notes?: string): DiagramNode => ({
  id,
  blockTypeId: 'bt_person',
  label,
  pos: { x: 0, y: 0 },
  ...(notes ? { notes } : {}),
});

const nodes = [node('n1', 'Nguyễn Văn An'), node('n2', 'Trần Thị Bình', 'con dâu'), node('n3', 'Đỗ Hùng')];

describe('noDia', () => {
  it('strips Vietnamese accents and lowercases', () => {
    expect(noDia('Nguyễn')).toBe('nguyen');
    expect(noDia('Vợ')).toBe('vo');
    expect(noDia('Trần Thị')).toBe('tran thi');
  });

  it('handles đ/Đ, which NFD does not decompose', () => {
    expect(noDia('Đỗ')).toBe('do');
    expect(noDia('đường')).toBe('duong');
  });
});

describe('searchNodes', () => {
  it('matches without typing accents', () => {
    expect(searchNodes(nodes, 'nguyen').map((m) => m.id)).toEqual(['n1']);
    expect(searchNodes(nodes, 'do hung').map((m) => m.id)).toEqual(['n3']);
  });

  it('matches accented input too', () => {
    expect(searchNodes(nodes, 'Nguyễn').map((m) => m.id)).toEqual(['n1']);
  });

  it('searches notes as well as labels', () => {
    expect(searchNodes(nodes, 'dau').map((m) => m.id)).toEqual(['n2']);
  });

  it('returns nothing for an empty or blank query', () => {
    expect(searchNodes(nodes, '')).toEqual([]);
    expect(searchNodes(nodes, '   ')).toEqual([]);
  });

  it('caps the result count', () => {
    const many = Array.from({ length: 20 }, (_, i) => node(`n${i}`, `Người ${i}`));
    expect(searchNodes(many, 'nguoi', 5)).toHaveLength(5);
  });
});
