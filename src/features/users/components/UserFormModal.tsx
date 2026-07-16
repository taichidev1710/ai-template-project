import { Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { User, UserInput } from '../types';

interface UserFormModalProps {
  open: boolean;
  initialValue?: User | null;
  confirmLoading?: boolean;
  onSubmit: (values: UserInput) => void;
  onCancel: () => void;
}

/** Create/edit modal. Controlled by the page; no data fetching inside. */
export function UserFormModal({ open, initialValue, confirmLoading, onSubmit, onCancel }: UserFormModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<UserInput>();
  const isEdit = Boolean(initialValue);

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValue ?? { name: '', email: '', role: 'viewer' },
      );
    }
  }, [open, initialValue, form]);

  return (
    <Modal
      open={open}
      title={isEdit ? t('user.editTitle') : t('user.createTitle')}
      okText={t('action.save')}
      cancelText={t('action.cancel')}
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<UserInput> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item name="name" label={t('user.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label={t('user.email')} rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="role" label={t('user.role')} rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'editor', label: 'Editor' },
              { value: 'viewer', label: 'Viewer' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
