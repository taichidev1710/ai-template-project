import { useState } from 'react';
import { Alert, Button, Input, Popconfirm, Space, Tag, Typography } from 'antd';
import { KeyOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useProviderKeys, useProviderKeyMutations } from '../hooks/use-provider-keys';

/** The one provider we store a key for today — Google covers Gemini/Veo/Nano Banana. */
const PROVIDER = 'google' as const;

/**
 * BYOK panel (spec §4, §13.1): the USER pastes their OWN Google API key; the
 * backend stores it encrypted per-user and never returns it. Shown in the config
 * modal only when the account source is the official API. We never prefill or
 * reveal the key — only a masked `••••1234`.
 */
export function ApiKeyManager() {
  const { t } = useTranslation('video-studio');
  const { data, isLoading } = useProviderKeys();
  const { save, remove } = useProviderKeyMutations();

  const existing = data?.find((k) => k.provider === PROVIDER);
  const [editing, setEditing] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const showForm = editing || !existing;

  const onSave = () => {
    const key = keyInput.trim();
    if (!key) return;
    save.mutate(
      { provider: PROVIDER, key },
      {
        onSuccess: () => {
          setKeyInput('');
          setEditing(false);
        },
      },
    );
  };

  return (
    <div className="rounded-app border border-line-soft p-3">
      <div className="mb-2 flex items-center gap-2">
        <KeyOutlined />
        <Typography.Text strong>{t('apiKey.title')}</Typography.Text>
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
              setKeyInput('');
            }}
          >
            {t('apiKey.change')}
          </Button>
          <Popconfirm
            title={t('apiKey.removeConfirm')}
            okText={t('apiKey.remove')}
            cancelText={t('apiKey.cancel')}
            onConfirm={() => remove.mutate(PROVIDER)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} loading={remove.isPending}>
              {t('apiKey.remove')}
            </Button>
          </Popconfirm>
        </div>
      )}

      {showForm && (
        <Space.Compact className="w-full">
          <Input.Password
            placeholder={t('apiKey.placeholder')}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onPressEnter={onSave}
            autoComplete="off"
          />
          <Button type="primary" onClick={onSave} loading={save.isPending} disabled={!keyInput.trim()}>
            {t('apiKey.save')}
          </Button>
          {editing && existing && (
            <Button
              onClick={() => {
                setEditing(false);
                setKeyInput('');
              }}
            >
              {t('apiKey.cancel')}
            </Button>
          )}
        </Space.Compact>
      )}

      <Alert
        type="info"
        showIcon
        className="mt-2"
        title={<span className="text-xs">{t('apiKey.note')}</span>}
      />
      <Typography.Link
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noreferrer"
        className="mt-1 block text-xs"
      >
        {t('apiKey.getKey')} ↗
      </Typography.Link>
    </div>
  );
}
