import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/router/paths';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" onClick={() => navigate(paths.dashboard)}>
            Back Home
          </Button>
        }
      />
    </div>
  );
}
