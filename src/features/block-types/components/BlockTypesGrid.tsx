import { Button, Card, Empty, Pagination, Skeleton, Space, Typography } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { BlockGlyph } from './BlockGlyph';
import { shapeLabel } from '../types';
import type { BlockType } from '../types';

interface BlockTypesGridProps {
  data: BlockType[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (item: BlockType) => void;
  onEdit: (item: BlockType) => void;
  onDelete: (item: BlockType) => void;
}

/** Card-grid view for the same list — CSS grid + Pagination (no AntD List). */
export function BlockTypesGrid({ data, total, page, pageSize, loading, onPageChange, onView, onEdit, onDelete }: BlockTypesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((item) => (
          <Card
            key={item.id}
            actions={[
              <Button key="view" type="text" icon={<EyeOutlined />} aria-label="View" onClick={() => onView(item)} />,
              <Button key="edit" type="text" icon={<EditOutlined />} aria-label="Edit" onClick={() => onEdit(item)} />,
              <Button key="delete" type="text" danger icon={<DeleteOutlined />} aria-label="Delete" onClick={() => onDelete(item)} />,
            ]}
          >
            <Space>
              <BlockGlyph shape={item.shape} color={item.color} size={40} />
              <Space orientation="vertical" size={0}>
                <Typography.Text strong>{item.name}</Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                  {shapeLabel(item.shape)}
                </Typography.Text>
                <Typography.Text code className="text-xs">
                  {item.id}
                </Typography.Text>
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
