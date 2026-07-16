export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
}

/** Payload for create/update. `id`, `createdAt` are server-managed. */
export type UserInput = Omit<User, 'id' | 'createdAt'>;
