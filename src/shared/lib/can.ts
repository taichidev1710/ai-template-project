import { useCallback } from 'react';
import { useAuthStore } from '@/shared/stores/auth-store';

/**
 * Permission check mirroring the backend `policy.can` — matches 3 levels, widening:
 *   `*`  ->  `feature:*`  ->  `feature:action`
 *
 * This is UX-only gating. The backend ALWAYS re-enforces on every route; hiding a
 * button here never replaces the server-side guard.
 */
const WILDCARD = '*';

export function hasPermission(permissions: readonly string[], required: string): boolean {
  if (!required) return true;
  if (permissions.includes(WILDCARD)) return true;
  if (permissions.includes(required)) return true;
  const resource = required.split(':')[0];
  return Boolean(resource) && permissions.includes(`${resource}:*`);
}

export function hasAnyPermission(permissions: readonly string[], required: string[]): boolean {
  return required.some((r) => hasPermission(permissions, r));
}

/** Hook returning a `can(permission)` predicate bound to the current user's permissions. */
export function useCan(): (required: string) => boolean {
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);
  return useCallback((required: string) => hasPermission(permissions, required), [permissions]);
}

/** Hook: is a business feature enabled in the registry (independent of permissions)? */
export function useFeatureEnabled(): (featureKey: string) => boolean {
  const features = useAuthStore((s) => s.enabledFeatures);
  return useCallback(
    (featureKey: string) => features.some((f) => f.key === featureKey),
    [features],
  );
}
