import { useState } from 'react';
import { App, Button, Input, Segmented, Space } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { PageContainer } from '@/shared/ui';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { BlockTypesTable } from '../components/BlockTypesTable';
import { BlockTypesGrid } from '../components/BlockTypesGrid';
import { BlockTypeDetailModal } from '../components/BlockTypeDetailModal';
import { BlockTypeFormModal } from '../components/BlockTypeFormModal';
import { useBlockTypes, useBlockTypeMutations } from '../hooks/use-block-types';
import type { BlockType, BlockTypeInput, BlockTypesViewMode } from '../types';

/** Container page: owns list/filter/view/modal state and wires hooks to components. */
export function BlockTypesPage() {
  const { modal } = App.useApp();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [view, setView] = useState<BlockTypesViewMode>('table');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlockType | null>(null);
  const [detail, setDetail] = useState<BlockType | null>(null);

  const { data, isFetching } = useBlockTypes({ page, pageSize, search: debouncedSearch });
  const { create, update, remove } = useBlockTypeMutations();

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
    <PageContainer
      title="Loại khối"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm mới
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Space wrap>
          <Input.Search
            placeholder="Tìm kiếm"
            allowClear
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-60"
          />
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
    </PageContainer>
  );
}
