import { Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/shared/stores/auth-store';
import { paths } from '@/app/router/paths';

interface LoginForm {
  email: string;
  password: string;
}

/**
 * Demo login. Replace `onFinish` with a real POST /auth/login mutation and
 * call `setAuth` with the returned token + user.
 */
export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onFinish = (values: LoginForm) => {
    setAuth({
      token: 'demo-token',
      user: { id: '1', name: values.email.split('@')[0] ?? 'Admin', email: values.email, roles: ['admin'] },
    });
    navigate(paths.dashboard);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <Card className="w-[360px]">
        <Typography.Title level={3} className="text-center">
          {t('login.title')}
        </Typography.Title>
        <Form<LoginForm> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="email" label={t('login.email')} rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="admin@example.com" autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" label={t('login.password')} rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            {t('login.submit')}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
