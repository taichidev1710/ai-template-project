import { useMemo, useState } from 'react';
import { App, Input, Modal, Segmented, Select, Space } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { QueryError } from '@/shared/ui/QueryError';
import { useCan } from '@/shared/lib/can';
import { PERM } from '@/shared/authz/permissions';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { USER_STATUSES, type UserStatus } from '@/shared/stores/auth-store';
import { useTiers } from '@/features/tiers';
import { useMembers, useMemberMutations } from '../hooks/use-members';
import { MembersTable } from '../components/MembersTable';
import { MembersGrid } from '../components/MembersGrid';
import { MemberDetailModal } from '../components/MemberDetailModal';
import { MemberManageModal } from '../components/MemberManageModal';
import type { MemberItem } from '../types';

type ViewMode = 'table' | 'grid';

export function MembersPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const can = useCan();

  const [view, setView] = useState<ViewMode>('table');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [status, setStatus] = useState<UserStatus | undefined>(undefined);
  const [tier, setTier] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [detail, setDetail] = useState<MemberItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [manageFor, setManageFor] = useState<MemberItem | null>(null);
  const [rejectFor, setRejectFor] = useState<MemberItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const canApprove = can(PERM.member.approve);
  const canManage = can(PERM.member.update) || can(PERM.memberGroup.assign);

  const { data, isLoading, isError, error, refetch } = useMembers({
    page,
    limit: pageSize,
    search: search || undefined,
    status,
    tier,
  });
  const { data: tiers } = useTiers({ limit: 100 });
  const { approve, reject, setStatus: setMemberStatus } = useMemberMutations();

  const tierName = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of tiers?.items ?? []) map.set(item.id, item.name);
    return map;
  }, [tiers]);

  const openDetail = (m: MemberItem) => {
    setDetail(m);
    setDetailOpen(true);
  };
  const onApprove = (m: MemberItem) =>
    modal.confirm({
      title: t('member.approveConfirm'),
      okText: t('member.approve'),
      cancelText: t('action.cancel'),
      onOk: () => approve.mutateAsync(m.id),
    });
  const onToggleStatus = (m: MemberItem) =>
    setMemberStatus.mutate({ id: m.id, status: m.status === 'active' ? 'disabled' : 'active' });
  const submitReject = () => {
    if (!rejectFor || !rejectReason.trim()) return;
    reject.mutate(
      { id: rejectFor.id, reason: rejectReason.trim() },
      {
        onSuccess: () => {
          setRejectFor(null);
          setRejectReason('');
        },
      },
    );
  };

  const viewProps = {
    data: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    pageSize,
    loading: isLoading,
    tierName,
    canApprove,
    canManage,
    onPageChange: (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
    },
    onView: openDetail,
    onApprove,
    onReject: (m: MemberItem) => {
      setRejectReason('');
      setRejectFor(m);
    },
    onToggleStatus,
    onManage: (m: MemberItem) => setManageFor(m),
  };

  return (
    <PageContainer title={t('member.title')}>
      {isError && <QueryError error={error} onRetry={() => refetch()} />}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Space wrap>
          <Input
            allowClear
            placeholder={t('action.search')}
            className="w-56"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
          <Select<UserStatus>
            allowClear
            placeholder={t('member.status')}
            className="w-40"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={USER_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))}
          />
          <Select<string>
            allowClear
            placeholder={t('member.tier')}
            className="w-40"
            value={tier}
            onChange={(v) => {
              setTier(v);
              setPage(1);
            }}
            options={(tiers?.items ?? []).map((item) => ({ value: item.id, label: item.name }))}
          />
        </Space>
        <Segmented<ViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: 'table', icon: <UnorderedListOutlined />, title: t('view.table') },
            { value: 'grid', icon: <AppstoreOutlined />, title: t('view.grid') },
          ]}
        />
      </div>

      {view === 'table' ? <MembersTable {...viewProps} /> : <MembersGrid {...viewProps} />}

      <MemberDetailModal
        open={detailOpen}
        member={detail}
        tierName={tierName}
        onClose={() => setDetailOpen(false)}
      />
      <MemberManageModal
        member={manageFor}
        open={Boolean(manageFor)}
        onClose={() => setManageFor(null)}
      />
      <Modal
        open={Boolean(rejectFor)}
        title={t('member.reject')}
        okText={t('member.reject')}
        okButtonProps={{ danger: true, disabled: !rejectReason.trim() }}
        cancelText={t('action.cancel')}
        confirmLoading={reject.isPending}
        onOk={submitReject}
        onCancel={() => setRejectFor(null)}
        destroyOnHidden
      >
        <Input.TextArea
          rows={3}
          placeholder={t('member.rejectReason')}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </PageContainer>
  );
}
