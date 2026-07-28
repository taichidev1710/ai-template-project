/** Central route path constants. Never hardcode a path string in components. */
export const paths = {
  // Công khai
  root: '/',
  login: '/login',
  register: '/register',

  // Khu STAFF (back-office) — dưới /admin/*, gate bằng RequireStaff
  dashboard: '/admin/dashboard',
  users: '/admin/users',
  accounts: '/admin/accounts',
  roles: '/admin/roles',
  permissionGroups: '/admin/permission-groups',
  features: '/admin/features',
  // Quản trị thế giới thành viên (vẫn là back-office của staff)
  members: '/admin/members',
  tiers: '/admin/tiers',
  memberGroups: '/admin/member-groups',
  memberFeatures: '/admin/member-features',
  profile: '/admin/profile',
  diagrams: '/admin/diagrams',
  diagramTypes: '/admin/diagram-types',
  videoStudio: '/admin/video-studio',

  // Khu MEMBER (front-office) — dưới /app/*, gate bằng RequireMember
  app: {
    home: '/app',
    profile: '/app/profile',
    perks: '/app/perks',
  },
} as const;
