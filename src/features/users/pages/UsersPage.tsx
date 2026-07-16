import { useState } from 'react';
import { App, Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { UsersTable } from '../components/UsersTable';
import { UserFormModal } from '../components/UserFormModal';
import { useUsers, useUserMutations } from '../hooks/use-users';
import type { User, UserInput } from '../types';

/** Container page: owns state, wires hooks to presentational components. */
export function UsersPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { data, isFetching } = useUsers({ page, pageSize, search: debouncedSearch });
  const { create, update, remove } = useUserMutations();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (user: User) => {
    setEditing(user);
    setModalOpen(true);
  };

  const handleSubmit = (values: UserInput) => {
    const onDone = () => setModalOpen(false);
    if (editing) {
      update.mutate({ id: editing.id, input: values }, { onSuccess: onDone });
    } else {
      create.mutate(values, { onSuccess: onDone });
    }
  };

  const confirmDelete = (user: User) => {
    modal.confirm({
      title: t('user.deleteConfirm'),
      okText: t('action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: () => remove.mutateAsync(user.id),
    });
  };

  return (
    <PageContainer
      title={t('nav.users')}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('action.create')}
        </Button>
      }
    >
      <div className="mb-4 max-w-xs">
        <Input.Search
          placeholder={t('action.search')}
          allowClear
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <UsersTable
        data={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        loading={isFetching}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        onEdit={openEdit}
        onDelete={confirmDelete}
      />

      <UserFormModal
        open={modalOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </PageContainer>
  );
}
