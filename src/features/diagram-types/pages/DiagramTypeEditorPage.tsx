import { Button, Result, Skeleton, Space, Tabs, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { BlockTypesPanel } from '@/features/block-types';
import { RelationsPanel } from '@/features/relation-types';
import { RuleSetsPanel } from '@/features/rule-sets';
import { paths } from '@/app/router/paths';
import { useDiagramType } from '../hooks/use-diagram-types';

/**
 * The Loại sơ đồ editor — the ONE workspace where a type's vocabulary and rules
 * are authored together. Tabs: Khối (block types) | Quan hệ (relations, base +
 * derived) | Bộ luật (rule sets + rule builder). Rules reference this type's
 * blocks/relations, and new ones can be created inline — always in sync.
 */
export function DiagramTypeEditorPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: type, isLoading, isError } = useDiagramType(id);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  if (isError || !type) {
    return (
      <Result
        status="404"
        title="Không tìm thấy loại sơ đồ"
        extra={
          <Button type="primary" onClick={() => navigate(paths.diagramTypes)}>
            Về danh sách
          </Button>
        }
      />
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.diagramTypes)}>
            Danh sách
          </Button>
          <Typography.Title level={3} className="!mb-0">
            <span className="mr-2">{type.icon ?? '📊'}</span>
            {type.name}
          </Typography.Title>
        </Space>
      </div>

      <div className="rounded-app bg-surface p-4 sm:p-6">
        <Tabs
          items={[
            { key: 'blocks', label: `Khối (${type.blockTypes.length})`, children: <BlockTypesPanel typeId={type.id} /> },
            { key: 'relations', label: `Quan hệ (${type.relations.length})`, children: <RelationsPanel typeId={type.id} /> },
            {
              key: 'rules',
              label: `Bộ luật (${type.ruleSets.length})`,
              children: <RuleSetsPanel typeId={type.id} blockTypes={type.blockTypes} relations={type.relations} />,
            },
          ]}
        />
      </div>
    </div>
  );
}
