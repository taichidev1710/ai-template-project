import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/app/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { paths } from './paths';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UsersPage } from '@/features/users';
import { ProfilePage } from '@/features/profile';
import { DiagramTypesPage, DiagramTypeEditorPage } from '@/features/diagram-types';

/**
 * Route table (React Router v7, data mode).
 * Feature pages are imported from their feature folder's public API.
 * For large apps, wrap page elements with React.lazy + <Suspense>.
 */
export const router = createBrowserRouter([
  { path: paths.login, element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: paths.root, element: <Navigate to={paths.dashboard} replace /> },
          { path: paths.dashboard, element: <DashboardPage /> },
          { path: paths.users, element: <UsersPage /> },
          { path: paths.profile, element: <ProfilePage /> },
          { path: paths.diagramTypes, element: <DiagramTypesPage /> },
          { path: `${paths.diagramTypes}/:id`, element: <DiagramTypeEditorPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
], {
  // Matches vite.config.ts's `base` when built for GitHub Pages.
  basename: import.meta.env.BASE_URL,
});
