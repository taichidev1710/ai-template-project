import type { ListParams } from '@/shared/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
}

/** Payload for create/update. `id`, `createdAt` are server-managed. */
export type UserInput = Omit<User, 'id' | 'createdAt'>;

/** List query params: pagination + search (shared) plus the users filter bar. */
export interface UsersListParams extends ListParams {
  role?: User['role'];
}

/** How the list renders — persisted per-feature so the choice sticks across visits. */
export type UsersViewMode = 'table' | 'grid';
