import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/app/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { paths } from './paths';
import { LandingPage } from '@/pages/landing';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UsersPage } from '@/features/users';
import { ProfilePage } from '@/features/profile';
import { DiagramTypesPage, DiagramTypeEditorPage } from '@/features/diagram-types';
import { DiagramsPage, DiagramEditorPage } from '@/features/diagrams';

/**
 * Route table (React Router v7, data mode).
 * Feature pages are imported from their feature folder's public API.
 * For large apps, wrap page elements with React.lazy + <Suspense>.
 */
export const router = createBrowserRouter([
  // Public marketing landing page at "/".
  { path: paths.root, element: <LandingPage /> },
  { path: paths.login, element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: paths.dashboard, element: <DashboardPage /> },
          { path: paths.users, element: <UsersPage /> },
          { path: paths.profile, element: <ProfilePage /> },
          { path: paths.diagrams, element: <DiagramsPage /> },
          { path: `${paths.diagrams}/:id`, element: <DiagramEditorPage /> },
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
