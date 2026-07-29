import { Input, Button, Select, Tag, Tooltip } from 'antd';
import { SaveOutlined, FileAddOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface ProjectBarProps {
  name: string;
  currentId: string | null;
  dirty: boolean;
  saving: boolean;
  loadingList: boolean;
  projects: { id: string; name: string }[];
  onNameChange: (v: string) => void;
  onSave: () => void;
  onNew: () => void;
  onOpen: (id: string) => void;
}

/** Save/open/new toolbar backed by the MongoDB project store (spec §12.1). */
export function ProjectBar({
  name,
  currentId,
  dirty,
  saving,
  loadingList,
  projects,
  onNameChange,
  onSave,
  onNew,
  onOpen,
}: ProjectBarProps) {
  const { t } = useTranslation('video-studio');
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={t('project.namePlaceholder')}
        style={{ width: 200 }}
        allowClear
      />
      <Button
        type={dirty ? 'primary' : 'default'}
        icon={<SaveOutlined />}
        loading={saving}
        onClick={onSave}
      >
        {t('project.save')}
      </Button>
      {dirty && <Tag color="orange">{t('project.unsaved')}</Tag>}
      <Select
        style={{ minWidth: 220 }}
        placeholder={t('project.openPlaceholder')}
        loading={loadingList}
        value={currentId ?? undefined}
        onChange={onOpen}
        showSearch
        optionFilterProp="label"
        options={projects.map((p) => ({ value: p.id, label: p.name }))}
      />
      <Button icon={<FileAddOutlined />} onClick={onNew}>
        {t('project.new')}
      </Button>
      <Tooltip title={t('project.imagesNote')}>
        <InfoCircleOutlined className="text-xs opacity-60" />
      </Tooltip>
    </div>
  );
}
