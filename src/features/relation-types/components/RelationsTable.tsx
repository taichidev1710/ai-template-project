import { Button, Space, Table, Tag, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { isDerivedRelation } from '@/domain/diagram';
import { RelationLinePreview } from './RelationLinePreview';
import { patternText, roleLabel } from '../types';
import type { Relation } from '../types';

interface RelationsTableProps {
  data: Relation[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (item: Relation) => void;
  onEdit: (item: Relation) => void;
  onDelete: (item: Relation) => void;
  /** Resolve a relation id to its friendly name (for the derived "over" column). */
  relationName?: (id: string) => string;
}

export function RelationsTable({ data, total, page, pageSize, loading, onPageChange, onView, onEdit, onDelete, relationName }: RelationsTableProps) {
  const pagination: TablePaginationConfig = { current: page, pageSize, total, showSizeChanger: true, onChange: onPageChange };

  return (
    <Table<Relation>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      columns={[
        {
          title: 'Quan hệ',
          dataIndex: 'name',
          render: (name: string, r) => (
            <Space>
              <RelationLinePreview style={r.style} />
              {name}
            </Space>
          ),
        },
        {
          title: 'Loại',
          key: 'kind',
          render: (_, r) =>
            isDerivedRelation(r) ? <Tag color="purple">Suy ra</Tag> : <Tag color="blue">Nền</Tag>,
        },
        {
          title: 'Vai trò / Đường đi',
          key: 'roleOrPattern',
          render: (_, r) =>
            isDerivedRelation(r) ? (
              <Typography.Text>
                {patternText(r.pattern)}{' '}
                <Typography.Text type="secondary" className="text-xs">
                  trên {relationName?.(r.overRelationId) ?? r.overRelationId}
                </Typography.Text>
              </Typography.Text>
            ) : (
              roleLabel(r.role)
            ),
        },
        { title: 'Mã', dataIndex: 'id', render: (id: string) => <Typography.Text code>{id}</Typography.Text> },
        {
          title: '',
          key: 'actions',
          width: 132,
          render: (_, r) => (
            <Space>
              <Button type="text" icon={<EyeOutlined />} aria-label="View" onClick={() => onView(r)} />
              <Button type="text" icon={<EditOutlined />} aria-label="Edit" onClick={() => onEdit(r)} />
              <Button type="text" danger icon={<DeleteOutlined />} aria-label="Delete" onClick={() => onDelete(r)} />
            </Space>
          ),
        },
      ]}
    />
  );
}
