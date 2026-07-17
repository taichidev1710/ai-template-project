import { Checkbox, ColorPicker, Form, Input, InputNumber, Modal, Radio, Select, Switch } from 'antd';
import type { AggregationColor } from 'antd/es/color-picker/color';
import { useEffect } from 'react';
import { isBaseRelation, isDerivedRelation } from '@/domain/diagram';
import { PatternBuilder } from './PatternBuilder';
import { ARROW_OPTIONS, CURVE_OPTIONS, EXCLUDE_OPTIONS, LINE_OPTIONS, ROLE_OPTIONS } from '../types';
import type { BaseRelation, Relation, RelationInput, RelationStep } from '../types';

interface RelationFormModalProps {
  open: boolean;
  initialValue?: Relation | null;
  /** All relations of this type — the pattern builder walks the base ones. */
  relations: Relation[];
  confirmLoading?: boolean;
  onSubmit: (values: RelationInput) => void;
  onCancel: () => void;
}

interface FormShape {
  name: string;
  kind: 'base' | 'derived';
  role: 'primary' | 'secondary';
  symmetric: boolean;
  pattern: RelationStep[];
  exclude: ('parents' | 'children' | 'siblings')[];
  style: {
    line: RelationInput['style']['line'];
    arrow: RelationInput['style']['arrow'];
    curve: RelationInput['style']['curve'];
    color: string;
    width: number;
    animated: boolean;
  };
}

const DEFAULTS: FormShape = {
  name: '',
  kind: 'base',
  role: 'secondary',
  symmetric: false,
  pattern: [],
  exclude: [],
  style: { line: 'solid', arrow: 'triangle', curve: 'straight', color: '#5b647e', width: 2, animated: false },
};

function toFormShape(r: Relation): FormShape {
  const base: FormShape = {
    ...DEFAULTS,
    name: r.name,
    kind: r.kind,
    style: { ...r.style, animated: Boolean(r.style.animated) } as FormShape['style'],
  };
  if (isDerivedRelation(r)) {
    const exclude = (r.exclude ?? []).filter((e): e is 'parents' | 'children' | 'siblings' => e !== 'self');
    return { ...base, pattern: [...r.pattern], exclude };
  }
  return { ...base, role: r.role, symmetric: Boolean(r.symmetric) };
}

export function RelationFormModal({ open, initialValue, relations, confirmLoading, onSubmit, onCancel }: RelationFormModalProps) {
  const [form] = Form.useForm<FormShape>();
  const isEdit = Boolean(initialValue);
  // A derived relation should not walk over itself when editing.
  const baseRelations = relations.filter(
    (r): r is BaseRelation => isBaseRelation(r) && r.id !== initialValue?.id,
  );

  useEffect(() => {
    if (open) form.setFieldsValue(initialValue ? toFormShape(initialValue) : DEFAULTS);
  }, [open, initialValue, form]);

  const handleFinish = (v: FormShape) => {
    if (v.kind === 'derived') {
      onSubmit({ name: v.name, kind: 'derived', pattern: v.pattern, exclude: v.exclude, style: v.style, visibleByDefault: false });
    } else {
      onSubmit({ name: v.name, kind: 'base', role: v.role, symmetric: v.symmetric, style: v.style });
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
          <Input placeholder="VD: Cha mẹ – con, Ông bà, Con dâu/rể…" />
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
                <Form.Item
                  name="pattern"
                  label="Đường đi (mỗi bước = quan hệ + hướng)"
                  rules={[{ required: true, message: 'Thêm ít nhất 1 bước' }]}
                >
                  <PatternBuilder baseRelations={baseRelations} />
                </Form.Item>
                <Form.Item name="exclude" label="Loại trừ khỏi kết quả (luôn trừ chính nó)">
                  <Checkbox.Group options={EXCLUDE_OPTIONS} />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name="role" label="Vai trò">
                  <Select options={ROLE_OPTIONS} />
                </Form.Item>
                <Form.Item
                  name="symmetric"
                  label="Hai chiều"
                  valuePropName="checked"
                  extra="Bật khi A–B và B–A là CÙNG một liên kết (vợ chồng, bạn bè, phối hợp) — vẽ lại chiều ngược sẽ bị chặn vì trùng. Tắt khi chiều có ý nghĩa và chiều ngược là liên kết khác (quy trình quay lại bước trước)."
                >
                  <Switch />
                </Form.Item>
              </>
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
          <Form.Item name={['style', 'color']} label="Màu" getValueFromEvent={(color: AggregationColor) => color.toHexString()}>
            <ColorPicker format="hex" showText />
          </Form.Item>
        </div>

        {/* Default for every link of this kind; a single link can override it in
            the canvas's link detail. Only reads on dashed/dotted lines. */}
        <Form.Item noStyle shouldUpdate={(a, b) => a.style?.line !== b.style?.line}>
          {({ getFieldValue }) => (
            <Form.Item
              name={['style', 'animated']}
              label="Nét chạy"
              valuePropName="checked"
              extra={
                getFieldValue(['style', 'line']) === 'solid'
                  ? 'Nét liền không thấy hiệu ứng — chọn kiểu nét gạch/chấm ở trên để thấy rõ.'
                  : 'Mặc định cho mọi liên kết thuộc loại này; từng liên kết vẫn chỉnh riêng được trên canvas.'
              }
            >
              <Switch />
            </Form.Item>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}
