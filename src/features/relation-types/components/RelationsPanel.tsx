import { useState } from 'react';
import { App, Button, Input, Segmented, Space } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { RelationsTable } from './RelationsTable';
import { RelationsGrid } from './RelationsGrid';
import { RelationDetailModal } from './RelationDetailModal';
import { RelationFormModal } from './RelationFormModal';
import { useAllRelations, useRelations, useRelationMutations } from '../hooks/use-relation-types';
import type { Relation, RelationInput, RelationsViewMode } from '../types';

/** The "Quan hệ" tab — base (primary/secondary) + derived relations, scoped to one type. */
export function RelationsPanel({ typeId }: { typeId: string }) {
  const { modal } = App.useApp();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [view, setView] = useState<RelationsViewMode>('table');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Relation | null>(null);
  const [detail, setDetail] = useState<Relation | null>(null);

  const { data, isFetching } = useRelations(typeId, { page, pageSize, search: debouncedSearch });
  const { data: allRelations } = useAllRelations(typeId);
  const { create, update, remove } = useRelationMutations(typeId);

  const relationName = (id: string) => (allRelations ?? []).find((r) => r.id === id)?.name ?? id;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (item: Relation) => {
    setDetail(null);
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = (values: RelationInput) => {
    const onDone = () => setModalOpen(false);
    if (editing) update.mutate({ id: editing.id, input: values }, { onSuccess: onDone });
    else create.mutate(values, { onSuccess: onDone });
  };

  const confirmDelete = (item: Relation) => {
    modal.confirm({
      title: `Xoá quan hệ “${item.name}”?`,
      okText: 'Xoá',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: () => remove.mutateAsync(item.id),
    });
  };

  const listProps = {
    data: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    pageSize,
    loading: isFetching,
    onPageChange: (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
    },
    onView: setDetail,
    onEdit: openEdit,
    onDelete: confirmDelete,
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Space wrap>
          <Input.Search
            placeholder="Tìm quan hệ"
            allowClear
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-60"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm quan hệ
          </Button>
        </Space>
        <Segmented<RelationsViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: 'table', icon: <UnorderedListOutlined />, label: 'Bảng' },
            { value: 'grid', icon: <AppstoreOutlined />, label: 'Lưới' },
          ]}
        />
      </div>

      {view === 'table' ? (
        <RelationsTable {...listProps} relationName={relationName} />
      ) : (
        <RelationsGrid {...listProps} relationName={relationName} />
      )}

      <RelationDetailModal open={Boolean(detail)} item={detail} onEdit={openEdit} onClose={() => setDetail(null)} relationName={relationName} />
      <RelationFormModal
        open={modalOpen}
        initialValue={editing}
        relations={allRelations ?? []}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}
