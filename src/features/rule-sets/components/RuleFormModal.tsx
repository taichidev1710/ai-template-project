import { Form, InputNumber, Modal, Select, Typography } from 'antd';
import { useEffect } from 'react';
import type { BlockType, Relation, RuleType } from '@/domain/diagram';
import { isBaseRelation } from '@/domain/diagram';
import { DIRECTION_OPTIONS, RULE_TYPE_OPTIONS } from '../types';
import type { Rule, RuleInput } from '../types';

interface RuleFormModalProps {
  open: boolean;
  initialValue?: Rule | null;
  blockTypes: BlockType[];
  relations: Relation[];
  confirmLoading?: boolean;
  onSubmit: (values: RuleInput) => void;
  onCancel: () => void;
}

interface RuleFormShape {
  type: RuleType;
  blockType: string;
  relation: string;
  dir: 'in' | 'out' | 'any';
  count: number;
  from: string[];
  to: string[];
  order: string[];
  blockTypes: string[];
}

const BASE_DEFAULTS: Omit<RuleFormShape, 'relation'> = {
  type: 'require',
  blockType: '*',
  dir: 'in',
  count: 1,
  from: [],
  to: [],
  order: [],
  blockTypes: [],
};

function toFormShape(r: Rule): RuleFormShape {
  const base: RuleFormShape = { ...BASE_DEFAULTS, type: r.type, relation: r.relation };
  switch (r.type) {
    case 'require':
      return { ...base, blockType: r.blockType, dir: r.dir, count: r.min };
    case 'limit':
      return { ...base, blockType: r.blockType, dir: r.dir, count: r.max };
    case 'ends':
      return { ...base, from: [...r.from], to: [...r.to] };
    case 'chain':
      return { ...base, order: [...r.order] };
    case 'same':
      return { ...base, blockTypes: [...(r.blockTypes ?? [])] };
  }
}

export function RuleFormModal({ open, initialValue, blockTypes, relations, confirmLoading, onSubmit, onCancel }: RuleFormModalProps) {
  const [form] = Form.useForm<RuleFormShape>();
  const isEdit = Boolean(initialValue);
  const baseRelations = relations.filter(isBaseRelation);

  const blockOptions = blockTypes.map((b) => ({ value: b.id, label: b.name }));
  const blockOptionsWithAny = [{ value: '*', label: 'Mọi khối' }, ...blockOptions];
  const relationOptions = baseRelations.map((r) => ({ value: r.id, label: r.name }));

  const defaults: RuleFormShape = { ...BASE_DEFAULTS, relation: baseRelations[0]?.id ?? '' };

  useEffect(() => {
    if (open) form.setFieldsValue(initialValue ? toFormShape(initialValue) : defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValue, form]);

  const handleFinish = (v: RuleFormShape) => {
    switch (v.type) {
      case 'require':
        return onSubmit({ type: 'require', blockType: v.blockType, relation: v.relation, dir: v.dir, min: v.count });
      case 'limit':
        return onSubmit({ type: 'limit', blockType: v.blockType, relation: v.relation, dir: v.dir, max: v.count });
      case 'ends':
        return onSubmit({ type: 'ends', relation: v.relation, from: v.from, to: v.to });
      case 'chain':
        return onSubmit({ type: 'chain', relation: v.relation, order: v.order });
      case 'same':
        return onSubmit({ type: 'same', relation: v.relation, blockTypes: v.blockTypes });
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Sửa luật' : 'Thêm luật'}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={560}
    >
      <Form<RuleFormShape> form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item name="type" label="Loại luật">
          <Select options={RULE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
        </Form.Item>

        {/* Hint for the chosen rule type. */}
        <Form.Item noStyle shouldUpdate={(a, b) => a.type !== b.type}>
          {({ getFieldValue }) => {
            const hint = RULE_TYPE_OPTIONS.find((o) => o.value === getFieldValue('type'))?.hint;
            return (
              <Typography.Paragraph type="secondary" className="!mb-3 text-xs">
                {hint}
              </Typography.Paragraph>
            );
          }}
        </Form.Item>

        <Form.Item name="relation" label="Quan hệ (R)" rules={[{ required: true, message: 'Chọn quan hệ' }]}>
          <Select options={relationOptions} placeholder="Chọn quan hệ nền" notFoundContent="Chưa có quan hệ nền — tạo ở tab Quan hệ" />
        </Form.Item>

        {/* shouldUpdate (not useWatch) — avoids the destroyOnHidden Modal close bug. */}
        <Form.Item noStyle shouldUpdate={(a, b) => a.type !== b.type}>
          {({ getFieldValue }) => {
            const type = getFieldValue('type') as RuleType;
            if (type === 'require' || type === 'limit') {
              return (
                <div className="grid grid-cols-2 gap-x-4">
                  <Form.Item name="blockType" label="Loại khối (X)">
                    <Select options={blockOptionsWithAny} />
                  </Form.Item>
                  <Form.Item name="dir" label="Chiều liên kết">
                    <Select options={DIRECTION_OPTIONS} />
                  </Form.Item>
                  <Form.Item name="count" label={type === 'require' ? 'Tối thiểu (N)' : 'Tối đa (N)'}>
                    <InputNumber min={0} max={20} className="w-full" />
                  </Form.Item>
                </div>
              );
            }
            if (type === 'ends') {
              return (
                <>
                  <Form.Item name="from" label="Từ nhóm khối (A)" rules={[{ required: true, message: 'Chọn ít nhất 1 khối' }]}>
                    <Select mode="multiple" options={blockOptions} placeholder="Đầu đi" />
                  </Form.Item>
                  <Form.Item name="to" label="Đến nhóm khối (B)" rules={[{ required: true, message: 'Chọn ít nhất 1 khối' }]}>
                    <Select mode="multiple" options={blockOptions} placeholder="Đầu đến" />
                  </Form.Item>
                </>
              );
            }
            if (type === 'chain') {
              return (
                <Form.Item name="order" label="Thứ tự các loại khối (chọn lần lượt A → B → C)" rules={[{ required: true, message: 'Chọn thứ tự khối' }]}>
                  <Select mode="multiple" options={blockOptions} placeholder="Chọn lần lượt theo thứ tự" />
                </Form.Item>
              );
            }
            // same
            return (
              <Form.Item name="blockTypes" label="Giới hạn ở các loại khối (tuỳ chọn)">
                <Select mode="multiple" options={blockOptions} placeholder="Bỏ trống = mọi khối cùng loại" allowClear />
              </Form.Item>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
}
