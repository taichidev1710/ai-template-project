import { Button, Form, Input, InputNumber, Modal, Space, Switch } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FeatureInput, FeatureItem } from '../types';

interface Props {
  open: boolean;
  initialValue?: FeatureItem | null;
  confirmLoading?: boolean;
  onSubmit: (values: FeatureInput) => void;
  onCancel: () => void;
}

const EMPTY: FeatureInput = {
  key: '',
  name: '',
  description: '',
  icon: '',
  actions: [{ key: 'read', label: 'Xem' }],
  enabled: true,
  order: 0,
};

export function FeatureFormModal({ open, initialValue, confirmLoading, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<FeatureInput>();
  const isEdit = Boolean(initialValue);

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValue
          ? {
              key: initialValue.key,
              name: initialValue.name,
              description: initialValue.description,
              icon: initialValue.icon,
              actions: initialValue.actions,
              enabled: initialValue.enabled,
              order: initialValue.order,
            }
          : EMPTY,
      );
    }
  }, [open, initialValue, form]);

  return (
    <Modal
      open={open}
      title={isEdit ? t('feature.editTitle') : t('feature.createTitle')}
      okText={t('action.save')}
      cancelText={t('action.cancel')}
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      width={640}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      destroyOnHidden
    >
      <Form<FeatureInput> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item
          name="key"
          label={t('feature.key')}
          rules={[{ required: true, pattern: /^[a-z][a-z0-9_]*$/ }]}
        >
          <Input disabled={isEdit} placeholder="e.g. scheduling" />
        </Form.Item>
        <Form.Item name="name" label={t('feature.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('feature.description')}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Space size="large">
          <Form.Item name="enabled" label={t('feature.enabled')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="order" label={t('feature.order')}>
            <InputNumber min={0} max={9999} />
          </Form.Item>
        </Space>

        <label className="mb-2 block font-medium">{t('feature.actions')}</label>
        <Form.List name="actions">
          {(fields, { add, remove }) => (
            <div className="flex flex-col gap-2">
              {fields.map((field) => (
                <Space key={field.key} align="baseline">
                  <Form.Item
                    name={[field.name, 'key']}
                    rules={[{ required: true, pattern: /^[a-z][a-z0-9_]*$/ }]}
                    className="!mb-0"
                  >
                    <Input placeholder={t('feature.actionKey')} />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'label']}
                    rules={[{ required: true }]}
                    className="!mb-0"
                  >
                    <Input placeholder={t('feature.actionLabel')} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add({ key: '', label: '' })} icon={<PlusOutlined />}>
                {t('feature.addAction')}
              </Button>
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
