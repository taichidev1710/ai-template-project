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

/** Ties the footer's submit button to the form rendered inside the modal. */
const FORM_ID = 'edge-detail-form';

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
  // Value FIRST, the explanation after: the select box is ~190px and clips, so
  // "Theo loại quan hệ (Bậc thang)" cut off exactly the part worth reading —
  // which is what made the fields look empty at a glance.
  return [
    { value: 'inherit' as const, label: draw(current?.glyph, `${current?.label ?? '—'} · theo loại`) },
    ...options.map((o) => ({ value: o.value, label: draw(o.glyph, o.label) })),
  ];
}

interface EdgeDetailFormProps {
  edge: DiagramEdge;
  relation: Relation | undefined;
  onSubmit: (values: EdgeDetailValues) => void;
}

/**
 * The form itself, deliberately a SEPARATE component that owns its own
 * `useForm`.
 *
 * Why not the usual parent-held instance: the modal is `destroyOnHidden`, so
 * the form mounts and unmounts with it while a parent-held store outlives both.
 * Populating that store from a parent effect raced the portal's mount and left
 * every field blank in the real browser (jsdom tests never caught it), and
 * `initialValues` merged UNDER the surviving store, showing the PREVIOUS link's
 * values. Owning the instance here ends both: the store is born with this
 * component, `initialValues` applies on that first mount, and it dies on close
 * so nothing can leak into the next link.
 */
function EdgeDetailForm({ edge, relation, onSubmit }: EdgeDetailFormProps) {
  const [form] = Form.useForm<EdgeDetailValues>();
  const relationAnimates = Boolean(relation?.style.animated);
  const solidLine = (edge.style?.line ?? relation?.style.line) === 'solid';

  return (
    <Form<EdgeDetailValues>
      id={FORM_ID}
      form={form}
      layout="vertical"
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
            { value: 'inherit', label: `${relationAnimates ? 'Đang bật' : 'Đang tắt'} · theo loại` },
            { value: 'on', label: 'Bật cho riêng liên kết này' },
            { value: 'off', label: 'Tắt cho riêng liên kết này' },
          ]}
        />
      </Form.Item>
    </Form>
  );
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
  return (
    <Modal
      open={open}
      title="Chi tiết liên kết"
      onCancel={onCancel}
      destroyOnHidden
      footer={
        <div className="flex items-center justify-between">
          <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
            Xoá liên kết
          </Button>
          <Space>
            <Button onClick={onCancel}>Huỷ</Button>
            {/* Submits the form by id: the instance lives in the child, so the
                footer cannot hold it — this is the HTML-native way across. */}
            <Button type="primary" htmlType="submit" form={FORM_ID}>
              Lưu
            </Button>
          </Space>
        </div>
      }
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
          {/* Keyed by edge id: a different link is a different form, mounted
              fresh with its own values. */}
          <EdgeDetailForm key={edge.id} edge={edge} relation={relation} onSubmit={onSubmit} />
        </>
      )}
    </Modal>
  );
}
