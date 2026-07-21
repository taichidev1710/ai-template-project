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

/**
 * What a style Select currently SHOWS. Reads `.ant-select-content` — antd 6's
 * class for the chosen item; a check written against v5's
 * `.ant-select-selection-item` finds nothing and reads as "empty" even when the
 * field is fine. That mis-measurement once sent a whole debugging session the
 * wrong way, hence a named helper rather than an inline query.
 */
function shownValue(fieldLabel: string): string {
  const item = [...document.querySelectorAll('.ant-form-item')].find(
    (fi) => fi.querySelector('.ant-form-item-label label')?.textContent === fieldLabel,
  );
  return item?.querySelector('.ant-select .ant-select-content')?.textContent ?? '';
}

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

describe('EdgeDetailModal — các ô style luôn hiện giá trị đang áp', () => {
  it('cạnh chưa ghim gì: mỗi ô hiện giá trị KẾ THỪA của loại quan hệ, không trống', () => {
    renderModal(edge('e1'));
    // Giá trị đứng TRƯỚC chữ "theo loại": ô select bị cắt ở ~190px, nếu để
    // "Theo loại quan hệ (Nét đứt)" thì phần bị cắt đúng là phần cần đọc.
    expect(shownValue('Đường')).toBe('Thẳng · theo loại');
    expect(shownValue('Nét')).toBe('Nét đứt · theo loại');
    expect(shownValue('Mũi tên')).toBe('Không mũi · theo loại');
    expect(shownValue('Độ dày')).toBe('2px · theo loại');
    expect(shownValue('Nét chạy')).toBe('Đang tắt · theo loại');
  });

  it('cạnh ĐÃ ghim: hiện đúng giá trị riêng, không phải giá trị kế thừa', () => {
    renderModal({ ...edge('e3'), animated: true, style: { curve: 'taxi', line: 'dotted', arrow: 'circle', width: 4 } });
    expect(shownValue('Đường')).toBe('Bậc thang');
    expect(shownValue('Nét')).toBe('Chấm');
    expect(shownValue('Mũi tên')).toBe('Tròn');
    expect(shownValue('Độ dày')).toBe('4px');
    expect(shownValue('Nét chạy')).toBe('Bật cho riêng liên kết này');
  });

  it('mở cạnh khác không dính style của cạnh trước', () => {
    const common = {
      relation,
      sourceLabel: 'A',
      targetLabel: 'B',
      onSubmit: vi.fn(),
      onDelete: vi.fn(),
      onCancel: vi.fn(),
    };
    const { rerender } = renderModal({ ...edge('e3'), style: { line: 'dotted' } });
    expect(shownValue('Nét')).toBe('Chấm');

    rerender(<EdgeDetailModal open={false} edge={null} {...common} />);
    rerender(<EdgeDetailModal open edge={edge('e4')} {...common} />);

    expect(shownValue('Nét')).toBe('Nét đứt · theo loại');
  });
});
