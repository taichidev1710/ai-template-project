import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Col, Form, Input, InputNumber, Row, Select } from 'antd';
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import { TIER_ORDER, getTierConfig } from '../config/tiers';
import { STATUS_ORDER, getStatusConfig } from '../config/status';
import { DEFAULT_FIELD_SPAN, PROFILE_FORM_SCHEMA } from '../config/form-schema';
import type { FieldSchema, ProfileFormContext } from '../config/form-schema';
import type { Profile, ProfileInput, ProfileSurface } from '../types';

export const PROFILE_FORM_DEFAULTS: ProfileInput = {
  name: '',
  email: '',
  tier: 'standard',
  status: 'active',
};

export interface ProfileFormProps {
  /**
   * Pass your own instance (from Form.useForm) when the CONTAINER drives
   * submit — e.g. a Modal OK button calling form.submit(). Omit it when the
   * form submits itself via a `footer` button.
   */
  form?: FormInstance<ProfileInput>;
  initialValue?: Profile | null;
  /** Which surface/route is editing — feeds field disable/require rules. */
  surface?: ProfileSurface;
  /** Viewer permission check — feeds field disable rules. */
  can?: (permission: string) => boolean;
  onSubmit: (values: ProfileInput) => void;
  /**
   * Rendered inside the form, after the fields. For standalone usage pass
   * e.g. `<Button type="primary" htmlType="submit">…</Button>` — htmlType
   * "submit" triggers onSubmit through the form. Modals omit this and use
   * their own footer instead.
   */
  footer?: ReactNode;
}

/**
 * Container-agnostic profile form. Renders PROFILE_FORM_SCHEMA (visibility /
 * required / disabled resolved from live values + surface + permission) as a
 * responsive grid. Embed it in a Modal, Drawer, page or card — the container
 * only decides WHERE it lives and WHAT buttons drive it.
 */
export function ProfileForm({ form, initialValue, surface, can, onSubmit, footer }: ProfileFormProps) {
  const { t } = useTranslation();
  // Reuses the caller's instance when provided, otherwise creates its own.
  const [formInstance] = Form.useForm<ProfileInput>(form);

  useEffect(() => {
    // Reset first so switching records never leaks stale optional fields
    // (e.g. a previous VIP's hotline showing on a standard profile).
    formInstance.resetFields();
    formInstance.setFieldsValue(initialValue ?? PROFILE_FORM_DEFAULTS);
  }, [initialValue, formInstance]);

  // Strip values of fields not visible for the final tier/status, so a payload
  // never carries stale higher-tier data (e.g. creditLimit on a standard profile).
  const handleFinish = (values: ProfileInput) => {
    const ctx: ProfileFormContext = { values, surface, can };
    const allowed = new Set(
      PROFILE_FORM_SCHEMA.filter((f) => !f.visibleWhen || f.visibleWhen(ctx)).map((f) => f.name),
    );
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([key]) => allowed.has(key as keyof ProfileInput)),
    ) as ProfileInput;
    onSubmit(cleaned);
  };

  const renderInput = (field: FieldSchema, disabled: boolean) => {
    switch (field.input) {
      case 'number':
        return <InputNumber className="w-full" min={0} disabled={disabled} />;
      case 'textarea':
        return <Input.TextArea rows={3} disabled={disabled} />;
      case 'tier':
        return (
          <Select
            disabled={disabled}
            options={TIER_ORDER.map((x) => ({ value: x, label: t(getTierConfig(x).label) }))}
          />
        );
      case 'status':
        return (
          <Select
            disabled={disabled}
            options={STATUS_ORDER.map((x) => ({ value: x, label: t(getStatusConfig(x).label) }))}
          />
        );
      default:
        return <Input disabled={disabled} />;
    }
  };

  return (
    <Form<ProfileInput>
      form={formInstance}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={PROFILE_FORM_DEFAULTS}
    >
      {/* Re-resolve the whole field set whenever a driver value changes. */}
      <Form.Item noStyle shouldUpdate={(prev, cur) => prev.tier !== cur.tier || prev.status !== cur.status}>
        {(instance) => {
          const ctx: ProfileFormContext = {
            values: instance.getFieldsValue(true),
            surface,
            can,
          };
          return (
            <Row gutter={16}>
              {PROFILE_FORM_SCHEMA.map((field) => {
                if (field.visibleWhen && !field.visibleWhen(ctx)) return null;

                const disabled = field.disabledWhen?.(ctx) ?? false;
                // A disabled field must not be required (the user can't fill it).
                const required = (field.requiredWhen?.(ctx) ?? false) && !disabled;

                return (
                  <Col key={field.name} {...(field.span ?? DEFAULT_FIELD_SPAN)}>
                    <Form.Item
                      name={field.name}
                      label={t(field.label)}
                      rules={[
                        ...(required ? [{ required: true }] : []),
                        ...(field.input === 'email' ? [{ type: 'email' as const }] : []),
                      ]}
                    >
                      {renderInput(field, disabled)}
                    </Form.Item>
                  </Col>
                );
              })}
            </Row>
          );
        }}
      </Form.Item>
      {footer}
    </Form>
  );
}
