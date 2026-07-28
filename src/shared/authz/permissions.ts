/**
 * Nguồn DUY NHẤT cho key quyền phía FE.
 *
 * Phải khớp 3 nơi: catalog của BE (`be-template/src/shared/authz/permissions.ts`),
 * key chức năng trong registry ("Nhóm quyền chức năng"), và chỗ dùng ở FE.
 * Đổi key CHỈ sửa ở đây (+ BE + registry cho khớp) → không phải dò rải rác.
 *
 * Phần bên trái dấu `:` chính là FEATURE KEY (resource) dùng trong registry + guard BE.
 */

/** Key chức năng hệ thống (phần resource của quyền). */
export const FEATURE = {
  USER: 'user',
  ROLE: 'role',
  ACCOUNT: 'account',
  FEATURE: 'feature',
  GROUP: 'group',
  // ----- Thế giới THÀNH VIÊN (namespace riêng, tách khỏi RBAC staff) -----
  MEMBER: 'member',
  TIER: 'tier',
  MEMBER_GROUP: 'member_group',
  MEMBER_FEATURE: 'member_feature',
} as const;

/** Quyền hệ thống dạng `feature:action` — dùng cho can()/menu. Suy từ FEATURE để 1 nguồn. */
export const PERM = {
  user: {
    read: `${FEATURE.USER}:read`,
    create: `${FEATURE.USER}:create`,
    update: `${FEATURE.USER}:update`,
    delete: `${FEATURE.USER}:delete`,
    assignRole: `${FEATURE.USER}:assign_role`,
  },
  role: {
    read: `${FEATURE.ROLE}:read`,
    create: `${FEATURE.ROLE}:create`,
    update: `${FEATURE.ROLE}:update`,
    delete: `${FEATURE.ROLE}:delete`,
  },
  account: {
    read: `${FEATURE.ACCOUNT}:read`,
    approve: `${FEATURE.ACCOUNT}:approve`,
  },
  feature: {
    read: `${FEATURE.FEATURE}:read`,
    create: `${FEATURE.FEATURE}:create`,
    update: `${FEATURE.FEATURE}:update`,
    delete: `${FEATURE.FEATURE}:delete`,
  },
  group: {
    read: `${FEATURE.GROUP}:read`,
    create: `${FEATURE.GROUP}:create`,
    update: `${FEATURE.GROUP}:update`,
    delete: `${FEATURE.GROUP}:delete`,
    assign: `${FEATURE.GROUP}:assign`,
  },
  // ----- Thế giới THÀNH VIÊN -----
  member: {
    read: `${FEATURE.MEMBER}:read`,
    approve: `${FEATURE.MEMBER}:approve`,
    update: `${FEATURE.MEMBER}:update`,
  },
  tier: {
    read: `${FEATURE.TIER}:read`,
    create: `${FEATURE.TIER}:create`,
    update: `${FEATURE.TIER}:update`,
    delete: `${FEATURE.TIER}:delete`,
  },
  memberGroup: {
    read: `${FEATURE.MEMBER_GROUP}:read`,
    create: `${FEATURE.MEMBER_GROUP}:create`,
    update: `${FEATURE.MEMBER_GROUP}:update`,
    delete: `${FEATURE.MEMBER_GROUP}:delete`,
    assign: `${FEATURE.MEMBER_GROUP}:assign`,
  },
  memberFeature: {
    read: `${FEATURE.MEMBER_FEATURE}:read`,
    create: `${FEATURE.MEMBER_FEATURE}:create`,
    update: `${FEATURE.MEMBER_FEATURE}:update`,
    delete: `${FEATURE.MEMBER_FEATURE}:delete`,
  },
} as const;
