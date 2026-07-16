import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import type { DiagramTemplate, DiagramTypeInput } from '../types';

interface DiagramTypeFormModalProps {
  open: boolean;
  initialValue?: DiagramTemplate | null;
  confirmLoading?: boolean;
  onSubmit: (values: DiagramTypeInput) => void;
  onCancel: () => void;
}

const DEFAULTS: DiagramTypeInput = { name: '', icon: '📊', description: '' };

/** Create/rename a Loại sơ đồ (header fields only; catalog edited in the tabs). */
export function DiagramTypeFormModal({ open, initialValue, confirmLoading, onSubmit, onCancel }: DiagramTypeFormModalProps) {
  const [form] = Form.useForm<DiagramTypeInput>();
  const isEdit = Boolean(initialValue);

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValue ? { name: initialValue.name, icon: initialValue.icon, description: initialValue.description } : DEFAULTS,
      );
    }
  }, [open, initialValue, form]);

  return (
    <Modal
      open={open}
      title={isEdit ? 'Sửa loại sơ đồ' : 'Thêm loại sơ đồ'}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<DiagramTypeInput> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên loại sơ đồ' }]}>
          <Input placeholder="VD: Tổ chức, Quy trình, Mạng lưới…" />
        </Form.Item>
        <Form.Item name="icon" label="Biểu tượng (emoji)">
          <Input placeholder="📊" maxLength={4} className="w-24" />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Mô tả ngắn về loại sơ đồ này" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
