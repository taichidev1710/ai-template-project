import type { ProfileCardProps } from '../components/ProfileCard';
import type { ProfileSurface } from '../types';

/**
 * Convenience presets for the ROUTE/FEATURE dimension. A consuming feature just
 * spreads the matching preset instead of re-specifying props:
 *
 *   <ProfileCard profile={p} {...SURFACE_PRESETS.billing} />
 *
 * The feature never imports the router — it knows its own surface and passes it
 * down, keeping `features/profile` decoupled from navigation.
 */
export const SURFACE_PRESETS: Record<ProfileSurface, Partial<ProfileCardProps>> = {
  self: { surface: 'self' },
  billing: { surface: 'billing', hiddenFields: ['bio'], actions: ['edit', 'adjustCredit'] },
  support: { surface: 'support', actions: ['message', 'callHotline'] },
  directory: { surface: 'directory', variant: 'compact', actions: [] },
};
