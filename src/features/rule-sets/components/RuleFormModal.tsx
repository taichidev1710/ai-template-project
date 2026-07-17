import { Form, InputNumber, Modal, Segmented, Select, Typography } from 'antd';
import { useEffect } from 'react';
import type { BlockType, Relation, RuleType } from '@/domain/diagram';
import { isBaseRelation } from '@/domain/diagram';
import { PatternBuilder } from '@/features/relation-types';
import { DIRECTION_OPTIONS, RULE_TYPE_OPTIONS } from '../types';
import type { ForbidSource, RelationStep, Rule, RuleInput } from '../types';

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
  /** forbid: name a declared relation, or spell the hops out — `forbidSource` picks. */
  forbidSource: ForbidSource;
  when: string;
  pattern: RelationStep[];
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
  forbidSource: 'when',
  when: '',
  pattern: [],
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
    case 'forbid':
      return {
        ...base,
        forbidSource: r.when ? 'when' : 'pattern',
        when: r.when ?? '',
        pattern: (r.pattern ?? []).map((s) => ({ ...s })),
      };
  }
}

export function RuleFormModal({ open, initialValue, blockTypes, relations, confirmLoading, onSubmit, onCancel }: RuleFormModalProps) {
  const [form] = Form.useForm<RuleFormShape>();
  const isEdit = Boolean(initialValue);
  const baseRelations = relations.filter(isBaseRelation);

  const blockOptions = blockTypes.map((b) => ({ value: b.id, label: b.name }));
  const blockOptionsWithAny = [{ value: '*', label: 'Mọi khối' }, ...blockOptions];
  const relationOptions = baseRelations.map((r) => ({ value: r.id, label: r.name }));
  // A forbid rule's `when` may name a DERIVED relation ("Anh chị em (suy ra)") —
  // the relationship is real even though no one drew an edge for it.
  const allRelationOptions = relations.map((r) => ({ value: r.id, label: r.name }));

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
      case 'forbid':
        // Exactly one of the two — carrying both would leave a stale path behind
        // a named relation, and the engine would quietly ignore it.
        return onSubmit(
          v.forbidSource === 'when'
            ? { type: 'forbid', relation: v.relation, when: v.when }
            : { type: 'forbid', relation: v.relation, pattern: v.pattern },
        );
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

        {/* For every other type this is the relation being constrained; for
            `forbid` it is the one being banned, so the label has to say so. */}
        <Form.Item noStyle shouldUpdate={(a, b) => a.type !== b.type}>
          {({ getFieldValue }) => (
            <Form.Item
              name="relation"
              label={getFieldValue('type') === 'forbid' ? 'Quan hệ bị cấm (R)' : 'Quan hệ (R)'}
              rules={[{ required: true, message: 'Chọn quan hệ' }]}
            >
              <Select options={relationOptions} placeholder="Chọn quan hệ nền" notFoundContent="Chưa có quan hệ nền — tạo ở tab Quan hệ" />
            </Form.Item>
          )}
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
            if (type === 'forbid') {
              return (
                <>
                  <Form.Item name="forbidSource" label="Nếu 2 khối đã có…">
                    <Segmented<ForbidSource>
                      options={[
                        { value: 'when', label: 'Quan hệ có sẵn' },
                        { value: 'pattern', label: 'Đường đi tự dựng' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item noStyle shouldUpdate={(a, b) => a.forbidSource !== b.forbidSource}>
                    {({ getFieldValue }) =>
                      getFieldValue('forbidSource') === 'when' ? (
                        <Form.Item
                          name="when"
                          rules={[{ required: true, message: 'Chọn quan hệ' }]}
                          extra="Nên dùng cách này: quan hệ đã khai báo thì bật lên xem được trên canvas và dùng lại được ở luật khác."
                        >
                          <Select
                            options={allRelationOptions}
                            placeholder="Chọn quan hệ đã có (kể cả suy ra)"
                            notFoundContent="Chưa có quan hệ nào — tạo ở tab Quan hệ"
                          />
                        </Form.Item>
                      ) : (
                        <Form.Item
                          name="pattern"
                          rules={[{ required: true, message: 'Thêm ít nhất 1 bước' }]}
                          extra="Dùng khi chưa có quan hệ nào diễn đạt được. Lưu ý: đường đi này chỉ luật biết — không vẽ lên canvas được. Nếu dùng lại ở nhiều luật thì nên khai báo hẳn thành quan hệ suy ra."
                        >
                          <PatternBuilder baseRelations={baseRelations} />
                        </Form.Item>
                      )
                    }
                  </Form.Item>
                </>
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
