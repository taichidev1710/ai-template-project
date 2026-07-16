import type { ProfileStatus } from '../types';

export interface StatusConfig {
  label: string; // i18n key
  color: string;
  /** When set, the card shows an Alert of this severity with `bannerMsg`. */
  banner?: 'warning' | 'error';
  bannerMsg?: string; // i18n key
}

/** Statuses in a sensible display order (for switchers). */
export const STATUS_ORDER: ProfileStatus[] = ['active', 'pending', 'suspended', 'closed'];

/** Presentation for each status (badge + optional banner). */
export const STATUS_REGISTRY: Record<ProfileStatus, StatusConfig> = {
  active: { label: 'profile.status.active', color: 'green' },
  pending: {
    label: 'profile.status.pending',
    color: 'gold',
    banner: 'warning',
    bannerMsg: 'profile.statusBanner.pending',
  },
  suspended: {
    label: 'profile.status.suspended',
    color: 'red',
    banner: 'error',
    bannerMsg: 'profile.statusBanner.suspended',
  },
  closed: { label: 'profile.status.closed', color: 'default' },
};

export function getStatusConfig(status: ProfileStatus): StatusConfig {
  return STATUS_REGISTRY[status];
}
