import { tierRank } from './conditions';
import type { ProfileInput, ProfileSurface, ProfileTier } from '../types';

/**
 * Context for FORM field rules. Unlike the display context (which reads the
 * saved profile), this reads the LIVE form values, plus consumer-supplied
 * surface + permission. Every field condition is a predicate over this.
 */
export interface ProfileFormContext {
  values: Partial<ProfileInput>;
  surface?: ProfileSurface;
  can?: (permission: string) => boolean;
}

export type FormCondition = (ctx: ProfileFormContext) => boolean;

export type FieldInputType = 'text' | 'email' | 'number' | 'textarea' | 'tier' | 'status';

/** Responsive column span (AntD 24-col grid, by breakpoint). */
export interface FieldSpan {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
}

/** Declarative schema for one editable field. */
export interface FieldSchema {
  name: keyof ProfileInput;
  label: string; // i18n key
  input: FieldInputType;
  /** Grid width per breakpoint. Omitted → DEFAULT_FIELD_SPAN (1/2/3/4 per row). */
  span?: FieldSpan;
  visibleWhen?: FormCondition; // default: always visible
  requiredWhen?: FormCondition; // default: not required
  disabledWhen?: FormCondition; // default: enabled
}

/** Default responsive width: 1 col (mobile) → 2 → 3 → 4 (wide). */
export const DEFAULT_FIELD_SPAN: FieldSpan = { xs: 24, sm: 12, lg: 8, xl: 6 };

const always: FormCondition = () => true;

/** Condition: the currently-selected tier is >= `min`. */
const tierAtLeast =
  (min: ProfileTier): FormCondition =>
  ({ values }) =>
    tierRank(values.tier ?? 'standard') >= tierRank(min);

/**
 * PROFILE FORM SCHEMA — one place declaring what each field shows / requires /
 * disables, keyed on tier · status · surface · permission. Mirrors the display
 * rule layer (FIELD_RULES / ACTION_RULES) but for editing.
 */
export const PROFILE_FORM_SCHEMA: FieldSchema[] = [
  { name: 'name', label: 'profile.field.name', input: 'text', requiredWhen: always },
  { name: 'email', label: 'profile.field.email', input: 'email', requiredWhen: always },
  { name: 'phone', label: 'profile.field.phone', input: 'text' },

  {
    name: 'tier',
    label: 'profile.field.tier',
    input: 'tier',
    requiredWhen: always,
    // by PERMISSION: only someone allowed to change tier can edit it
    disabledWhen: ({ can }) => !(can?.('profile.editTier') ?? true),
  },
  {
    name: 'status',
    label: 'profile.field.status',
    input: 'status',
    requiredWhen: always,
    // by MENU/route: on the support surface, status is read-only
    disabledWhen: ({ surface }) => surface === 'support',
  },

  {
    name: 'loyaltyPoints',
    label: 'profile.field.loyaltyPoints',
    input: 'number',
    visibleWhen: tierAtLeast('intermediate'), // by TIER
  },
  {
    name: 'accountManager',
    label: 'profile.field.accountManager',
    input: 'text',
    visibleWhen: tierAtLeast('advanced'),
    requiredWhen: tierAtLeast('advanced'), // required from advanced up
  },
  {
    name: 'hotline',
    label: 'profile.field.hotline',
    input: 'text',
    visibleWhen: tierAtLeast('vip'),
  },
  {
    name: 'creditLimit',
    label: 'profile.field.creditLimit',
    input: 'number',
    visibleWhen: tierAtLeast('vip'),
    requiredWhen: tierAtLeast('vip'),
    // by STATUS: credit can't be set unless the account is active
    disabledWhen: ({ values }) => (values.status ?? 'active') !== 'active',
  },

  { name: 'bio', label: 'profile.field.bio', input: 'textarea', span: { xs: 24 } },
];
