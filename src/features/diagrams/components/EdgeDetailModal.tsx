import type { ReactNode } from 'react';
import { Button, ColorPicker, Form, Input, Modal, Select, Space, Tag, Typography } from 'antd';
import type { AggregationColor } from 'antd/es/color-picker/color';
import { DeleteOutlined } from '@ant-design/icons';
import type { ArrowShape, CurveStyle, DiagramEdge, LineStyle, Relation } from '@/domain/diagram';
import { ARROW_OPTIONS, ArrowGlyph, CURVE_OPTIONS, CurveGlyph, LINE_OPTIONS, LineGlyph } from '@/features/relation-types';

/** `inherit` keeps following the relation; the others pin this edge. */
export type AnimatedChoice = 'inherit' | 'on' | 'off';

export interface EdgeDetailValues {
  label?: string;
  animated: AnimatedChoice;
  curve: CurveStyle | 'inherit';
  line: LineStyle | 'inherit';
  arrow: ArrowShape | 'inherit';
  width: number | 'inherit';
  /** `null` = follow the relation's colour. */
  color?: string | null;
}

interface EdgeDetailModalProps {
  open: boolean;
  edge: DiagramEdge | null;
  relation: Relation | undefined;
  sourceLabel: string;
  targetLabel: string;
  onSubmit: (values: EdgeDetailValues) => void;
  onDelete: () => void;
  onCancel: () => void;
}

/** Read `DiagramEdge.animated` back into the tri-state the form shows. */
function toChoice(edge: DiagramEdge): AnimatedChoice {
  if (edge.animated === undefined) return 'inherit';
  return edge.animated ? 'on' : 'off';
}

const WIDTH_OPTIONS = [1, 1.5, 2, 2.5, 3, 4];

/**
 * Prepend "theo loại quan hệ (…)" showing what inheriting currently means.
 * Every choice is drawn next to its name (the demo did), so picking "Zíc zắc"
 * never requires imagining it — including on the inherit row.
 */
function withInherit<V extends string | number>(
  options: { value: V; label: string; glyph: ReactNode }[],
  inherited: V | undefined,
): { value: V | 'inherit'; label: ReactNode }[] {
  const current = options.find((o) => o.value === inherited);
  const draw = (glyph: ReactNode, text: string) => (
    <span className="flex items-center gap-2">
      {glyph}
      {text}
    </span>
  );
  return [
    { value: 'inherit' as const, label: draw(current?.glyph, `Theo loại quan hệ (${current?.label ?? '—'})`) },
    ...options.map((o) => ({ value: o.value, label: draw(o.glyph, o.label) })),
  ];
}

/**
 * Opened by tapping a link. Every style field may be pinned for THIS edge only;
 * whatever stays "theo loại quan hệ" keeps following the relation — the demo's
 * per-edge freedom, kept honest by defaulting every field to inheritance.
 */
export function EdgeDetailModal({
  open,
  edge,
  relation,
  sourceLabel,
  targetLabel,
  onSubmit,
  onDelete,
  onCancel,
}: EdgeDetailModalProps) {
  const [form] = Form.useForm<EdgeDetailValues>();

  const relationAnimates = Boolean(relation?.style.animated);
  const solidLine = (edge?.style?.line ?? relation?.style.line) === 'solid';

  return (
    <Modal
      open={open}
      title="Chi tiết liên kết"
      okText="Lưu"
      cancelText="Huỷ"
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      footer={(_, { OkBtn, CancelBtn }) => (
        <div className="flex items-center justify-between">
          <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
            Xoá liên kết
          </Button>
          <Space>
            <CancelBtn />
            <OkBtn />
          </Space>
        </div>
      )}
    >
      {edge && (
        <>
          <Typography.Paragraph type="secondary" className="text-sm">
            Từ <Typography.Text strong>{sourceLabel}</Typography.Text> → đến{' '}
            <Typography.Text strong>{targetLabel}</Typography.Text>
            {relation && (
              <>
                {' '}
                <Tag color={relation.style.color}>{relation.name}</Tag>
              </>
            )}
          </Typography.Paragraph>

          {/* `initialValues` + a keyed remount instead of a `setFieldsValue`
              effect: with `destroyOnHidden` the form is not mounted when such an
              effect fires, and antd warns the useForm instance is unconnected.

              `clearOnDestroy` is what makes that pair actually work. `form` comes
              from `useForm()` above, in a component that never unmounts, so its
              store outlives the teardown and the key change — and re-init merges
              `initialValues` UNDER the survivor
              (@rc-component/form/hooks/useForm.js: `merge(initialValues, this.store)`).
              Without it, opening link B right after link A showed A's label, and
              Lưu wrote it onto B. */}
          <Form<EdgeDetailValues>
            key={edge.id}
            form={form}
            layout="vertical"
            clearOnDestroy
            initialValues={{
              label: edge.label ?? '',
              animated: toChoice(edge),
              curve: edge.style?.curve ?? 'inherit',
              line: edge.style?.line ?? 'inherit',
              arrow: edge.style?.arrow ?? 'inherit',
              width: edge.style?.width ?? 'inherit',
              color: edge.style?.color ?? null,
            }}
            onFinish={onSubmit}
            requiredMark={false}
          >
            <Form.Item name="label" label="Nhãn" extra="Bỏ trống thì canvas hiển thị tên loại quan hệ.">
              <Input placeholder="VD: vợ chồng, bạn thân…" />
            </Form.Item>

            <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
              <Form.Item name="curve" label="Đường">
                <Select
                  options={withInherit(
                    CURVE_OPTIONS.map((o) => ({ ...o, glyph: <CurveGlyph curve={o.value} /> })),
                    relation?.style.curve,
                  )}
                />
              </Form.Item>
              <Form.Item name="line" label="Nét">
                <Select
                  options={withInherit(
                    LINE_OPTIONS.map((o) => ({ ...o, glyph: <LineGlyph line={o.value} /> })),
                    relation?.style.line,
                  )}
                />
              </Form.Item>
              <Form.Item name="arrow" label="Mũi tên">
                <Select
                  options={withInherit(
                    ARROW_OPTIONS.map((o) => ({ ...o, glyph: <ArrowGlyph arrow={o.value} /> })),
                    relation?.style.arrow,
                  )}
                />
              </Form.Item>
              <Form.Item name="width" label="Độ dày">
                <Select
                  options={withInherit(
                    WIDTH_OPTIONS.map((w) => ({ value: w, label: `${w}px`, glyph: <LineGlyph line="solid" width={w} /> })),
                    relation?.style.width,
                  )}
                />
              </Form.Item>
            </div>

            <Form.Item
              name="color"
              label="Màu riêng"
              extra="Nút xoá trong bảng màu = quay về màu của loại quan hệ."
              getValueFromEvent={(c: AggregationColor | null) => (c ? c.toHexString() : null)}
            >
              <ColorPicker format="hex" showText allowClear onClear={() => form.setFieldValue('color', null)} />
            </Form.Item>

            <Form.Item
              name="animated"
              label="Nét chạy"
              extra={
                solidLine
                  ? 'Nét liền không thấy hiệu ứng chạy — đổi kiểu nét sang gạch/chấm để thấy rõ.'
                  : 'Hiệu ứng chỉ rõ với nét gạch/chấm. Tự tắt nếu máy bật “giảm chuyển động”.'
              }
            >
              <Select
                options={[
                  { value: 'inherit', label: `Theo loại quan hệ (${relationAnimates ? 'đang bật' : 'đang tắt'})` },
                  { value: 'on', label: 'Bật cho riêng liên kết này' },
                  { value: 'off', label: 'Tắt cho riêng liên kết này' },
                ]}
              />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}
