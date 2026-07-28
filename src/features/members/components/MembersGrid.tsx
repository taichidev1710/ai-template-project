import { Button, Card, Empty, Pagination, Skeleton, Space, Tag } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  LockOutlined,
  SettingOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MembersViewProps } from './MembersTable';

const STATUS_COLOR: Record<string, string> = {
  pending: 'gold',
  active: 'green',
  disabled: 'default',
  rejected: 'red',
};

export function MembersGrid({
  data,
  total,
  page,
  pageSize,
  loading,
  tierName,
  canApprove,
  canManage,
  onPageChange,
  onView,
  onApprove,
  onReject,
  onToggleStatus,
  onManage,
}: MembersViewProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: pageSize }, (_, i) => (
          <Card key={i}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) return <Empty description={t('empty')} />;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((m) => (
          <Card
            key={m.id}
            title={m.name}
            actions={[
              <Button
                key="view"
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(m)}
              />,
              ...(canApprove && m.status === 'pending'
                ? [
                    <Button
                      key="approve"
                      type="text"
                      icon={<CheckOutlined />}
                      aria-label={t('member.approve')}
                      onClick={() => onApprove(m)}
                    />,
                    <Button
                      key="reject"
                      type="text"
                      danger
                      icon={<CloseOutlined />}
                      aria-label={t('member.reject')}
                      onClick={() => onReject(m)}
                    />,
                  ]
                : []),
              ...(canManage && (m.status === 'active' || m.status === 'disabled')
                ? [
                    <Button
                      key="lock"
                      type="text"
                      icon={m.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
                      aria-label={m.status === 'active' ? t('member.disable') : t('member.enable')}
                      onClick={() => onToggleStatus(m)}
                    />,
                  ]
                : []),
              ...(canManage
                ? [
                    <Button
                      key="manage"
                      type="text"
                      icon={<SettingOutlined />}
                      aria-label={t('member.manage')}
                      onClick={() => onManage(m)}
                    />,
                  ]
                : []),
            ]}
          >
            <Space orientation="vertical" size={8} className="w-full">
              <span className="text-muted">{m.email}</span>
              <Space size={4} wrap>
                <Tag color={STATUS_COLOR[m.status]}>{t(`status.${m.status}`)}</Tag>
                <Tag>{m.tierId ? (tierName.get(m.tierId) ?? m.tierId.slice(-6)) : t('member.noTier')}</Tag>
              </Space>
            </Space>
          </Card>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          onChange={onPageChange}
        />
      </div>
    </>
  );
}
