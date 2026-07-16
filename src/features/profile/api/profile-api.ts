import type { Paginated } from '@/shared/api';
import type { Profile, ProfileInput, ProfileListParams } from '../types';
import { seedProfiles } from './profile-mock';
// When the backend is ready, swap the store for apiClient calls:
// import { apiClient } from '@/shared/api';

/** In-memory store so the demo supports real CRUD without a backend. */
let store: Profile[] = seedProfiles();

const delay = (ms = 300): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Feature API layer — the ONLY place that knows profile endpoints. Hooks call
 * these; components never touch the API directly. Mock-backed for now.
 */
export const profileApi = {
  list: async (params: ProfileListParams): Promise<Paginated<Profile>> => {
    await delay();
    const { page = 1, pageSize = 10, search = '', tier, status } = params;
    const q = search.trim().toLowerCase();
    const filtered = store.filter(
      (p) =>
        (q === '' || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)) &&
        (tier === undefined || p.tier === tier) &&
        (status === undefined || (p.status ?? 'active') === status),
    );
    const start = (page - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize };
  },

  get: async (id: string): Promise<Profile> => {
    await delay();
    const found = store.find((p) => p.id === id);
    if (!found) throw new Error('Profile not found');
    return found;
  },

  create: async (input: ProfileInput): Promise<Profile> => {
    await delay();
    const created: Profile = { ...input, id: crypto.randomUUID(), joinedAt: new Date().toISOString() };
    store = [created, ...store];
    return created;
  },

  update: async (id: string, input: ProfileInput): Promise<Profile> => {
    await delay();
    const updated: Profile = { ...input, id, joinedAt: store.find((p) => p.id === id)?.joinedAt ?? new Date().toISOString() };
    store = store.map((p) => (p.id === id ? updated : p));
    return updated;
  },

  remove: async (id: string): Promise<void> => {
    await delay();
    store = store.filter((p) => p.id !== id);
  },
};
