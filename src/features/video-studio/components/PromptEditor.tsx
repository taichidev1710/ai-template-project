import { Input, Button, Checkbox, Space, Typography } from 'antd';
import { ScissorOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface PromptEditorProps {
  value: string;
  useMarkers: boolean;
  sceneCount: number;
  onChange: (value: string) => void;
  onMarkersChange: (on: boolean) => void;
  onParse: () => void;
}

/** Middle column top — the source prompt box + split control (spec §13.2). */
export function PromptEditor({
  value,
  useMarkers,
  sceneCount,
  onChange,
  onMarkersChange,
  onParse,
}: PromptEditorProps) {
  const { t } = useTranslation('video-studio');
  return (
    <div>
      <Input.TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('prompt.placeholder')}
        autoSize={{ minRows: 4, maxRows: 10 }}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Space>
          <Button type="primary" icon={<ScissorOutlined />} onClick={onParse}>
            {t('prompt.parse')}
          </Button>
          <Checkbox checked={useMarkers} onChange={(e) => onMarkersChange(e.target.checked)}>
            {t('prompt.markers')}
          </Checkbox>
        </Space>
        <Typography.Text type="secondary" className="text-xs">
          {t('prompt.sceneCount', { n: sceneCount })}
        </Typography.Text>
      </div>
    </div>
  );
}
