import { Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';

interface Props {
  error: NormalizedError | Error | null;
  onRetry?: () => void;
}

/**
 * Uniform query-error surface (rule 12): every data view handles
 * loading · error · empty · data. Renders a dismissible-free Alert with a
 * retry action instead of a silent empty table. Never shows a raw stack trace.
 */
export function QueryError({ error, onRetry }: Props) {
  const { t } = useTranslation();
  if (!error) return null;
  const message = 'message' in error && error.message ? error.message : t('error.generic');

  return (
    <Alert
      type="error"
      showIcon
      className="mb-4"
      message={message}
      action={
        onRetry ? (
          <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
            {t('action.retry')}
          </Button>
        ) : undefined
      }
    />
  );
}
