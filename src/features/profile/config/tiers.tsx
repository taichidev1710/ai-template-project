import { CrownOutlined, StarOutlined, RocketOutlined, UserOutlined } from '@ant-design/icons';
import { formatDate } from '@/shared/lib/utils';
import { atLeast } from './conditions';
import type { FieldRule, Profile, ProfileContext, ProfileFieldDef, ProfileTier, TierConfig } from '../types';

// Re-export so existing imports (`from './config/tiers'`) keep working.
export { TIER_ORDER } from './conditions';

const dash = '—';
const currency = (v?: number) =>
  v == null
    ? dash
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
const points = (v?: number) => (v == null ? dash : `${v.toLocaleString('vi-VN')} pts`);

/** Fields shown for EVERY tier/status. */
export const BASE_FIELDS: ProfileFieldDef[] = [
  { id: 'email', label: 'profile.field.email', render: (p: Profile) => p.email },
  { id: 'phone', label: 'profile.field.phone', render: (p: Profile) => p.phone ?? dash },
  { id: 'joinedAt', label: 'profile.field.joinedAt', render: (p: Profile) => formatDate(p.joinedAt) },
  { id: 'bio', label: 'profile.field.bio', render: (p: Profile) => p.bio ?? dash },
];

/**
 * Conditional fields. Each declares WHEN it shows via a predicate over the
 * context — so "which fields per level" is data, and adding a status/permission
 * gate later is a one-line `when` change, not a new branch.
 */
export const FIELD_RULES: FieldRule[] = [
  { id: 'loyaltyPoints', label: 'profile.field.loyaltyPoints', render: (p) => points(p.loyaltyPoints), when: atLeast('intermediate') },
  { id: 'accountManager', label: 'profile.field.accountManager', render: (p) => p.accountManager ?? dash, when: atLeast('advanced') },
  { id: 'hotline', label: 'profile.field.hotline', render: (p) => p.hotline ?? dash, when: atLeast('vip') },
  { id: 'creditLimit', label: 'profile.field.creditLimit', render: (p) => currency(p.creditLimit), when: atLeast('vip') },
];

/** Base fields + every conditional field whose `when` passes. */
export function resolveFields(ctx: ProfileContext): ProfileFieldDef[] {
  return [...BASE_FIELDS, ...FIELD_RULES.filter((r) => r.when?.(ctx) ?? true)];
}

/**
 * TIER REGISTRY — presentation for the LEVEL dimension (badge + perks).
 * Capabilities (fields/actions) are no longer here; they live in the rule
 * layer so they can depend on status / surface / permission too.
 */
export const TIER_REGISTRY: Record<ProfileTier, TierConfig> = {
  standard: { key: 'standard', label: 'profile.tier.standard', color: 'default', icon: <UserOutlined /> },
  intermediate: { key: 'intermediate', label: 'profile.tier.intermediate', color: 'blue', icon: <StarOutlined /> },
  advanced: {
    key: 'advanced',
    label: 'profile.tier.advanced',
    color: 'purple',
    icon: <RocketOutlined />,
    perks: ['profile.perk.prioritySupport', 'profile.perk.earlyAccess'],
  },
  vip: {
    key: 'vip',
    label: 'profile.tier.vip',
    color: 'gold',
    icon: <CrownOutlined />,
    perks: [
      'profile.perk.dedicatedManager',
      'profile.perk.hotline',
      'profile.perk.creditLine',
      'profile.perk.exclusiveEvents',
    ],
  },
};

export function getTierConfig(tier: ProfileTier): TierConfig {
  return TIER_REGISTRY[tier];
}
