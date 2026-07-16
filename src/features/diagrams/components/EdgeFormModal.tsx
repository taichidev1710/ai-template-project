import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Form, Input, Modal, Select, Typography } from 'antd';
import { isBaseRelation, type BaseRelation, type Relation } from '@/domain/diagram';

export interface EdgeFormValues {
  relationId: string;
  label?: string;
}

export interface EdgePair {
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
}

interface EdgeFormModalProps {
  open: boolean;
  pair: EdgePair | null;
  relations: Relation[];
  /** Why a given relation may not join this pair; keyed by relation id. */
  blockedByRule: (relationId: string) => string | null;
  onSubmit: (values: EdgeFormValues) => void;
  onCancel: () => void;
}

/**
 * Opened after picking a source and a target block — the demo's flow, where the
 * relation is chosen when the link is made rather than armed beforehand.
 *
 * Style is deliberately NOT editable here: a relation owns its style (see
 * DESIGN.md §7), so an edge carries only which relation it is and an optional
 * label.
 */
export function EdgeFormModal({ open, pair, relations, blockedByRule, onSubmit, onCancel }: EdgeFormModalProps) {
  const [form] = Form.useForm<EdgeFormValues>();
  // Tracked in state, not `Form.useWatch`: with `destroyOnHidden` the form
  // unmounts on close and useWatch then warns that it has no Form (see the same
  // note in relation-types/RelationFormModal). The value is also needed OUTSIDE
  // the form, for the OK button's disabled state.
  const [relationId, setRelationId] = useState<string>();

  // Only base relations can be drawn; derived ones are computed.
  const baseRelations = useMemo(() => relations.filter(isBaseRelation), [relations]);

  /** Each relation with the reason it can't be used, if any. */
  const options = useMemo(
    () =>
      baseRelations.map((r: BaseRelation) => {
        const blocked = blockedByRule(r.id);
        return {
          value: r.id,
          label: `${r.name} (${r.role === 'primary' ? 'chính' : 'phụ'})${blocked ? ' — phạm luật' : ''}`,
          disabled: Boolean(blocked),
        };
      }),
    [baseRelations, blockedByRule],
  );

  // Default to the first relation the rules actually allow, the way the demo
  // falls back rather than opening on an unusable choice.
  // `blockedByRule` is rebuilt by the page every render; a ref keeps the memo
  // below from re-running on every one of them.
  const blockedRef = useRef(blockedByRule);
  blockedRef.current = blockedByRule;

  /**
   * Default to the first relation the rules allow, the way the demo falls back
   * rather than opening on an unusable choice.
   *
   * Fed through `initialValues` + a keyed remount rather than a
   * `form.setFieldsValue` effect: with `destroyOnHidden` the form is not mounted
   * yet when such an effect fires, and antd then warns that the useForm instance
   * is "not connected to any Form element".
   */
  const initialRelationId = useMemo(() => {
    if (!open || !pair) return undefined;
    return (baseRelations.find((r) => !blockedRef.current(r.id)) ?? baseRelations[0])?.id;
  }, [open, pair, baseRelations]);

  // Mirrors the field into state for the OK button, which lives outside <Form>.
  useEffect(() => setRelationId(initialRelationId), [initialRelationId]);

  const blockedReason = relationId ? blockedByRule(relationId) : null;
  const allBlocked = baseRelations.length > 0 && baseRelations.every((r) => blockedByRule(r.id));

  return (
    <Modal
      open={open}
      title="Tạo liên kết"
      okText="Nối"
      cancelText="Huỷ"
      okButtonProps={{ disabled: Boolean(blockedReason) || baseRelations.length === 0 }}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      {pair && (
        <Typography.Paragraph type="secondary" className="text-sm">
          Từ <Typography.Text strong>{pair.sourceLabel}</Typography.Text> → đến{' '}
          <Typography.Text strong>{pair.targetLabel}</Typography.Text>
        </Typography.Paragraph>
      )}

      {baseRelations.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          message="Loại sơ đồ này chưa có quan hệ nền nào"
          description="Thêm quan hệ ở màn Loại sơ đồ → tab Quan hệ trước khi nối khối."
        />
      ) : (
        <Form<EdgeFormValues>
          // Remount per pair so `initialValues` is re-applied for each new link.
          key={pair ? `${pair.source}_${pair.target}` : 'none'}
          form={form}
          layout="vertical"
          initialValues={{ relationId: initialRelationId, label: '' }}
          onFinish={onSubmit}
          onValuesChange={(changed: Partial<EdgeFormValues>) => {
            if (changed.relationId !== undefined) setRelationId(changed.relationId);
          }}
          requiredMark={false}
        >
          <Form.Item name="relationId" label="Loại quan hệ" rules={[{ required: true, message: 'Chọn loại quan hệ' }]}>
            <Select options={options} />
          </Form.Item>

          {allBlocked && (
            <Alert
              className="mb-4"
              type="error"
              showIcon
              message="Không quan hệ nào nối được hai khối này"
              description="Bộ luật đang áp chặn mọi loại quan hệ cho cặp khối này."
            />
          )}
          {blockedReason && !allBlocked && (
            <Alert className="mb-4" type="error" showIcon message={blockedReason} />
          )}

          <Form.Item name="label" label="Nhãn (tuỳ chọn)" extra="Bỏ trống thì canvas hiển thị tên loại quan hệ.">
            <Input placeholder="VD: vợ chồng, bạn thân…" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
