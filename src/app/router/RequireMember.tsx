import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth-store';
import { paths } from './paths';

/** Khu MEMBER (/app/*): cần đăng nhập + userType='member'. Staff vào nhầm → về /admin. */
export function RequireMember() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userType = useAuthStore((s) => s.user?.userType);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace state={{ from: location }} />;
  }
  if (userType !== 'member') {
    return <Navigate to={paths.dashboard} replace />;
  }
  return <Outlet />;
}
