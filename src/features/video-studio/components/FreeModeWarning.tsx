import { Popover, Typography, theme } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

/**
 * The ⚠ next to "session (free)" mode + its risk popover (spec §4/§4.1). Risks are
 * never hidden behind a silent toggle. Colours come from AntD tokens, never hex.
 */
export function FreeModeWarning() {
  const { t } = useTranslation('video-studio');
  const { token } = theme.useToken();

  const risks = [t('free.risk1'), t('free.risk2'), t('free.risk3'), t('free.risk4')];
  const mitigations = [t('free.mitig1'), t('free.mitig2'), t('free.mitig3'), t('free.mitig4')];

  const content = (
    <div className="max-w-sm">
      <Typography.Paragraph className="!mb-2">{t('free.intro')}</Typography.Paragraph>
      <ul className="mb-3 list-disc pl-5">
        {risks.map((r) => (
          <li key={r}>
            <Typography.Text>{r}</Typography.Text>
          </li>
        ))}
      </ul>
      <Typography.Text strong>{t('free.mitigTitle')}</Typography.Text>
      <ul className="mb-2 mt-1 list-disc pl-5">
        {mitigations.map((m) => (
          <li key={m}>
            <Typography.Text>{m}</Typography.Text>
          </li>
        ))}
      </ul>
      <Typography.Text type="secondary" className="text-xs">
        {t('free.note')}
      </Typography.Text>
    </div>
  );

  return (
    <Popover content={content} title={t('free.warnTitle')} trigger="click" placement="rightTop">
      <WarningOutlined
        role="button"
        aria-label={t('free.warnTitle')}
        tabIndex={0}
        style={{ color: token.colorWarning, cursor: 'pointer' }}
      />
    </Popover>
  );
}
