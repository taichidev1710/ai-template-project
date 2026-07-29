import { Button, Empty, Alert, Space, Typography } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Character, CharacterIssue, CharacterIssueCode } from '@/domain/video';
import { CharacterItem } from './CharacterItem';

interface CharacterPanelProps {
  characters: Character[];
  usage: Record<string, number>;
  issues: CharacterIssue[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Character>) => void;
  onRemove: (id: string) => void;
}

/** Maps a domain issue code to its i18n key (domain returns codes, UI translates). */
const ISSUE_KEY: Record<CharacterIssueCode, string> = {
  'missing-image': 'character.issue.missingImage',
  'unused-character': 'character.issue.unusedCharacter',
  'unknown-key': 'character.issue.unknownKey',
};

/** Character roster + upload + consistency warnings (spec §9, §13.2). */
export function CharacterPanel({ characters, usage, issues, onAdd, onChange, onRemove }: CharacterPanelProps) {
  const { t } = useTranslation('video-studio');

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button size="small" icon={<UserAddOutlined />} onClick={onAdd}>
          {t('character.add')}
        </Button>
      </div>

      {characters.length === 0 ? (
        <Empty description={t('character.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        characters.map((c) => (
          <CharacterItem
            key={c.id}
            character={c}
            usedCount={usage[c.key.toLowerCase()] ?? 0}
            onChange={(patch) => onChange(c.id, patch)}
            onRemove={() => onRemove(c.id)}
          />
        ))
      )}

      {issues.length > 0 && (
        <Alert
          type="warning"
          showIcon
          className="mt-2"
          title={
            <Space orientation="vertical" size={0}>
              {issues.map((issue, i) => (
                <Typography.Text key={`${issue.code}-${issue.key}-${i}`} className="text-xs">
                  {t(ISSUE_KEY[issue.code], { key: issue.key })}
                </Typography.Text>
              ))}
            </Space>
          }
        />
      )}
    </div>
  );
}
