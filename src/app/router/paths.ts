/** Central route path constants. Never hardcode a path string in components. */
export const paths = {
  root: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  users: '/users',
  accounts: '/accounts',
  roles: '/roles',
  permissionGroups: '/permission-groups',
  features: '/features',
  // Thế giới thành viên (back-office)
  members: '/members',
  tiers: '/tiers',
  memberGroups: '/member-groups',
  memberFeatures: '/member-features',
  profile: '/profile',
  diagrams: '/diagrams',
  diagramTypes: '/diagram-types',
} as const;
