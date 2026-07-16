import { useState } from 'react';
import { App, Button, Input, Segmented, Select, Space } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/shared/ui';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useAllDiagramTypes } from '@/features/diagram-types';
import { paths } from '@/app/router/paths';
import { DiagramsTable } from '../components/DiagramsTable';
import { DiagramsGrid } from '../components/DiagramsGrid';
import { DiagramDetailModal } from '../components/DiagramDetailModal';
import { DiagramFormModal } from '../components/DiagramFormModal';
import { useDiagrams, useDiagramMutations } from '../hooks/use-diagrams';
import type { Diagram, DiagramInput, DiagramsViewMode } from '../types';

/** Container page: owns list/filter/view/modal state and wires hooks to components. */
export function DiagramsPage() {
  const { modal } = App.useApp();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [view, setView] = useState<DiagramsViewMode>('table');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Diagram | null>(null);
  const [detail, setDetail] = useState<Diagram | null>(null);

  const { data, isFetching } = useDiagrams({ page, pageSize, search: debouncedSearch, templateId });
  const { data: types } = useAllDiagramTypes();
  const { create, update, remove } = useDiagramMutations();

  const resetPage = () => setPage(1);

  const openCanvas = (item: Diagram) => navigate(`${paths.diagrams}/${item.id}`);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (item: Diagram) => {
    setDetail(null);
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = (values: DiagramInput) => {
    const onDone = () => setModalOpen(false);
    if (editing) update.mutate({ id: editing.id, input: values }, { onSuccess: onDone });
    else create.mutate(values, { onSuccess: onDone });
  };

  const confirmDelete = (item: Diagram) => {
    modal.confirm({
      title: `Xoá sơ đồ “${item.name}”?`,
      okText: 'Xoá',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: () => remove.mutateAsync(item.id),
    });
  };

  const listProps = {
    data: data?.items ?? [],
    types: types ?? [],
    total: data?.total ?? 0,
    page,
    pageSize,
    loading: isFetching,
    onPageChange: (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
    },
    onOpen: openCanvas,
    onView: setDetail,
    onEdit: openEdit,
    onDelete: confirmDelete,
  };

  return (
    <PageContainer
      title="Sơ đồ"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm mới
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Space wrap>
          <Input.Search
            placeholder="Tìm sơ đồ"
            allowClear
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            className="w-60"
          />
          <Select<string>
            allowClear
            placeholder="Lọc theo loại sơ đồ"
            value={templateId}
            onChange={(value) => {
              setTemplateId(value);
              resetPage();
            }}
            className="w-52"
            options={(types ?? []).map((t) => ({ value: t.id, label: `${t.icon ?? '📊'} ${t.name}` }))}
          />
        </Space>
        <Segmented<DiagramsViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: 'table', icon: <UnorderedListOutlined />, label: 'Bảng' },
            { value: 'grid', icon: <AppstoreOutlined />, label: 'Lưới' },
          ]}
        />
      </div>

      {view === 'table' ? <DiagramsTable {...listProps} /> : <DiagramsGrid {...listProps} />}

      <DiagramDetailModal
        open={Boolean(detail)}
        item={detail}
        types={types ?? []}
        onOpenCanvas={openCanvas}
        onEdit={openEdit}
        onClose={() => setDetail(null)}
      />

      <DiagramFormModal
        open={modalOpen}
        initialValue={editing}
        types={types ?? []}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </PageContainer>
  );
}
