import { Form, Input, InputNumber, Modal, Select, Space, Switch } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMemberGroups } from '@/features/member-groups';
import type { TierItem, TierInput } from '../types';

interface Props {
  open: boolean;
  initialValue?: TierItem | null;
  confirmLoading?: boolean;
  onSubmit: (values: TierInput) => void;
  onCancel: () => void;
}

const EMPTY: TierInput = {
  key: '',
  name: '',
  description: '',
  rank: 0,
  color: '',
  icon: '',
  permissionGroupIds: [],
  perks: [],
  isDefault: false,
  isActive: true,
};

export function TierFormModal({ open, initialValue, confirmLoading, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<TierInput>();
  const isEdit = Boolean(initialValue);
  const { data: groups } = useMemberGroups({ limit: 100 });

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValue
          ? {
              key: initialValue.key,
              name: initialValue.name,
              description: initialValue.description,
              rank: initialValue.rank,
              color: initialValue.color,
              icon: initialValue.icon,
              permissionGroupIds: initialValue.permissionGroupIds,
              perks: initialValue.perks,
              isDefault: initialValue.isDefault,
              isActive: initialValue.isActive,
            }
          : EMPTY,
      );
    }
  }, [open, initialValue, form]);

  return (
    <Modal
      open={open}
      title={isEdit ? t('tier.editTitle') : t('tier.createTitle')}
      okText={t('action.save')}
      cancelText={t('action.cancel')}
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      width={640}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      destroyOnHidden
    >
      <Form<TierInput> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item
          name="key"
          label={t('tier.key')}
          rules={[{ required: true, pattern: /^[a-z][a-z0-9_]*$/ }]}
        >
          <Input disabled={isEdit} placeholder="e.g. silver" />
        </Form.Item>
        <Form.Item name="name" label={t('tier.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('tier.description')}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Space size="large" wrap>
          <Form.Item name="rank" label={t('tier.rank')}>
            <InputNumber min={0} max={9999} />
          </Form.Item>
          <Form.Item name="color" label={t('tier.color')}>
            <Input type="color" style={{ width: 64 }} />
          </Form.Item>
          <Form.Item name="isDefault" label={t('tier.default')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label={t('tier.active')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>
        <Form.Item name="permissionGroupIds" label={t('tier.groups')}>
          <Select
            mode="multiple"
            allowClear
            optionFilterProp="label"
            placeholder={t('tier.groupsPlaceholder')}
            options={(groups?.items ?? []).map((g) => ({ value: g.id, label: g.name }))}
          />
        </Form.Item>
        <Form.Item name="perks" label={t('tier.perks')}>
          <Select mode="tags" allowClear placeholder={t('tier.perksPlaceholder')} open={false} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
