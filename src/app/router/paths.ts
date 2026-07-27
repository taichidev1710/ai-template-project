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
  profile: '/profile',
  diagrams: '/diagrams',
  diagramTypes: '/diagram-types',
} as const;
