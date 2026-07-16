import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import type { RuleSet, RuleSetInput } from '../types';

interface RuleSetFormModalProps {
  open: boolean;
  initialValue?: RuleSet | null;
  confirmLoading?: boolean;
  onSubmit: (values: RuleSetInput) => void;
  onCancel: () => void;
}

const DEFAULTS: RuleSetInput = { name: '', icon: '⚖️', description: '' };

/** Create/rename a rule set (its rules are managed in the panel below). */
export function RuleSetFormModal({ open, initialValue, confirmLoading, onSubmit, onCancel }: RuleSetFormModalProps) {
  const [form] = Form.useForm<RuleSetInput>();
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
      title={isEdit ? 'Sửa bộ luật' : 'Thêm bộ luật'}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<RuleSetInput> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item name="name" label="Tên bộ luật" rules={[{ required: true, message: 'Nhập tên bộ luật' }]}>
          <Input placeholder="VD: Gia đình chuẩn, Tổ chức nghiêm ngặt…" />
        </Form.Item>
        <Form.Item name="icon" label="Biểu tượng (emoji)">
          <Input placeholder="⚖️" maxLength={4} className="w-24" />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} placeholder="Bộ luật này ràng buộc điều gì?" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
