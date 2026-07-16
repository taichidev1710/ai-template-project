import { Form, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { ProfileForm } from './ProfileForm';
import type { Profile, ProfileInput, ProfileSurface } from '../types';

interface ProfileFormModalProps {
  open: boolean;
  initialValue?: Profile | null;
  confirmLoading?: boolean;
  /** Which surface/route is editing — feeds field disable/require rules. */
  surface?: ProfileSurface;
  /** Viewer permission check — feeds field disable rules. */
  can?: (permission: string) => boolean;
  onSubmit: (values: ProfileInput) => void;
  onCancel: () => void;
}

/**
 * Thin Modal shell around <ProfileForm>. The form body is container-agnostic —
 * other screens embed <ProfileForm> directly (page, drawer, card) with their
 * own submit button; this wrapper only wires the Modal's OK button to it.
 */
export function ProfileFormModal({
  open,
  initialValue,
  confirmLoading,
  surface,
  can,
  onSubmit,
  onCancel,
}: ProfileFormModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<ProfileInput>();
  const isEdit = Boolean(initialValue);

  return (
    <Modal
      open={open}
      width="min(880px, 94vw)"
      title={isEdit ? t('profile.editTitle') : t('profile.createTitle')}
      okText={t('action.save')}
      cancelText={t('action.cancel')}
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <ProfileForm form={form} initialValue={initialValue} surface={surface} can={can} onSubmit={onSubmit} />
    </Modal>
  );
}
