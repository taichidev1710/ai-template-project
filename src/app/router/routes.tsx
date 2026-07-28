import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/app/layout/AppLayout';
import { RequireStaff } from './RequireStaff';
import { RequireMember } from './RequireMember';
import { paths } from './paths';
import { LandingPage } from '@/pages/landing';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UsersPage } from '@/features/users';
import { ProfilePage } from '@/features/profile';
import { AccountsPage } from '@/features/accounts';
import { RolesPage } from '@/features/roles';
import { PermissionGroupsPage } from '@/features/permission-groups';
import { FeatureRegistryPage } from '@/features/feature-registry';
import { MembersPage } from '@/features/members';
import { TiersPage } from '@/features/tiers';
import { MemberGroupsPage } from '@/features/member-groups';
import { MemberFeaturesPage } from '@/features/member-features';
import { DiagramTypesPage, DiagramTypeEditorPage } from '@/features/diagram-types';
import { DiagramsPage, DiagramEditorPage } from '@/features/diagrams';
import { VideoStudioPage } from '@/features/video-studio';
import {
  MemberLayout,
  MemberHomePage,
  MemberProfilePage,
  MemberPerksPage,
} from '@/features/member-area';

/**
 * Route table (React Router v7, data mode).
 * Hai khu tách theo userType: STAFF dưới /admin/* (RequireStaff + AppLayout),
 * MEMBER dưới /app/* (RequireMember + MemberLayout). Điều hướng sau login ở use-auth.
 */
export const router = createBrowserRouter(
  [
    // Công khai
    { path: paths.root, element: <LandingPage /> },
    { path: paths.login, element: <LoginPage /> },
    { path: paths.register, element: <RegisterPage /> },

    // Khu STAFF — back-office
    {
      element: <RequireStaff />,
      children: [
        {
          element: <AppLayout />,
          children: [
            { path: '/admin', element: <Navigate to={paths.dashboard} replace /> },
            { path: paths.dashboard, element: <DashboardPage /> },
            { path: paths.users, element: <UsersPage /> },
            { path: paths.accounts, element: <AccountsPage /> },
            { path: paths.roles, element: <RolesPage /> },
            { path: paths.permissionGroups, element: <PermissionGroupsPage /> },
            { path: paths.features, element: <FeatureRegistryPage /> },
            { path: paths.members, element: <MembersPage /> },
            { path: paths.tiers, element: <TiersPage /> },
            { path: paths.memberGroups, element: <MemberGroupsPage /> },
            { path: paths.memberFeatures, element: <MemberFeaturesPage /> },
            { path: paths.profile, element: <ProfilePage /> },
            { path: paths.diagrams, element: <DiagramsPage /> },
            { path: `${paths.diagrams}/:id`, element: <DiagramEditorPage /> },
            { path: paths.diagramTypes, element: <DiagramTypesPage /> },
            { path: `${paths.diagramTypes}/:id`, element: <DiagramTypeEditorPage /> },
            { path: paths.videoStudio, element: <VideoStudioPage /> },
          ],
        },
      ],
    },

    // Khu MEMBER — front-office
    {
      element: <RequireMember />,
      children: [
        {
          element: <MemberLayout />,
          children: [
            { path: paths.app.home, element: <MemberHomePage /> },
            { path: paths.app.profile, element: <MemberProfilePage /> },
            { path: paths.app.perks, element: <MemberPerksPage /> },
          ],
        },
      ],
    },

    { path: '*', element: <NotFoundPage /> },
  ],
  {
    // Matches vite.config.ts's `base` when built for GitHub Pages.
    basename: import.meta.env.BASE_URL,
  },
);
