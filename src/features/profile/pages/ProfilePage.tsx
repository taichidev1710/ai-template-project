import { useState } from 'react';
import { App, Button, Drawer, Input, Select, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { ProfilesTable } from '../components/ProfilesTable';
import { ProfileFormModal } from '../components/ProfileFormModal';
import { ProfileCard } from '../components/ProfileCard';
import { TIER_ORDER, getTierConfig } from '../config/tiers';
import { STATUS_ORDER, getStatusConfig } from '../config/status';
import { useProfiles, useProfileMutations } from '../hooks/use-profile';
import type { Profile, ProfileAction, ProfileInput, ProfileStatus, ProfileTier } from '../types';

/** Container page: owns list/filter/modal state and wires hooks to components. */
export function ProfilePage() {
  const { t } = useTranslation();
  const { modal, message } = App.useApp();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [tier, setTier] = useState<ProfileTier | undefined>();
  const [status, setStatus] = useState<ProfileStatus | undefined>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [detail, setDetail] = useState<Profile | null>(null);

  const { data, isFetching } = useProfiles({ page, pageSize, search: debouncedSearch, tier, status });
  const { create, update, remove } = useProfileMutations();

  const resetPage = () => setPage(1);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (profile: Profile) => {
    setEditing(profile);
    setModalOpen(true);
  };

  const handleSubmit = async (values: ProfileInput) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: values });
      } else {
        await create.mutateAsync(values);
      }
      setModalOpen(false); // close only on success; error toast comes from the hook
    } catch {
      // keep the modal open; useProfileMutations already surfaced the error
    }
  };

  const confirmDelete = (profile: Profile) =>
    modal.confirm({
      title: t('profile.deleteConfirm'),
      okText: t('action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: () => remove.mutateAsync(profile.id),
    });

  // Detail-drawer actions come from the tier/status registry; wire `edit` to the
  // form and toast the rest (a real app dispatches feature behaviour here).
  const handleCardAction = (key: ProfileAction['key'], profile: Profile) => {
    if (key === 'edit') {
      setDetail(null);
      openEdit(profile);
      return;
    }
    message.info(`${t('profile.actionFired')}: ${key}`);
  };

  return (
    <PageContainer
      title={t('nav.profile')}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('action.create')}
        </Button>
      }
    >
      <Space wrap className="mb-4">
        <Input.Search
          placeholder={t('action.search')}
          allowClear
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
          className="w-60"
        />
        <Select<ProfileTier>
          allowClear
          placeholder={t('profile.filterTier')}
          value={tier}
          onChange={(value) => {
            setTier(value);
            resetPage();
          }}
          className="w-44"
          options={TIER_ORDER.map((x) => ({ value: x, label: t(getTierConfig(x).label) }))}
        />
        <Select<ProfileStatus>
          allowClear
          placeholder={t('profile.filterStatus')}
          value={status}
          onChange={(value) => {
            setStatus(value);
            resetPage();
          }}
          className="w-44"
          options={STATUS_ORDER.map((x) => ({ value: x, label: t(getStatusConfig(x).label) }))}
        />
      </Space>

      <ProfilesTable
        data={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        loading={isFetching}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        onView={setDetail}
        onEdit={openEdit}
        onDelete={confirmDelete}
      />

      <ProfileFormModal
        open={modalOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />

      <Drawer
        open={Boolean(detail)}
        size="large"
        title={t('profile.detailTitle')}
        onClose={() => setDetail(null)}
        destroyOnHidden
      >
        {detail && <ProfileCard profile={detail} onAction={handleCardAction} />}
      </Drawer>
    </PageContainer>
  );
}
