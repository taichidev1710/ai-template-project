import { Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoles } from '@/features/roles';
import type { UserInput } from '../types';

interface Props {
  open: boolean;
  confirmLoading?: boolean;
  onSubmit: (values: UserInput) => void;
  onCancel: () => void;
}

/** Create a user directly (admin path → account is active, manager = creator). */
export function UserFormModal({ open, confirmLoading, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<UserInput>();
  const { data: roles } = useRoles({ limit: 100 });

  useEffect(() => {
    if (open) form.setFieldsValue({ email: '', name: '', password: '', roleIds: [] });
  }, [open, form]);

  return (
    <Modal
      open={open}
      title={t('user.createTitle')}
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
        <Form.Item name="password" label={t('register.password')} rules={[{ required: true, min: 8 }]}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="roleIds" label={t('user.role')}>
          <Select
            mode="multiple"
            allowClear
            optionFilterProp="label"
            options={(roles?.items ?? []).map((r) => ({ value: r.id, label: r.name }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
