import { Checkbox, ColorPicker, Form, Input, InputNumber, Modal, Radio, Select } from 'antd';
import type { AggregationColor } from 'antd/es/color-picker/color';
import { useEffect } from 'react';
import { isDerivedRelation } from '@/domain/diagram';
import { PatternBuilder } from './PatternBuilder';
import { ARROW_OPTIONS, CURVE_OPTIONS, EXCLUDE_OPTIONS, LINE_OPTIONS, ROLE_OPTIONS } from '../types';
import type { Relation, RelationInput } from '../types';

interface RelationFormModalProps {
  open: boolean;
  initialValue?: Relation | null;
  /** Base relations of this type — derived relations walk over one of them. */
  baseRelations: Relation[];
  confirmLoading?: boolean;
  onSubmit: (values: RelationInput) => void;
  onCancel: () => void;
}

/** Internal flat form shape; assembled into a RelationInput on submit. */
interface FormShape {
  name: string;
  kind: 'base' | 'derived';
  role: 'primary' | 'secondary';
  overRelationId?: string;
  pattern: ('up' | 'down')[];
  exclude: ('parents' | 'children' | 'siblings')[];
  style: {
    line: RelationInput['style']['line'];
    arrow: RelationInput['style']['arrow'];
    curve: RelationInput['style']['curve'];
    color: string;
    width: number;
  };
}

const DEFAULTS: FormShape = {
  name: '',
  kind: 'base',
  role: 'secondary',
  overRelationId: undefined,
  pattern: [],
  exclude: [],
  style: { line: 'solid', arrow: 'triangle', curve: 'straight', color: '#5b647e', width: 2 },
};

function toFormShape(r: Relation): FormShape {
  const base: FormShape = { ...DEFAULTS, name: r.name, kind: r.kind, style: { ...r.style, color: r.style.color } as FormShape['style'] };
  if (isDerivedRelation(r)) {
    // `self` is always excluded by the engine, so it isn't a form checkbox.
    const exclude = (r.exclude ?? []).filter((e): e is 'parents' | 'children' | 'siblings' => e !== 'self');
    return { ...base, overRelationId: r.overRelationId, pattern: [...r.pattern], exclude };
  }
  return { ...base, role: r.role };
}

export function RelationFormModal({ open, initialValue, baseRelations, confirmLoading, onSubmit, onCancel }: RelationFormModalProps) {
  const [form] = Form.useForm<FormShape>();
  const isEdit = Boolean(initialValue);

  useEffect(() => {
    if (open) form.setFieldsValue(initialValue ? toFormShape(initialValue) : DEFAULTS);
  }, [open, initialValue, form]);

  const handleFinish = (v: FormShape) => {
    if (v.kind === 'derived') {
      onSubmit({
        name: v.name,
        kind: 'derived',
        overRelationId: v.overRelationId ?? baseRelations[0]?.id ?? '',
        pattern: v.pattern,
        exclude: v.exclude,
        style: v.style,
        visibleByDefault: false,
      });
    } else {
      onSubmit({ name: v.name, kind: 'base', role: v.role, style: v.style });
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Sửa quan hệ' : 'Thêm quan hệ'}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={560}
    >
      <Form<FormShape> form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên quan hệ' }]}>
          <Input placeholder="VD: Cha mẹ – con, Trực thuộc, Ông bà…" />
        </Form.Item>

        <Form.Item name="kind" label="Loại quan hệ">
          <Radio.Group
            optionType="button"
            options={[
              { value: 'base', label: 'Nền (vẽ & lưu)' },
              { value: 'derived', label: 'Suy ra (tự tính)' },
            ]}
          />
        </Form.Item>

        {/* shouldUpdate (not useWatch) — avoids the destroyOnHidden Modal close bug. */}
        <Form.Item noStyle shouldUpdate={(a, b) => a.kind !== b.kind}>
          {({ getFieldValue }) =>
            getFieldValue('kind') === 'derived' ? (
              <>
                <Form.Item name="overRelationId" label="Đi trên quan hệ nền" rules={[{ required: true, message: 'Chọn quan hệ nền' }]}>
                  <Select
                    placeholder="Chọn quan hệ nền để suy ra"
                    options={baseRelations.map((r) => ({ value: r.id, label: r.name }))}
                    notFoundContent="Chưa có quan hệ nền — tạo một quan hệ Nền trước"
                  />
                </Form.Item>
                <Form.Item name="pattern" label="Đường đi (pattern)" rules={[{ required: true, message: 'Thêm ít nhất 1 bước' }]}>
                  <PatternBuilder />
                </Form.Item>
                <Form.Item name="exclude" label="Loại trừ khỏi kết quả (luôn trừ chính nó)">
                  <Checkbox.Group options={EXCLUDE_OPTIONS} />
                </Form.Item>
              </>
            ) : (
              <Form.Item name="role" label="Vai trò">
                <Select options={ROLE_OPTIONS} />
              </Form.Item>
            )
          }
        </Form.Item>

        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name={['style', 'line']} label="Kiểu nét">
            <Select options={LINE_OPTIONS} />
          </Form.Item>
          <Form.Item name={['style', 'arrow']} label="Mũi tên">
            <Select options={ARROW_OPTIONS} />
          </Form.Item>
          <Form.Item name={['style', 'curve']} label="Dáng đường">
            <Select options={CURVE_OPTIONS} />
          </Form.Item>
          <Form.Item name={['style', 'width']} label="Độ dày">
            <InputNumber min={1} max={8} step={0.5} className="w-full" />
          </Form.Item>
          <Form.Item
            name={['style', 'color']}
            label="Màu"
            getValueFromEvent={(color: AggregationColor) => color.toHexString()}
          >
            <ColorPicker format="hex" showText />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
