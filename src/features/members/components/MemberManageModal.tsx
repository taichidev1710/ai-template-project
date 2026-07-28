import { useEffect, useState } from 'react';
import { Button, Modal, Select, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTiers } from '@/features/tiers';
import { useMemberGroups } from '@/features/member-groups';
import { useMemberMutations } from '../hooks/use-members';
import type { MemberItem } from '../types';

interface Props {
  member: MemberItem | null;
  open: boolean;
  onClose: () => void;
}

/** Đổi cấp bậc + gán nhóm quyền member lẻ cho một thành viên. BE là hàng rào thật. */
export function MemberManageModal({ member, open, onClose }: Props) {
  const { t } = useTranslation();
  const { data: tiers } = useTiers({ limit: 100 });
  const { data: groups } = useMemberGroups({ limit: 100 });
  const { reassignTier, setMemberGroups } = useMemberMutations();

  const [tierId, setTierId] = useState<string | null>(null);
  const [groupIds, setGroupIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && member) {
      setTierId(member.tierId);
      setGroupIds(member.memberPermissionGroupIds);
    }
  }, [open, member]);

  if (!member) return null;

  const saveTier = () =>
    reassignTier.mutate({ id: member.id, tierId }, { onSuccess: onClose });
  const saveGroups = () =>
    setMemberGroups.mutate({ id: member.id, groupIds }, { onSuccess: onClose });

  return (
    <Modal
      open={open}
      title={member.name}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={560}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
    >
      <Tabs
        items={[
          {
            key: 'tier',
            label: t('member.tier'),
            children: (
              <div className="flex flex-col gap-3">
                <Select<string>
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder={t('member.noTier')}
                  value={tierId ?? undefined}
                  onChange={(v) => setTierId(v ?? null)}
                  options={(tiers?.items ?? []).map((tier) => ({ value: tier.id, label: tier.name }))}
                />
                <div className="flex justify-end gap-2">
                  <Button onClick={onClose}>{t('action.cancel')}</Button>
                  <Button type="primary" loading={reassignTier.isPending} onClick={saveTier}>
                    {t('action.save')}
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: 'groups',
            label: t('member.adhocGroups'),
            children: (
              <div className="flex flex-col gap-3">
                <Select
                  mode="multiple"
                  allowClear
                  optionFilterProp="label"
                  placeholder={t('memberGroup.title')}
                  value={groupIds}
                  onChange={setGroupIds}
                  options={(groups?.items ?? []).map((g) => ({ value: g.id, label: g.name }))}
                />
                <div className="flex justify-end gap-2">
                  <Button onClick={onClose}>{t('action.cancel')}</Button>
                  <Button type="primary" loading={setMemberGroups.isPending} onClick={saveGroups}>
                    {t('action.save')}
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}
