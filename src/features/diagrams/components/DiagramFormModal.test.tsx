import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BUILTIN_TEMPLATES, defaultVisibility, type Diagram } from '@/domain/diagram';
import { DiagramFormModal } from './DiagramFormModal';

const types = [...BUILTIN_TEMPLATES];
const family = types.find((t) => t.id === 'tpl_family')!;

function open(props?: { initialValue?: Diagram | null; onSubmit?: (v: unknown) => void }) {
  const onSubmit = props?.onSubmit ?? vi.fn();
  render(
    <DiagramFormModal
      open
      types={types}
      initialValue={props?.initialValue ?? null}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  );
  return { onSubmit };
}

const pickType = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('combobox', { name: 'Loại sơ đồ' }));
  await user.click(await screen.findByTitle(new RegExp(name)));
};

describe('DiagramFormModal — sample data', () => {
  it('asks for sample data only once a type is picked', async () => {
    const user = userEvent.setup();
    open();
    // Nothing to generate FROM yet: the type owns the vocabulary the sample uses.
    expect(screen.getByRole('checkbox', { name: 'Tạo kèm dữ liệu mẫu' })).toBeDisabled();
    await pickType(user, 'Gia đình');
    expect(screen.getByRole('checkbox', { name: 'Tạo kèm dữ liệu mẫu' })).toBeEnabled();
  });

  it('submits withSample only when the box is ticked', async () => {
    const user = userEvent.setup();
    const { onSubmit } = open();

    await user.type(screen.getByRole('textbox', { name: 'Tên' }), 'Thử');
    await pickType(user, 'Gia đình');
    await user.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ withSample: false }));

    await user.click(screen.getByRole('checkbox', { name: 'Tạo kèm dữ liệu mẫu' }));
    await user.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'Thử', templateId: 'tpl_family', withSample: true }),
    );
  });

  it('is hidden when editing — sample data would replace what the canvas owns', () => {
    const existing: Diagram = {
      id: 'd1',
      name: 'Đang có',
      templateId: family.id,
      nodes: [],
      edges: [],
      ruleSetIds: [],
      localRules: [],
      visibility: defaultVisibility(),
      createdAt: '',
      updatedAt: '',
    };
    open({ initialValue: existing });
    expect(screen.queryByRole('checkbox', { name: 'Tạo kèm dữ liệu mẫu' })).not.toBeInTheDocument();
  });
});
