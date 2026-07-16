import { useState } from 'react';
import { App, Button, Input, Segmented, Space } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/shared/ui';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { paths } from '@/app/router/paths';
import { DiagramTypesTable } from '../components/DiagramTypesTable';
import { DiagramTypesGrid } from '../components/DiagramTypesGrid';
import { DiagramTypeFormModal } from '../components/DiagramTypeFormModal';
import { useDiagramTypes, useDiagramTypeMutations } from '../hooks/use-diagram-types';
import type { DiagramTemplate, DiagramTypeInput, DiagramTypesViewMode } from '../types';

/** List of Loại sơ đồ. Opening one goes to its editor (blocks/relations/rules). */
export function DiagramTypesPage() {
  const { modal } = App.useApp();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [view, setView] = useState<DiagramTypesViewMode>('table');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DiagramTemplate | null>(null);

  const { data, isFetching } = useDiagramTypes({ page, pageSize, search: debouncedSearch });
  const { create, update, remove } = useDiagramTypeMutations();

  const openEditor = (item: DiagramTemplate) => navigate(`${paths.diagramTypes}/${item.id}`);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openRename = (item: DiagramTemplate) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = (values: DiagramTypeInput) => {
    const onDone = () => setModalOpen(false);
    if (editing) update.mutate({ id: editing.id, input: values }, { onSuccess: onDone });
    else create.mutate(values, { onSuccess: (createdType) => { onDone(); openEditor(createdType); } });
  };

  const confirmDelete = (item: DiagramTemplate) => {
    modal.confirm({
      title: `Xoá loại sơ đồ “${item.name}”?`,
      content: item.builtin ? 'Đây là loại mẫu dựng sẵn.' : undefined,
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
    onOpen: openEditor,
    onEdit: openRename,
    onDelete: confirmDelete,
  };

  return (
    <PageContainer
      title="Loại sơ đồ"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm mới
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Space wrap>
          <Input.Search
            placeholder="Tìm loại sơ đồ"
            allowClear
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-60"
          />
        </Space>
        <Segmented<DiagramTypesViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: 'table', icon: <UnorderedListOutlined />, label: 'Bảng' },
            { value: 'grid', icon: <AppstoreOutlined />, label: 'Lưới' },
          ]}
        />
      </div>

      {view === 'table' ? <DiagramTypesTable {...listProps} /> : <DiagramTypesGrid {...listProps} />}

      <DiagramTypeFormModal
        open={modalOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </PageContainer>
  );
}
