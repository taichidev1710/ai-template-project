import { Button, Card, Form, Input, Result, Typography } from 'antd';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRegister, type RegisterInput } from '@/features/auth';
import { useAuthStore } from '@/shared/stores/auth-store';
import { paths } from '@/app/router/paths';

/** Public sign-up → creates a pending account (approval required before use). */
export function RegisterPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const register = useRegister();

  if (isAuthenticated) {
    return <Navigate to={paths.dashboard} replace />;
  }

  const onFinish = (values: RegisterInput) => register.mutate(values);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <Card className="w-[400px]">
        {register.isSuccess ? (
          <Result
            status="success"
            title={t('register.pendingTitle')}
            subTitle={t('register.pendingMessage')}
            extra={
              <Link to={paths.login}>
                <Button type="primary">{t('login.submit')}</Button>
              </Link>
            }
          />
        ) : (
          <>
            <Typography.Title level={3} className="text-center">
              {t('register.title')}
            </Typography.Title>
            <Form<RegisterInput>
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              disabled={register.isPending}
            >
              <Form.Item name="name" label={t('register.name')} rules={[{ required: true }]}>
                <Input autoComplete="name" />
              </Form.Item>
              <Form.Item
                name="email"
                label={t('register.email')}
                rules={[{ required: true, type: 'email' }]}
              >
                <Input placeholder="you@example.com" autoComplete="email" />
              </Form.Item>
              <Form.Item
                name="password"
                label={t('register.password')}
                rules={[{ required: true, min: 8 }]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={register.isPending}>
                {t('register.submit')}
              </Button>
              <div className="mt-4 text-center">
                <Link to={paths.login}>{t('register.toLogin')}</Link>
              </div>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
}
