// Public API of the profile feature — import from here, never from internals.

// Page (route target)
export { ProfilePage } from './pages/ProfilePage';

// Reusable building blocks for OTHER features to compose
export { ProfileCard } from './components/ProfileCard';
export type { ProfileCardProps } from './components/ProfileCard';
export { ProfileTierBadge } from './components/ProfileTierBadge';
export { ProfileStatusBadge } from './components/ProfileStatusBadge';
export { ProfileInfoList } from './components/ProfileInfoList';
export { ProfileActions } from './components/ProfileActions';
export { ProfilesTable } from './components/ProfilesTable';
export { ProfileForm, PROFILE_FORM_DEFAULTS } from './components/ProfileForm';
export type { ProfileFormProps } from './components/ProfileForm';
export { ProfileFormSubmit } from './components/ProfileFormSubmit';
export { ProfileFormModal } from './components/ProfileFormModal';

// Data hooks
export { useProfiles, useProfile, useProfileMutations } from './hooks/use-profile';

// Config — presentation registries
export { TIER_REGISTRY, TIER_ORDER, BASE_FIELDS, FIELD_RULES, resolveFields, getTierConfig } from './config/tiers';
export { STATUS_REGISTRY, STATUS_ORDER, getStatusConfig } from './config/status';
export type { StatusConfig } from './config/status';
export { SURFACE_PRESETS } from './config/surfaces';

// Config — capability rules + resolver
export { ACTION_RULES, resolveActions, resolveActionKeys } from './config/actions';
export { atLeast, tierRank, buildProfileContext } from './config/conditions';
export { PROFILE_FORM_SCHEMA, DEFAULT_FIELD_SPAN } from './config/form-schema';
export type { FieldSchema, FieldInputType, FieldSpan, FormCondition, ProfileFormContext } from './config/form-schema';

// Types
export type {
  Profile,
  ProfileInput,
  ProfileListParams,
  ProfileTier,
  ProfileStatus,
  ProfileSurface,
  ProfileContext,
  Condition,
  TierConfig,
  ProfileFieldDef,
  FieldRule,
  ProfileAction,
  ActionRule,
  ProfileActionKey,
} from './types';
