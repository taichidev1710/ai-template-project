import { Button, Space, Table, Tag, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { DiagramTemplate } from '../types';

interface DiagramTypesTableProps {
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

/** Presentational table of Loại sơ đồ. Opening a row goes to the editor. */
export function DiagramTypesTable({ data, total, page, pageSize, loading, onPageChange, onOpen, onEdit, onDelete }: DiagramTypesTableProps) {
  const pagination: TablePaginationConfig = { current: page, pageSize, total, showSizeChanger: true, onChange: onPageChange };

  return (
    <Table<DiagramTemplate>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      onRow={(record) => ({ onClick: () => onOpen(record), style: { cursor: 'pointer' } })}
      columns={[
        {
          title: 'Loại sơ đồ',
          dataIndex: 'name',
          render: (name: string, record) => (
            <Space>
              <span style={{ fontSize: 18 }}>{record.icon ?? '📊'}</span>
              <span className="font-medium">{name}</span>
              {record.builtin && <Tag>mẫu</Tag>}
            </Space>
          ),
        },
        {
          title: 'Vốn từ vựng',
          key: 'catalog',
          render: (_, record) => (
            <Space size={4} wrap>
              <Tag color="blue">{record.blockTypes.length} khối</Tag>
              <Tag color="green">{record.relations.length} quan hệ</Tag>
              <Tag color="gold">{record.ruleSets.length} bộ luật</Tag>
            </Space>
          ),
        },
        {
          title: 'Mô tả',
          dataIndex: 'description',
          render: (d: string) => (
            <Typography.Text type="secondary" ellipsis={{ tooltip: d }} style={{ maxWidth: 320, display: 'inline-block' }}>
              {d}
            </Typography.Text>
          ),
        },
        {
          title: '',
          key: 'actions',
          width: 132,
          render: (_, record) => (
            <Space onClick={(e) => e.stopPropagation()}>
              <Button type="text" icon={<ArrowRightOutlined />} aria-label="Open" onClick={() => onOpen(record)} />
              <Button type="text" icon={<EditOutlined />} aria-label="Edit" onClick={() => onEdit(record)} />
              <Button type="text" danger icon={<DeleteOutlined />} aria-label="Delete" onClick={() => onDelete(record)} />
            </Space>
          ),
        },
      ]}
    />
  );
}
