import type { ReactNode } from 'react';
import type { ButtonProps } from 'antd';
import type { ListParams } from '@/shared/api';

/**
 * Membership tiers (the LEVEL dimension). Purely a badge + perks concept now —
 * what a tier can DO/SHOW is expressed as conditions in the rule layer.
 */
export type ProfileTier = 'standard' | 'intermediate' | 'advanced' | 'vip';

/** Account status (a second intrinsic dimension). */
export type ProfileStatus = 'active' | 'pending' | 'suspended' | 'closed';

/** Which feature/route is embedding a profile card (supplied by the consumer). */
export type ProfileSurface = 'self' | 'billing' | 'support' | 'directory';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  tier: ProfileTier;
  status?: ProfileStatus; // resolves to 'active' when absent
  joinedAt: string; // ISO date

  // Tier-specific data (surfaced per the field rules)
  loyaltyPoints?: number;
  accountManager?: string;
  hotline?: string;
  creditLimit?: number;
}

/** Editable payload for create/update — server owns id + joinedAt. */
export type ProfileInput = Omit<Profile, 'id' | 'joinedAt'>;

/** List query params: pagination + search (shared) plus profile filters. */
export interface ProfileListParams extends ListParams {
  tier?: ProfileTier;
  status?: ProfileStatus;
}

/**
 * The full input for resolving what a card shows/does.
 *   - `profile` (tier) + `status` are INTRINSIC (domain data)
 *   - `surface` + `can` are EXTRINSIC (passed by the consuming feature/route)
 * Every field/action condition is a predicate over this single object.
 */
export interface ProfileContext {
  profile: Profile;
  status: ProfileStatus;
  surface?: ProfileSurface;
  can?: (permission: string) => boolean;
}

/** A predicate over the context — the unit every condition is built from. */
export type Condition = (ctx: ProfileContext) => boolean;

/** Declarative description of ONE field to display. */
export interface ProfileFieldDef {
  id: string;
  label: string; // i18n key
  render: (profile: Profile) => ReactNode;
  span?: number;
}

/** A field shown only when its condition passes (default: always). */
export interface FieldRule extends ProfileFieldDef {
  when?: Condition;
}

/** Stable identifiers for every built-in action. */
export type ProfileActionKey =
  | 'edit'
  | 'upgrade'
  | 'message'
  | 'viewPerks'
  | 'assignManager'
  | 'callHotline'
  | 'adjustCredit'
  | 'reactivate';

/** Resolved action the renderer consumes. Behaviour is delegated via `onAction`. */
export interface ProfileAction {
  key: ProfileActionKey | string;
  label: string; // i18n key
  icon?: ReactNode;
  type?: ButtonProps['type'];
  danger?: boolean;
  disabled?: boolean;
}

/** An action + the conditions under which it appears / is disabled. */
export interface ActionRule extends Omit<ProfileAction, 'disabled'> {
  /** Visible when this passes (default: always). */
  when?: Condition;
  /** Rendered but greyed out when this passes. */
  disabledWhen?: Condition;
}

/** Tier is now purely presentation (badge + perks); capabilities live in rules. */
export interface TierConfig {
  key: ProfileTier;
  label: string; // i18n key
  color: string;
  icon: ReactNode;
  perks?: string[];
}
