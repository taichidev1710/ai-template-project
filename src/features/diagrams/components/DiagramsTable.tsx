import { Button, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { DiagramTemplate } from '@/features/diagram-types';
import { formatDate } from '@/shared/lib/utils';
import { DiagramTypeTag } from './DiagramTypeTag';
import type { Diagram } from '../types';

interface DiagramsTableProps {
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

/** Presentational table of Sơ đồ. Clicking a row opens the canvas. */
export function DiagramsTable({ data, types, total, page, pageSize, loading, onPageChange, onOpen, onView, onEdit, onDelete }: DiagramsTableProps) {
  const pagination: TablePaginationConfig = { current: page, pageSize, total, showSizeChanger: true, onChange: onPageChange };

  return (
    <Table<Diagram>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      onRow={(record) => ({ onClick: () => onOpen(record), style: { cursor: 'pointer' } })}
      columns={[
        {
          title: 'Sơ đồ',
          dataIndex: 'name',
          render: (name: string) => <span className="font-medium">{name}</span>,
        },
        {
          title: 'Loại sơ đồ',
          key: 'type',
          render: (_, record) => <DiagramTypeTag type={types.find((t) => t.id === record.templateId)} />,
        },
        {
          title: 'Nội dung',
          key: 'size',
          render: (_, record) => (
            <Space size={4} wrap>
              <Tag color="blue">{record.nodes.length} khối</Tag>
              <Tag color="green">{record.edges.length} liên kết</Tag>
            </Space>
          ),
        },
        {
          title: 'Bộ luật áp dụng',
          key: 'ruleSets',
          render: (_, record) =>
            record.ruleSetIds.length === 0 ? (
              <Typography.Text type="secondary">Không ràng buộc</Typography.Text>
            ) : (
              <Tag color="gold">{record.ruleSetIds.length} bộ luật</Tag>
            ),
        },
        {
          title: 'Cập nhật',
          dataIndex: 'updatedAt',
          render: (value: string) => <Typography.Text type="secondary">{formatDate(value)}</Typography.Text>,
        },
        {
          title: '',
          key: 'actions',
          width: 200,
          // Opening the canvas is the point of a diagram, so it gets a labelled
          // button — four bare icons gave no clue which one drew anything.
          render: (_, record) => (
            <Space onClick={(e) => e.stopPropagation()}>
              <Button type="primary" ghost icon={<ArrowRightOutlined />} onClick={() => onOpen(record)}>
                Mở canvas
              </Button>
              <Tooltip title="Xem chi tiết">
                <Button type="text" icon={<EyeOutlined />} aria-label="Xem chi tiết" onClick={() => onView(record)} />
              </Tooltip>
              <Tooltip title="Sửa tên / loại / bộ luật">
                <Button type="text" icon={<EditOutlined />} aria-label="Sửa" onClick={() => onEdit(record)} />
              </Tooltip>
              <Tooltip title="Xoá sơ đồ">
                <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xoá" onClick={() => onDelete(record)} />
              </Tooltip>
            </Space>
          ),
        },
      ]}
    />
  );
}
