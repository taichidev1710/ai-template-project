import { useAuthStore, type EnabledFeature, type FeatureAction } from '@/shared/stores/auth-store';

export interface UnlockedFeature extends EnabledFeature {
  /** Các action mà member được phép trong chức năng này. */
  allowedActions: FeatureAction[];
}

/** Kiểm tra member có grant cho một `feature:action` không (hỗ trợ `feature:*` và `*`). */
function hasGrant(perms: string[], feature: string, action: string): boolean {
  return (
    perms.includes('*') ||
    perms.includes(`${feature}:*`) ||
    perms.includes(`${feature}:${action}`)
  );
}

/**
 * Chức năng member "mở khoá" cho user hiện tại = giao(chức năng member đang bật ∩
 * quyền member hiệu lực). Đây là nguồn dựng thẻ/menu ở khu member (theo tier + gán lẻ).
 */
export function useUnlockedMemberFeatures(): UnlockedFeature[] {
  const features = useAuthStore((s) => s.enabledMemberFeatures);
  const perms = useAuthStore((s) => s.user?.memberPermissions ?? []);

  return [...features]
    .sort((a, b) => a.order - b.order)
    .map((f) => ({
      ...f,
      allowedActions: f.actions.filter((a) => hasGrant(perms, f.key, a.key)),
    }))
    .filter((f) => f.allowedActions.length > 0);
}
