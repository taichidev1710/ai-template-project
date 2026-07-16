import { useEffect } from 'react';
import { Form, Input, Modal, Select, Switch } from 'antd';
import type { BlockType, DiagramNode } from '@/domain/diagram';

export interface NodeFormValues {
  label: string;
  blockTypeId: string;
  exempt: boolean;
  notes?: string;
}

interface NodeFormModalProps {
  open: boolean;
  node: DiagramNode | null;
  blockTypes: BlockType[];
  onSubmit: (values: NodeFormValues) => void;
  onCancel: () => void;
}

/** Edit one node's label / block type / exempt flag. */
export function NodeFormModal({ open, node, blockTypes, onSubmit, onCancel }: NodeFormModalProps) {
  const [form] = Form.useForm<NodeFormValues>();

  useEffect(() => {
    if (open && node) {
      form.setFieldsValue({
        label: node.label,
        blockTypeId: node.blockTypeId,
        exempt: Boolean(node.exempt),
        notes: node.notes ?? '',
      });
    }
  }, [open, node, form]);

  return (
    <Modal
      open={open}
      title="Sửa khối"
      okText="Lưu"
      cancelText="Huỷ"
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<NodeFormValues> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item name="label" label="Tên" rules={[{ required: true, message: 'Nhập tên khối' }]}>
          <Input placeholder="VD: Nguyễn Văn A" />
        </Form.Item>
        <Form.Item name="blockTypeId" label="Loại khối" rules={[{ required: true, message: 'Chọn loại khối' }]}>
          <Select options={blockTypes.map((b) => ({ value: b.id, label: b.name }))} />
        </Form.Item>
        <Form.Item
          name="exempt"
          label="Miễn luật bắt buộc"
          valuePropName="checked"
          extra="Khối chưa xác định: bỏ qua các luật “bắt buộc”, nhưng vẫn chịu luật giới hạn/đầu nối."
        >
          <Switch />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
