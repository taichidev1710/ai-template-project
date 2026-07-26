import { Button, Card, Form, Input, Typography } from 'antd';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogin, type LoginInput } from '@/features/auth';
import { useAuthStore } from '@/shared/stores/auth-store';
import { paths } from '@/app/router/paths';

/** Real login against POST /auth/login → GET /users/me. */
export function LoginPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useLogin();

  // Already signed in → don't show the form again.
  if (isAuthenticated) {
    return <Navigate to={paths.dashboard} replace />;
  }

  const onFinish = (values: LoginInput) => login.mutate(values);

  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <Card className="w-[360px]">
        <Typography.Title level={3} className="text-center">
          {t('login.title')}
        </Typography.Title>
        <Form<LoginInput> layout="vertical" onFinish={onFinish} requiredMark={false} disabled={login.isPending}>
          <Form.Item name="email" label={t('login.email')} rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="admin@example.com" autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" label={t('login.password')} rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={login.isPending}>
            {t('login.submit')}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
