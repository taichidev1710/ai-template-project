import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MemberPermissionPicker } from './MemberPermissionPicker';
import type { MemberGroup, MemberGroupInput } from '../types';

interface Props {
  open: boolean;
  initialValue?: MemberGroup | null;
  confirmLoading?: boolean;
  onSubmit: (values: MemberGroupInput) => void;
  onCancel: () => void;
}

const EMPTY: MemberGroupInput = { key: '', name: '', description: '', grants: [] };

export function MemberGroupFormModal({
  open,
  initialValue,
  confirmLoading,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<MemberGroupInput>();
  const isEdit = Boolean(initialValue);

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValue
          ? {
              key: initialValue.key,
              name: initialValue.name,
              description: initialValue.description,
              grants: initialValue.grants,
            }
          : EMPTY,
      );
    }
  }, [open, initialValue, form]);

  return (
    <Modal
      open={open}
      title={isEdit ? t('memberGroup.editTitle') : t('memberGroup.createTitle')}
      okText={t('action.save')}
      cancelText={t('action.cancel')}
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      width={640}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      destroyOnHidden
    >
      <Form<MemberGroupInput> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item
          name="key"
          label={t('group.key')}
          rules={[{ required: true, pattern: /^[a-z][a-z0-9_]*$/ }]}
        >
          <Input disabled={isEdit} placeholder="e.g. booking_basic" />
        </Form.Item>
        <Form.Item name="name" label={t('group.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('group.description')}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="grants" label={t('group.grants')}>
          <MemberPermissionPicker />
        </Form.Item>
      </Form>
    </Modal>
  );
}
