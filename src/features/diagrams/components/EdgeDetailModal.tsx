import { Button, Form, Input, Modal, Select, Space, Tag, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { DiagramEdge, Relation } from '@/domain/diagram';

/** `inherit` keeps following the relation; the others pin this edge. */
export type AnimatedChoice = 'inherit' | 'on' | 'off';

export interface EdgeDetailValues {
  label?: string;
  animated: AnimatedChoice;
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

/**
 * Opened by tapping a link. Only label + marching-ants are editable: the rest of
 * the style belongs to the relation (DESIGN.md §7), so changing it here would
 * silently restyle every link of that kind.
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
  const solidLine = relation?.style.line === 'solid';

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
            initialValues={{ label: edge.label ?? '', animated: toChoice(edge) }}
            onFinish={onSubmit}
            requiredMark={false}
          >
            <Form.Item name="label" label="Nhãn" extra="Bỏ trống thì canvas hiển thị tên loại quan hệ.">
              <Input placeholder="VD: vợ chồng, bạn thân…" />
            </Form.Item>

            <Form.Item
              name="animated"
              label="Nét chạy"
              extra={
                solidLine
                  ? 'Nét liền không thấy hiệu ứng chạy — đổi kiểu nét của loại quan hệ sang gạch/chấm để thấy rõ.'
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
