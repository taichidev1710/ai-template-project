import { useEffect, useState } from 'react';
import { Button, Modal, Select, Tabs, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useRoles } from '@/features/roles';
import { usePermissionGroups } from '@/features/permission-groups';
import { PermissionPicker } from '@/shared/ui/PermissionPicker';
import { useCan } from '@/shared/lib/can';
import { PERM } from '@/shared/authz/permissions';
import { useUsers, useUserMutations } from '../hooks/use-users';
import type { User } from '../types';

interface Props {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

/** Assign roles / permission groups / ad-hoc grants / manager to a user. */
export function AssignAccessModal({ user, open, onClose }: Props) {
  const { t } = useTranslation();
  const can = useCan();
  const { data: roles } = useRoles({ limit: 100 });
  const { data: groups } = usePermissionGroups({ limit: 100 });
  const { data: candidates, isLoading: loadingCandidates } = useUsers({ limit: 100 });
  const { assignRoles, assignGroups, setExtraPermissions, reassignManager } = useUserMutations();

  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [grants, setGrants] = useState<string[]>([]);
  const [managerId, setManagerId] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      setRoleIds(user.roleIds);
      setGroupIds(user.permissionGroupIds);
      setGrants(user.extraPermissions);
      setManagerId(user.managerId);
    }
  }, [open, user]);

  if (!user) return null;

  const targetId = user.id;
  const saveRoles = () => assignRoles.mutate({ id: targetId, roleIds }, { onSuccess: onClose });
  const saveGroups = () => assignGroups.mutate({ id: targetId, groupIds }, { onSuccess: onClose });
  const saveExtra = () =>
    setExtraPermissions.mutate({ id: targetId, grants }, { onSuccess: onClose });
  const saveManager = () =>
    reassignManager.mutate({ id: targetId, managerId }, { onSuccess: onClose });

  const items = [
    {
      key: 'roles',
      label: t('nav.roles'),
      children: (
        <div className="flex flex-col gap-3">
          <Select
            mode="multiple"
            allowClear
            optionFilterProp="label"
            placeholder={t('nav.roles')}
            value={roleIds}
            onChange={setRoleIds}
            options={(roles?.items ?? []).map((r) => ({ value: r.id, label: r.name }))}
          />
          <ModalFooter onCancel={onClose} onOk={saveRoles} loading={assignRoles.isPending} />
        </div>
      ),
    },
    {
      key: 'groups',
      label: t('nav.groups'),
      children: (
        <div className="flex flex-col gap-3">
          <Select
            mode="multiple"
            allowClear
            optionFilterProp="label"
            placeholder={t('nav.groups')}
            value={groupIds}
            onChange={setGroupIds}
            options={(groups?.items ?? []).map((g) => ({ value: g.id, label: g.name }))}
          />
          <ModalFooter onCancel={onClose} onOk={saveGroups} loading={assignGroups.isPending} />
        </div>
      ),
    },
    {
      key: 'extra',
      label: t('group.grants'),
      children: (
        <div className="flex flex-col gap-3">
          <PermissionPicker value={grants} onChange={setGrants} />
          <ModalFooter
            onCancel={onClose}
            onOk={saveExtra}
            loading={setExtraPermissions.isPending}
          />
        </div>
      ),
    },
  ];

  // Đổi quản lý (cây tổ chức) — chỉ hiện khi có quyền user:update. BE vẫn là hàng rào thật.
  if (can(PERM.user.update)) {
    items.push({
      key: 'manager',
      label: t('user.manager'),
      children: (
        <div className="flex flex-col gap-3">
          <Select<string>
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t('user.managerNone')}
            loading={loadingCandidates}
            value={managerId ?? undefined}
            onChange={(v) => setManagerId(v ?? null)}
            options={(candidates?.items ?? [])
              .filter((u) => u.id !== targetId)
              .map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
          />
          <Typography.Text type="secondary">{t('user.managerHint')}</Typography.Text>
          <ModalFooter
            onCancel={onClose}
            onOk={saveManager}
            loading={reassignManager.isPending}
          />
        </div>
      ),
    });
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={`${t('action.assign')} — ${user.name}`}
      width={640}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
    >
      <Tabs items={items} />
    </Modal>
  );
}

function ModalFooter({
  onCancel,
  onOk,
  loading,
}: {
  onCancel: () => void;
  onOk: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end gap-2">
      <Button onClick={onCancel}>{t('action.cancel')}</Button>
      <Button type="primary" loading={loading} onClick={onOk}>
        {t('action.save')}
      </Button>
    </div>
  );
}
