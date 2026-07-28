import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth-store';
import { paths } from './paths';

/** Khu STAFF (/admin/*): cần đăng nhập + userType='staff'. Member vào nhầm → về /app. */
export function RequireStaff() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userType = useAuthStore((s) => s.user?.userType);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace state={{ from: location }} />;
  }
  if (userType === 'member') {
    return <Navigate to={paths.app.home} replace />;
  }
  return <Outlet />;
}
