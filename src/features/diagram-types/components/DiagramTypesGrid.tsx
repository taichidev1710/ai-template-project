import { Button, Card, Empty, Pagination, Skeleton, Space, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DiagramTemplate } from '../types';

interface DiagramTypesGridProps {
  data: DiagramTemplate[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onOpen: (item: DiagramTemplate) => void;
  onEdit: (item: DiagramTemplate) => void;
  onDelete: (item: DiagramTemplate) => void;
}

/** Card-grid view for the Loại sơ đồ list — CSS grid + Pagination. */
export function DiagramTypesGrid({ data, total, page, pageSize, loading, onPageChange, onOpen, onEdit, onDelete }: DiagramTypesGridProps) {
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
        {data.map((item) => (
          <Card
            key={item.id}
            hoverable
            onClick={() => onOpen(item)}
            actions={[
              <Button key="edit" type="text" icon={<EditOutlined />} aria-label="Edit" onClick={(e) => { e.stopPropagation(); onEdit(item); }} />,
              <Button key="delete" type="text" danger icon={<DeleteOutlined />} aria-label="Delete" onClick={(e) => { e.stopPropagation(); onDelete(item); }} />,
            ]}
          >
            <Space orientation="vertical" size={8} className="w-full">
              <Space>
                <span style={{ fontSize: 22 }}>{item.icon ?? '📊'}</span>
                <Typography.Text strong>{item.name}</Typography.Text>
                {item.builtin && <Tag>mẫu</Tag>}
              </Space>
              <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className="!mb-0">
                {item.description}
              </Typography.Paragraph>
              <Space size={4} wrap>
                <Tag color="blue">{item.blockTypes.length} khối</Tag>
                <Tag color="green">{item.relations.length} quan hệ</Tag>
                <Tag color="gold">{item.ruleSets.length} bộ luật</Tag>
              </Space>
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
