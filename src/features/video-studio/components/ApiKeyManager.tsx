import { useEffect, useState } from 'react';
import { Alert, Button, Input, Popconfirm, Tag, Typography } from 'antd';
import { KeyOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getCredentialProvider } from '@/domain/video';
import { useProviderKeys, useProviderKeyMutations } from '../hooks/use-provider-keys';

interface ApiKeyManagerProps {
  /**
   * Vendor credential of the CURRENTLY selected provider (spec's `credentialProviderId`).
   * `undefined` → keyless provider (mock): the panel renders nothing.
   */
  credentialProviderId: string | undefined;
}

/**
 * BYOK panel (spec §4, §13.1): the USER pastes their OWN credential for the vendor
 * behind the selected provider. Veo + Nano Banana are both Google → they share the
 * one `google` credential; a future vendor gets its own. The form is GENERATED from
 * the vendor's declared fields (`credentialProviders` registry), so a vendor needing
 * more than an API key (endpoint / region / secret) needs no change here. The
 * backend stores it encrypted per-user and never returns it — only a masked
 * `••••1234`.
 */
export function ApiKeyManager({ credentialProviderId }: ApiKeyManagerProps) {
  const { t } = useTranslation('video-studio');
  const { data, isLoading } = useProviderKeys();
  const { save, remove } = useProviderKeyMutations();

  const spec = getCredentialProvider(credentialProviderId);
  const existing = data?.find((k) => k.provider === spec?.id);

  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  // Switching provider (vendor) in the modal → drop any half-typed values.
  useEffect(() => {
    setEditing(false);
    setValues({});
  }, [spec?.id]);

  if (!spec) return null; // keyless provider (mock) — nothing to configure.

  const showForm = editing || !existing;
  const setField = (name: string, v: string) => setValues((prev) => ({ ...prev, [name]: v }));
  const requiredFilled = spec.fields
    .filter((f) => f.required)
    .every((f) => (values[f.name] ?? '').trim().length > 0);

  const onSave = () => {
    if (!requiredFilled) return;
    const fields: Record<string, string> = {};
    for (const f of spec.fields) {
      const v = (values[f.name] ?? '').trim();
      if (v) fields[f.name] = v;
    }
    save.mutate(
      { provider: spec.id, fields },
      {
        onSuccess: () => {
          setValues({});
          setEditing(false);
        },
      },
    );
  };

  return (
    <div className="rounded-app border border-line-soft p-3">
      <div className="mb-2 flex items-center gap-2">
        <KeyOutlined />
        <Typography.Text strong>{t('credential.title', { vendor: spec.label })}</Typography.Text>
        {existing && !editing && (
          <Tag color="success" variant="filled" className="!m-0">
            ••••{existing.last4}
          </Tag>
        )}
      </div>

      {!isLoading && existing && !editing && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Typography.Text type="secondary" className="text-xs">
            {t('apiKey.savedAt', { date: new Date(existing.updatedAt).toLocaleString() })}
          </Typography.Text>
          <Button
            size="small"
            onClick={() => {
              setEditing(true);
              setValues({});
            }}
          >
            {t('apiKey.change')}
          </Button>
          <Popconfirm
            title={t('apiKey.removeConfirm')}
            okText={t('apiKey.remove')}
            cancelText={t('apiKey.cancel')}
            onConfirm={() => remove.mutate(spec.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} loading={remove.isPending}>
              {t('apiKey.remove')}
            </Button>
          </Popconfirm>
        </div>
      )}

      {showForm && (
        <div className="flex flex-col gap-2">
          {spec.fields.map((f) => (
            <div key={f.name}>
              {spec.fields.length > 1 && (
                <Typography.Text type="secondary" className="mb-1 block text-xs">
                  {t(f.labelKey)}
                </Typography.Text>
              )}
              {f.secret ? (
                <Input.Password
                  placeholder={f.placeholderKey ? t(f.placeholderKey) : t(f.labelKey)}
                  value={values[f.name] ?? ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  onPressEnter={onSave}
                  autoComplete="off"
                />
              ) : (
                <Input
                  placeholder={f.placeholderKey ? t(f.placeholderKey) : t(f.labelKey)}
                  value={values[f.name] ?? ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  onPressEnter={onSave}
                  autoComplete="off"
                />
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="primary" onClick={onSave} loading={save.isPending} disabled={!requiredFilled}>
              {t('apiKey.save')}
            </Button>
            {editing && existing && (
              <Button
                onClick={() => {
                  setEditing(false);
                  setValues({});
                }}
              >
                {t('apiKey.cancel')}
              </Button>
            )}
          </div>
        </div>
      )}

      <Alert
        type="info"
        showIcon
        className="mt-2"
        title={<span className="text-xs">{t('apiKey.note')}</span>}
      />
      {spec.helpUrl && (
        <Typography.Link
          href={spec.helpUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block text-xs"
        >
          {t(spec.helpLabelKey ?? 'apiKey.getKey')} ↗
        </Typography.Link>
      )}
    </div>
  );
}
