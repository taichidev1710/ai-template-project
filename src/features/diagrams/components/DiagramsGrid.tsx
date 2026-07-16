import { Button, Card, Empty, Pagination, Skeleton, Space, Tag, Tooltip, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { DiagramTemplate } from '@/features/diagram-types';
import { formatDate } from '@/shared/lib/utils';
import { DiagramTypeTag } from './DiagramTypeTag';
import type { Diagram } from '../types';

interface DiagramsGridProps {
  data: Diagram[];
  types: DiagramTemplate[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onOpen: (item: Diagram) => void;
  onView: (item: Diagram) => void;
  onEdit: (item: Diagram) => void;
  onDelete: (item: Diagram) => void;
}

/** Card-grid view for the Sơ đồ list — CSS grid + Pagination. */
export function DiagramsGrid({ data, types, total, page, pageSize, loading, onPageChange, onOpen, onView, onEdit, onDelete }: DiagramsGridProps) {
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

  if (data.length === 0) return <Empty description="Chưa có sơ đồ nào" />;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <Card
            key={item.id}
            hoverable
            onClick={() => onOpen(item)}
            actions={[
              <Tooltip key="open" title="Mở canvas để vẽ">
                <Button type="text" icon={<ArrowRightOutlined />} aria-label="Mở canvas" onClick={(e) => { e.stopPropagation(); onOpen(item); }} />
              </Tooltip>,
              <Tooltip key="view" title="Xem chi tiết">
                <Button type="text" icon={<EyeOutlined />} aria-label="Xem chi tiết" onClick={(e) => { e.stopPropagation(); onView(item); }} />
              </Tooltip>,
              <Tooltip key="edit" title="Sửa tên / loại / bộ luật">
                <Button type="text" icon={<EditOutlined />} aria-label="Sửa" onClick={(e) => { e.stopPropagation(); onEdit(item); }} />
              </Tooltip>,
              <Tooltip key="delete" title="Xoá sơ đồ">
                <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xoá" onClick={(e) => { e.stopPropagation(); onDelete(item); }} />
              </Tooltip>,
            ]}
          >
            <Space orientation="vertical" size={8} className="w-full">
              <Typography.Text strong>{item.name}</Typography.Text>
              <DiagramTypeTag type={types.find((t) => t.id === item.templateId)} />
              <Space size={4} wrap>
                <Tag color="blue">{item.nodes.length} khối</Tag>
                <Tag color="green">{item.edges.length} liên kết</Tag>
                {item.ruleSetIds.length > 0 && <Tag color="gold">{item.ruleSetIds.length} bộ luật</Tag>}
              </Space>
              <Typography.Text type="secondary" className="text-xs">
                Cập nhật {formatDate(item.updatedAt)}
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
