import { useEffect, useState } from 'react';
import { Button, Modal, Select, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { useRoles } from '@/features/roles';
import { usePermissionGroups } from '@/features/permission-groups';
import { PermissionPicker } from '@/shared/ui/PermissionPicker';
import { useUserMutations } from '../hooks/use-users';
import type { User } from '../types';

interface Props {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

/** Assign roles / permission groups / ad-hoc grants to a user. */
export function AssignAccessModal({ user, open, onClose }: Props) {
  const { t } = useTranslation();
  const { data: roles } = useRoles({ limit: 100 });
  const { data: groups } = usePermissionGroups({ limit: 100 });
  const { assignRoles, assignGroups, setExtraPermissions } = useUserMutations();

  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [grants, setGrants] = useState<string[]>([]);

  useEffect(() => {
    if (open && user) {
      setRoleIds(user.roleIds);
      setGroupIds(user.permissionGroupIds);
      setGrants(user.extraPermissions);
    }
  }, [open, user]);

  if (!user) return null;

  const saveRoles = () =>
    assignRoles.mutate({ id: user.id, roleIds }, { onSuccess: onClose });
  const saveGroups = () =>
    assignGroups.mutate({ id: user.id, groupIds }, { onSuccess: onClose });
  const saveExtra = () =>
    setExtraPermissions.mutate({ id: user.id, grants }, { onSuccess: onClose });

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={`${t('action.assign')} — ${user.name}`} width={640}>
      <Tabs
        items={[
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
        ]}
      />
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
