import { Button, Card, Empty, Pagination, Skeleton, Space, Tag, Typography } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { isDerivedRelation } from '@/domain/diagram';
import { RelationLinePreview } from './RelationLinePreview';
import { patternText, roleLabel } from '../types';
import type { Relation } from '../types';

interface RelationsGridProps {
  data: Relation[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (item: Relation) => void;
  onEdit: (item: Relation) => void;
  onDelete: (item: Relation) => void;
}

export function RelationsGrid({ data, total, page, pageSize, loading, onPageChange, onView, onEdit, onDelete }: RelationsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: pageSize }, (_, i) => (
          <Card key={i}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    );
  }
  if (data.length === 0) return <Empty description="Không có dữ liệu" />;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((r) => (
          <Card
            key={r.id}
            actions={[
              <Button key="view" type="text" icon={<EyeOutlined />} aria-label="View" onClick={() => onView(r)} />,
              <Button key="edit" type="text" icon={<EditOutlined />} aria-label="Edit" onClick={() => onEdit(r)} />,
              <Button key="delete" type="text" danger icon={<DeleteOutlined />} aria-label="Delete" onClick={() => onDelete(r)} />,
            ]}
          >
            <Space orientation="vertical" size={6} className="w-full">
              <Space>
                <Typography.Text strong>{r.name}</Typography.Text>
                {isDerivedRelation(r) ? <Tag color="purple">Suy ra</Tag> : <Tag color="blue">Nền</Tag>}
              </Space>
              <RelationLinePreview style={r.style} width={120} />
              <Typography.Text type="secondary" className="text-xs">
                {isDerivedRelation(r) ? `${patternText(r.pattern)} trên ${r.overRelationId}` : roleLabel(r.role)}
              </Typography.Text>
            </Space>
          </Card>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Pagination current={page} pageSize={pageSize} total={total} showSizeChanger onChange={onPageChange} />
      </div>
    </>
  );
}
