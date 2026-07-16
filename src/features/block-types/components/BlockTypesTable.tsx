import { Button, Space, Table, Tag, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { BlockGlyph } from './BlockGlyph';
import { shapeLabel } from '../types';
import type { BlockType } from '../types';

interface BlockTypesTableProps {
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

/** Presentational table. All data + handlers come from props. */
export function BlockTypesTable({
  data,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: BlockTypesTableProps) {
  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: onPageChange,
  };

  return (
    <Table<BlockType>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      columns={[
        {
          title: 'Loại khối',
          dataIndex: 'name',
          render: (name: string, record) => (
            <Space>
              <BlockGlyph shape={record.shape} color={record.color} />
              {name}
            </Space>
          ),
        },
        { title: 'Hình', dataIndex: 'shape', render: (shape: BlockType['shape']) => shapeLabel(shape) },
        {
          title: 'Màu',
          dataIndex: 'color',
          render: (color: string) => <Tag color={color}>{color}</Tag>,
        },
        {
          title: 'Mã',
          dataIndex: 'id',
          render: (id: string) => <Typography.Text code>{id}</Typography.Text>,
        },
        {
          title: '',
          key: 'actions',
          width: 132,
          render: (_, record) => (
            <Space>
              <Button type="text" icon={<EyeOutlined />} aria-label="View" onClick={() => onView(record)} />
              <Button type="text" icon={<EditOutlined />} aria-label="Edit" onClick={() => onEdit(record)} />
              <Button type="text" danger icon={<DeleteOutlined />} aria-label="Delete" onClick={() => onDelete(record)} />
            </Space>
          ),
        },
      ]}
    />
  );
}
