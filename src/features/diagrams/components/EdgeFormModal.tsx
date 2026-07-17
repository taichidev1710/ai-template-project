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
  /** Names of the links these two already have, either way round. */
  existingLinks: string[];
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
export function EdgeFormModal({ open, pair, relations, blockedByRule, existingLinks, onSubmit, onCancel }: EdgeFormModalProps) {
  const [form] = Form.useForm<{ label: string }>();

  // The chosen relation is plain state driving a CONTROLLED Select — not a
  // Form.Item. It used to live in the form, and that is exactly what let the box
  // and the OK button disagree: `form` comes from `useForm()` on a component
  // that never unmounts, so its store survived every close, and re-init merged
  // `initialValues` UNDER the leftover (@rc-component/form: `merge(iv, store)`).
  // The box then showed the PREVIOUS link's relation while the button judged
  // this state and stayed enabled. One source of truth = they cannot drift.
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

  // `blockedByRule` is rebuilt by the page every render; a ref keeps the memo
  // below from re-running on every one of them.
  const blockedRef = useRef(blockedByRule);
  blockedRef.current = blockedByRule;

  /**
   * Default to the first relation the rules allow, the way the demo falls back
   * rather than opening on an unusable choice. Recomputed per pair; a `useEffect`
   * then mirrors it into state so each new link opens fresh, with no dependence
   * on any form store surviving (or being cleared) across opens.
   */
  const initialRelationId = useMemo(() => {
    if (!open || !pair) return undefined;
    return (baseRelations.find((r) => !blockedRef.current(r.id)) ?? baseRelations[0])?.id;
  }, [open, pair, baseRelations]);

  useEffect(() => setRelationId(initialRelationId), [initialRelationId]);

  const blockedReason = relationId ? blockedByRule(relationId) : null;
  const allBlocked = baseRelations.length > 0 && baseRelations.every((r) => blockedByRule(r.id));

  const submit = () => {
    if (!relationId || blockedReason) return;
    onSubmit({ relationId, label: form.getFieldValue('label') });
  };

  return (
    <Modal
      open={open}
      title="Tạo liên kết"
      okText="Nối"
      cancelText="Huỷ"
      okButtonProps={{ disabled: Boolean(blockedReason) || !relationId }}
      onOk={submit}
      onCancel={onCancel}
      destroyOnHidden
    >
      {pair && (
        <Typography.Paragraph type="secondary" className="text-sm">
          Từ <Typography.Text strong>{pair.sourceLabel}</Typography.Text> → đến{' '}
          <Typography.Text strong>{pair.targetLabel}</Typography.Text>
        </Typography.Paragraph>
      )}

      {/* A pair that is already joined is the one case where the pre-selected
          relation misleads: the box opens on the first relation the rules allow,
          which is easy to read as "this pair is free" and confirm by reflex.
          Saying what is already there costs a line and states a FACT — no rule
          decides whether a second link is wanted here, so nobody but the person
          drawing it can. */}
      {existingLinks.length > 0 && (
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message={`Hai khối này đã có: ${existingLinks.join(', ')}`}
          description="Nối tiếp là thêm một liên kết NỮA giữa chúng, không thay cái đang có."
        />
      )}

      {baseRelations.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          message="Loại sơ đồ này chưa có quan hệ nền nào"
          description="Thêm quan hệ ở màn Loại sơ đồ → tab Quan hệ trước khi nối khối."
        />
      ) : (
        <>
          <div className="mb-4">
            <div className="mb-1.5 text-sm">Loại quan hệ</div>
            <Select
              className="w-full"
              value={relationId}
              options={options}
              onChange={setRelationId}
              placeholder="Chọn loại quan hệ"
            />
          </div>

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

          <Form<{ label: string }>
            // Remount per pair so a label typed on the previous link never leaks
            // into this one. `clearOnDestroy` finishes the job: the shared form
            // store outlives a keyed remount, so the wipe-on-unmount is what
            // actually resets `label` between links.
            key={pair ? `${pair.source}_${pair.target}` : 'none'}
            form={form}
            layout="vertical"
            clearOnDestroy
            initialValues={{ label: '' }}
            onFinish={submit}
            requiredMark={false}
          >
            <Form.Item name="label" label="Nhãn (tuỳ chọn)" extra="Bỏ trống thì canvas hiển thị tên loại quan hệ.">
              <Input placeholder="VD: vợ chồng, bạn thân…" onPressEnter={submit} />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}
