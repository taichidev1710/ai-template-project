import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BUILTIN_TEMPLATES } from '@/domain/diagram';
import { EdgeFormModal, type EdgePair } from './EdgeFormModal';

const family = BUILTIN_TEMPLATES.find((t) => t.id === 'tpl_family')!;

const pair = (source: string, target: string): EdgePair => ({
  source, target, sourceLabel: source, targetLabel: target,
});

/** Whatever the relation box is currently showing. */
const shown = () => document.querySelector('.ant-select-content')?.textContent ?? '(trống)';
const okButton = () => screen.getByRole('button', { name: 'Nối' });

function renderModal(props: Partial<Parameters<typeof EdgeFormModal>[0]> = {}) {
  return render(
    <EdgeFormModal
      open
      pair={pair('a', 'b')}
      relations={family.relations}
      blockedByRule={() => null}
      existingLinks={[]}
      onSubmit={vi.fn()}
      onCancel={vi.fn()}
      {...props}
    />,
  );
}

describe('EdgeFormModal — quan hệ mở sẵn', () => {
  it('mở ở quan hệ đầu tiên mà luật CHO PHÉP, không phải quan hệ đầu danh sách', () => {
    // Chặn “Cha mẹ – con” và “Vợ chồng” ⇒ phải mở ở “Bạn bè”.
    renderModal({ blockedByRule: (id) => (id === 'rel_friend' ? null : 'phạm luật') });
    expect(shown()).toContain('Bạn bè');
    expect(okButton()).toBeEnabled();
  });

  it('mọi quan hệ đều bị chặn thì mở ở cái đầu tiên và khoá nút Nối', () => {
    renderModal({ blockedByRule: () => 'phạm luật' });
    expect(shown()).toContain('Cha mẹ – con');
    expect(okButton()).toBeDisabled();
  });

  it('LẦN NỐI THỨ HAI không được giữ quan hệ của lần trước', async () => {
    // Lỗi thật, chỉ hiện từ lần nối thứ 2 nên 134 test cũ không ai bắt được:
    // `form` sinh từ useForm() ở component KHÔNG BAO GIỜ unmount, nên store của
    // nó sống qua cả `destroyOnHidden` lẫn đổi `key`; rc-field-form khi khởi tạo
    // lại còn merge `initialValues` XUỐNG DƯỚI store cũ. Kết quả: ô hiển thị quan
    // hệ của cặp trước (“Cha mẹ – con — phạm luật”) trong khi nút Nối lại xét
    // state đúng ⇒ hai bên nói hai điều khác nhau. Chữa bằng `clearOnDestroy`.
    const allBlocked = () => 'phạm luật';
    const onlyFriend = (id: string) => (id === 'rel_friend' ? null : 'phạm luật');

    const { rerender } = renderModal({ blockedByRule: allBlocked, pair: pair('a', 'b') });
    expect(shown()).toContain('Cha mẹ – con'); // cặp 1: không còn lựa chọn nào

    const props = {
      relations: family.relations,
      existingLinks: [],
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
    };
    // Đóng modal (destroyOnHidden gỡ form), rồi mở lại cho cặp khác.
    rerender(<EdgeFormModal open={false} pair={null} blockedByRule={allBlocked} {...props} />);
    rerender(<EdgeFormModal open pair={pair('c', 'd')} blockedByRule={onlyFriend} {...props} />);

    expect(shown()).toContain('Bạn bè');
    expect(shown()).not.toContain('phạm luật');
    expect(okButton()).toBeEnabled();
  });
});

describe('EdgeFormModal — nói rõ cặp khối đang có gì', () => {
  it('kể ra liên kết đã có, và nói rõ nối tiếp là THÊM chứ không thay', () => {
    renderModal({ existingLinks: ['Vợ chồng'] });
    expect(screen.getByText(/đã có: Vợ chồng/)).toBeInTheDocument();
    expect(screen.getByText(/thêm một liên kết NỮA/)).toBeInTheDocument();
  });

  it('chưa có gì thì không bày thêm chữ', () => {
    renderModal({ existingLinks: [] });
    expect(screen.queryByText(/đã có:/)).not.toBeInTheDocument();
  });
});
