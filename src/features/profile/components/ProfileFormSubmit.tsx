import { Button } from 'antd';
import type { ButtonProps, FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ProfileInput } from '../types';

interface ProfileFormSubmitProps extends Omit<ButtonProps, 'htmlType' | 'onClick' | 'form'> {
  /**
   * Pass the form instance when this button lives OUTSIDE the form (modal
   * footer, page header, sticky action bar) — it then calls form.submit().
   * Omit it when rendered INSIDE <ProfileForm> (e.g. via its `footer` prop) —
   * it then submits natively via htmlType="submit".
   */
  form?: FormInstance<ProfileInput>;
}

/**
 * Submit button for <ProfileForm>, usable in BOTH positions. Screens compose
 * what they need: form only, form + this button inside, or form + this button
 * anywhere else via the shared form instance. Defaults to a primary "Save".
 */
export function ProfileFormSubmit({ form, children, type = 'primary', ...rest }: ProfileFormSubmitProps) {
  const { t } = useTranslation();
  const label = children ?? t('action.save');

  if (form) {
    return (
      <Button type={type} onClick={() => form.submit()} {...rest}>
        {label}
      </Button>
    );
  }
  return (
    <Button type={type} htmlType="submit" {...rest}>
      {label}
    </Button>
  );
}
