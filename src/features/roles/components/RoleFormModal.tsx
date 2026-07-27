import { Form, Input, InputNumber, Modal } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PermissionPicker } from '@/shared/ui/PermissionPicker';
import type { Role, RoleInput } from '../types';

interface Props {
  open: boolean;
  initialValue?: Role | null;
  confirmLoading?: boolean;
  onSubmit: (values: RoleInput) => void;
  onCancel: () => void;
}

const EMPTY: RoleInput = { key: '', name: '', description: '', permissions: [], level: 10 };

export function RoleFormModal({ open, initialValue, confirmLoading, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<RoleInput>();
  const isEdit = Boolean(initialValue);
  const isSystem = Boolean(initialValue?.isSystem);

  useEffect(() => {
    if (open) {
      // setFieldsValue with ALL fields overwrites any leaked value from a prior open
      form.setFieldsValue(
        initialValue
          ? {
              key: initialValue.key,
              name: initialValue.name,
              description: initialValue.description,
              permissions: initialValue.permissions,
              level: initialValue.level,
            }
          : EMPTY,
      );
    }
  }, [open, initialValue, form]);

  return (
    <Modal
      open={open}
      title={isEdit ? t('role.editTitle') : t('role.createTitle')}
      okText={t('action.save')}
      cancelText={t('action.cancel')}
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      width={640}
      destroyOnHidden
    >
      <Form<RoleInput> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item
          name="key"
          label={t('role.key')}
          rules={[{ required: true, pattern: /^[a-z][a-z0-9_]*$/ }]}
        >
          <Input disabled={isEdit} placeholder="e.g. team_lead" />
        </Form.Item>
        <Form.Item name="name" label={t('role.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('role.description')}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="level" label={t('role.level')} rules={[{ required: true }]}>
          <InputNumber min={0} max={1000} disabled={isSystem} className="w-full" />
        </Form.Item>
        <Form.Item name="permissions" label={t('role.permissions')}>
          <PermissionPicker disabled={isSystem} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
