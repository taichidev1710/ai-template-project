import { useState } from 'react';
import { App, Button, Input, Segmented, Space } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { BlockTypesTable } from './BlockTypesTable';
import { BlockTypesGrid } from './BlockTypesGrid';
import { BlockTypeDetailModal } from './BlockTypeDetailModal';
import { BlockTypeFormModal } from './BlockTypeFormModal';
import { useBlockTypes, useBlockTypeMutations } from '../hooks/use-block-types';
import type { BlockType, BlockTypeInput, BlockTypesViewMode } from '../types';

/**
 * The "Khối" tab of a Loại sơ đồ editor — block-type CRUD scoped to one type.
 * No PageContainer/title: it's embedded in the type editor's tabs.
 */
export function BlockTypesPanel({ typeId }: { typeId: string }) {
  const { modal } = App.useApp();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [view, setView] = useState<BlockTypesViewMode>('table');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlockType | null>(null);
  const [detail, setDetail] = useState<BlockType | null>(null);

  const { data, isFetching } = useBlockTypes(typeId, { page, pageSize, search: debouncedSearch });
  const { create, update, remove } = useBlockTypeMutations(typeId);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (item: BlockType) => {
    setDetail(null);
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = (values: BlockTypeInput) => {
    const onDone = () => setModalOpen(false);
    if (editing) update.mutate({ id: editing.id, input: values }, { onSuccess: onDone });
    else create.mutate(values, { onSuccess: onDone });
  };

  const confirmDelete = (item: BlockType) => {
    modal.confirm({
      title: `Xoá loại khối “${item.name}”?`,
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
            placeholder="Tìm loại khối"
            allowClear
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-60"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm khối
          </Button>
        </Space>
        <Segmented<BlockTypesViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: 'table', icon: <UnorderedListOutlined />, label: 'Bảng' },
            { value: 'grid', icon: <AppstoreOutlined />, label: 'Lưới' },
          ]}
        />
      </div>

      {view === 'table' ? <BlockTypesTable {...listProps} /> : <BlockTypesGrid {...listProps} />}

      <BlockTypeDetailModal open={Boolean(detail)} item={detail} onEdit={openEdit} onClose={() => setDetail(null)} />
      <BlockTypeFormModal
        open={modalOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}
