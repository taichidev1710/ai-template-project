import type { Profile, ProfileContext, ProfileSurface, ProfileTier } from '../types';

/** Tiers in ascending order — the ranking source for "at least" conditions. */
export const TIER_ORDER: ProfileTier[] = ['standard', 'intermediate', 'advanced', 'vip'];

export const tierRank = (tier: ProfileTier): number => TIER_ORDER.indexOf(tier);

/** Condition helper: the profile's tier is >= `min`. */
export const atLeast =
  (min: ProfileTier) =>
  (ctx: ProfileContext): boolean =>
    tierRank(ctx.profile.tier) >= tierRank(min);

/**
 * Build the resolution context from a profile plus consumer-supplied extras.
 * `status` falls back to 'active'; `surface`/`can` come from the caller.
 */
export function buildProfileContext(
  profile: Profile,
  opts?: { surface?: ProfileSurface; can?: (permission: string) => boolean },
): ProfileContext {
  return {
    profile,
    status: profile.status ?? 'active',
    surface: opts?.surface,
    can: opts?.can,
  };
}
