import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { DiagramEdge, Relation } from '@/domain/diagram';
import { EdgeDetailModal } from './EdgeDetailModal';

const relation: Relation = {
  id: 'rel_spouse',
  name: 'Vợ chồng',
  kind: 'base',
  role: 'secondary',
  style: { line: 'dashed', arrow: 'none', curve: 'straight', color: '#c46ba0', width: 2 },
};

const edge = (id: string, label?: string): DiagramEdge => ({
  id,
  relationId: 'rel_spouse',
  source: 'a',
  target: 'b',
  ...(label !== undefined ? { label } : {}),
});

function renderModal(e: DiagramEdge | null, open = true) {
  return render(
    <EdgeDetailModal
      open={open}
      edge={e}
      relation={relation}
      sourceLabel="A"
      targetLabel="B"
      onSubmit={vi.fn()}
      onDelete={vi.fn()}
      onCancel={vi.fn()}
    />,
  );
}

const labelInput = () => document.querySelector('#label') as HTMLInputElement | null;

describe('EdgeDetailModal — nhãn theo đúng cạnh đang mở', () => {
  it('cạnh CÓ nhãn thì hiện đúng nhãn đó (clearOnDestroy không được xoá mất)', () => {
    // Đây là nửa còn lại của lỗi store dùng chung: `clearOnDestroy` xoá store khi
    // form unmount, nhưng lần mở sau PHẢI nạp lại nhãn của cạnh mới. Nếu nó xoá
    // rồi không nạp lại, ô sẽ trống dù cạnh có nhãn.
    renderModal(edge('e1', 'kỷ niệm'));
    expect(labelInput()?.value).toBe('kỷ niệm');
  });

  it('cạnh KHÔNG nhãn thì ô trống', () => {
    renderModal(edge('e2'));
    expect(labelInput()?.value).toBe('');
  });

  it('mở cạnh khác KHÔNG được dính nhãn của cạnh trước', () => {
    // e1 có nhãn "cũ"; đóng modal; mở e2 không nhãn ⇒ phải trống, không phải "cũ".
    const { rerender } = renderModal(edge('e1', 'cũ'));
    expect(labelInput()?.value).toBe('cũ');

    const common = {
      relation,
      sourceLabel: 'A',
      targetLabel: 'B',
      onSubmit: vi.fn(),
      onDelete: vi.fn(),
      onCancel: vi.fn(),
    };
    rerender(<EdgeDetailModal open={false} edge={null} {...common} />);
    rerender(<EdgeDetailModal open edge={edge('e2')} {...common} />);

    expect(labelInput()?.value).toBe('');
  });
});
