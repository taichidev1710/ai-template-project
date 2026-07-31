import { Button, Divider, Form, Input, InputNumber, Modal, Select, Space, Switch, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ADAPTER_IDS,
  OUTPUT_TYPES,
  PROVIDER_STATUSES,
  type ProviderInput,
  type ProviderItem,
} from '../types';

interface Props {
  open: boolean;
  initialValue?: ProviderItem | null;
  confirmLoading?: boolean;
  onSubmit: (values: ProviderInput) => void;
  onCancel: () => void;
}

const EMPTY: ProviderInput = {
  key: '',
  label: '',
  description: '',
  adapterId: 'veo',
  credentialProviderId: 'google',
  outputType: 'video',
  enabled: true,
  status: 'stable',
  order: 0,
  aspects: [{ value: '16:9', enabled: true }],
  durations: [{ value: 8, enabled: true }],
  models: [{ id: '', tier: 'normal', label: '', enabled: true }],
  maxReferenceImages: 0,
  rpm: 0,
  maxConcurrent: 1,
};

/** Nhãn mục con nhỏ, thống nhất trong form. */
function SubLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block font-medium">{children}</label>;
}

export function ProviderFormModal({ open, initialValue, confirmLoading, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<ProviderInput>();
  const isEdit = Boolean(initialValue);

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValue
          ? {
              key: initialValue.key,
              label: initialValue.label,
              description: initialValue.description,
              adapterId: initialValue.adapterId as ProviderInput['adapterId'],
              credentialProviderId: initialValue.credentialProviderId,
              outputType: initialValue.outputType as ProviderInput['outputType'],
              enabled: initialValue.enabled,
              status: initialValue.status as ProviderInput['status'],
              order: initialValue.order,
              aspects: initialValue.aspects,
              durations: initialValue.durations,
              models: initialValue.models,
              maxReferenceImages: initialValue.maxReferenceImages,
              rpm: initialValue.rpm,
              maxConcurrent: initialValue.maxConcurrent,
            }
          : EMPTY,
      );
    }
  }, [open, initialValue, form]);

  return (
    <Modal
      open={open}
      title={isEdit ? t('provider.editTitle') : t('provider.createTitle')}
      okText={t('action.save')}
      cancelText={t('action.cancel')}
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      width={720}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
      destroyOnHidden
    >
      <Form<ProviderInput> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item
          name="key"
          label={t('provider.key')}
          rules={[{ required: true, pattern: /^[a-z][a-z0-9_]*$/ }]}
        >
          <Input disabled={isEdit} placeholder="e.g. runway" />
        </Form.Item>
        <Form.Item name="label" label={t('provider.label')} rules={[{ required: true }]}>
          <Input placeholder="e.g. Runway Gen-4" />
        </Form.Item>
        <Form.Item name="description" label={t('provider.description')}>
          <Input.TextArea rows={2} />
        </Form.Item>

        <Space size="large" wrap>
          <Form.Item name="adapterId" label={t('provider.adapter')} rules={[{ required: true }]}>
            <Select
              style={{ width: 180 }}
              options={ADAPTER_IDS.map((a) => ({ value: a, label: a }))}
            />
          </Form.Item>
          <Form.Item name="outputType" label={t('provider.outputType')} rules={[{ required: true }]}>
            <Select
              style={{ width: 140 }}
              options={OUTPUT_TYPES.map((o) => ({ value: o, label: t(`provider.output.${o}`, o) }))}
            />
          </Form.Item>
          <Form.Item name="credentialProviderId" label={t('provider.credential')}>
            <Input style={{ width: 160 }} placeholder="google" />
          </Form.Item>
        </Space>

        <Space size="large" wrap>
          <Form.Item name="status" label={t('provider.status')}>
            <Select
              style={{ width: 140 }}
              options={PROVIDER_STATUSES.map((s) => ({
                value: s,
                label: t(`provider.statusValue.${s}`, s),
              }))}
            />
          </Form.Item>
          <Form.Item name="enabled" label={t('provider.enabled')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="order" label={t('provider.order')}>
            <InputNumber min={0} max={9999} />
          </Form.Item>
        </Space>

        <Space size="large" wrap>
          <Form.Item name="maxReferenceImages" label={t('provider.maxRefImages')}>
            <InputNumber min={0} max={50} />
          </Form.Item>
          <Form.Item name="rpm" label={t('provider.rpm')}>
            <InputNumber min={0} max={100000} />
          </Form.Item>
          <Form.Item name="maxConcurrent" label={t('provider.maxConcurrent')}>
            <InputNumber min={1} max={200} />
          </Form.Item>
        </Space>

        <Divider className="!my-3" />

        {/* --- Tỷ lệ khung hình --- */}
        <SubLabel>{t('provider.aspects')}</SubLabel>
        <Form.List name="aspects">
          {(fields, { add, remove }) => (
            <div className="mb-3 flex flex-col gap-2">
              {fields.map((field) => (
                <Space key={field.key} align="baseline">
                  <Form.Item name={[field.name, 'value']} rules={[{ required: true }]} className="!mb-0">
                    <Input placeholder="16:9" style={{ width: 120 }} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'enabled']} valuePropName="checked" className="!mb-0">
                    <Switch size="small" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add({ value: '', enabled: true })} icon={<PlusOutlined />}>
                {t('provider.addAspect')}
              </Button>
            </div>
          )}
        </Form.List>

        {/* --- Độ dài clip (chỉ provider video) --- */}
        <SubLabel>{t('provider.durations')}</SubLabel>
        <Form.List name="durations">
          {(fields, { add, remove }) => (
            <div className="mb-3 flex flex-col gap-2">
              {fields.map((field) => (
                <Space key={field.key} align="baseline">
                  <Form.Item name={[field.name, 'value']} rules={[{ required: true }]} className="!mb-0">
                    <InputNumber min={1} max={600} placeholder="8" style={{ width: 120 }} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'enabled']} valuePropName="checked" className="!mb-0">
                    <Switch size="small" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add({ value: 8, enabled: true })} icon={<PlusOutlined />}>
                {t('provider.addDuration')}
              </Button>
            </div>
          )}
        </Form.List>

        {/* --- Model (mức tốc độ/chất lượng) --- */}
        <SubLabel>{t('provider.models')}</SubLabel>
        <Form.List name="models">
          {(fields, { add, remove }) => (
            <div className="flex flex-col gap-2">
              {fields.map((field) => (
                <Space key={field.key} align="baseline" wrap>
                  <Form.Item name={[field.name, 'tier']} rules={[{ required: true }]} className="!mb-0">
                    <Input placeholder={t('provider.modelTier')} style={{ width: 100 }} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'id']} rules={[{ required: true }]} className="!mb-0">
                    <Input placeholder={t('provider.modelId')} style={{ width: 220 }} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'pricePerSecond']} className="!mb-0">
                    <InputNumber min={0} placeholder="$/s" style={{ width: 80 }} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'pricePerImage']} className="!mb-0">
                    <InputNumber min={0} placeholder="$/img" style={{ width: 80 }} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'enabled']} valuePropName="checked" className="!mb-0">
                    <Switch size="small" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}
              <Button
                type="dashed"
                onClick={() => add({ id: '', tier: 'normal', label: '', enabled: true })}
                icon={<PlusOutlined />}
              >
                {t('provider.addModel')}
              </Button>
            </div>
          )}
        </Form.List>

        <Typography.Paragraph type="secondary" className="!mt-3 !mb-0 text-xs">
          {t('provider.adapterHint')}
        </Typography.Paragraph>
      </Form>
    </Modal>
  );
}
