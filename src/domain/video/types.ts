/**
 * Video Studio domain model — framework-agnostic (no React, no AntD, no network).
 *
 * This is the single source of truth for the "Video Studio" feature (batch video
 * generation over Veo 3.1 / Nano Banana / …). Everything here is pure data and
 * pure functions so the hard logic — scene splitting, run planning, cost
 * estimation, provider capabilities — is unit-testable without a server, a
 * provider key, or a rendered component. See `docs/specs/video-studio.md` §5–§11.
 *
 * ONE deliberate difference from the `domain/diagram` neighbour: this feature
 * uses STANDARD i18n (spec §13.5/§18), not hardcoded Vietnamese. So the domain
 * never returns user-facing prose. It returns CODES + structured data
 * (`RunPlanWarning`, `CharacterIssue`, `JobErrorCode`, …); the feature layer maps
 * each code to a `t('...')` key. Keep it that way — no Vietnamese strings here.
 */

/* ============================================================
   Enumerations & small value types
   ============================================================ */

/** What a provider produces. Veo → video; Nano Banana → image (character frames). */
export type MediaKind = 'video' | 'image';

/**
 * Aspect ratios the UI can offer. A provider only supports a SUBSET (declared in
 * its capabilities); the UI must never show a ratio the chosen provider rejects
 * (spec §11). `4:5` is a platform preset that Veo cannot render natively — it is
 * reached by cropping a `9:16`/`1:1` clip, never requested from the provider.
 */
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

/**
 * The three UI speed labels. NOT a magic switch — each maps to a concrete
 * provider model tier + params (spec §7). A provider declares which tiers it
 * offers; tiers it lacks are hidden.
 */
export type SpeedTier = 'fast' | 'normal' | 'quality';

/** How a batch runs (spec §10.1). */
export type RunMode =
  /** Push every job, spacing SUBMITS by `delaySeconds`, bounded by concurrency. */
  | 'all'
  /** Finish one job (to success/error) before starting the next. Safest, slowest. */
  | 'sequential'
  /** One card's button fires exactly that scene's jobs. Not a batch. */
  | 'single';

/** Allowed delay-between-submits, in seconds (spec §10.2). Only used in `all`. */
export type DelaySeconds = 0 | 15 | 30 | 60 | 120 | 300 | 600;

/** The delay options the UI offers, in order. */
export const DELAY_OPTIONS: readonly DelaySeconds[] = [0, 15, 30, 60, 120, 300, 600];

/** Where generation credentials come from (spec §4, §13.1). */
export type AccountSource =
  /** Official billed provider API — stable, in-ToS, no account-ban risk. */
  | 'api'
  /**
   * Free "session" mode = automating a consumer login. User-owned RISK: may get
   * the Google account banned. We implement only the delay the user configured,
   * never any detection-evasion (spec §4, §4.1). The UI must surface the ⚠.
   */
  | 'session';

/** All speed tiers, in ascending cost/quality order — for iterating UI controls. */
export const SPEED_TIERS: readonly SpeedTier[] = ['fast', 'normal', 'quality'];

/** An amount of money. `amount` is in the currency's major unit (USD dollars). */
export interface Money {
  currency: string;
  /** Major-unit amount (e.g. 1.2 = $1.20). Estimates — round for display in UI. */
  amount: number;
}

/* ============================================================
   Provider capabilities — the table the UI adapts to (spec §2.4, §5, §11)
   ============================================================ */

/** Stable id for a provider. String (not a closed union) so adding a provider is
 * a data change, not a type change — "new provider = new adapter" (spec §5). */
export type ProviderId = string;

/**
 * One speed tier of one provider: which real model it maps to and what it costs.
 * Video tiers price per SECOND of output; image tiers price per IMAGE.
 */
export interface SpeedTierSpec {
  tier: SpeedTier;
  /** The provider's real model id this tier submits to (spec §7). */
  modelId: string;
  /** USD per second of generated video. Present for video tiers. */
  pricePerSecond?: number;
  /** USD per generated image. Present for image providers (e.g. Nano Banana). */
  pricePerImage?: number;
  /** Max resolution this tier yields (e.g. "1080p"), informational. */
  maxResolution?: string;
  /** Whether this tier includes generated audio (Veo standard/quality do). */
  audio?: boolean;
}

/**
 * The full capability declaration of a provider. The UI reads THIS to build its
 * form (which aspects, which durations, which tiers, whether image-to-video is
 * possible) and never hardcodes Veo specifics (spec §5, §11). Prices/limits are a
 * 07/2026 snapshot to re-verify before real integration (spec header).
 */
export interface ProviderCapabilities {
  id: ProviderId;
  /** Brand name — a proper noun ("Veo 3.1"), kept as data, not translated. */
  label: string;
  kind: MediaKind;
  /** Aspect ratios the provider renders natively (never includes crop-only 4:5). */
  aspects: readonly AspectRatio[];
  /** Clip durations in seconds the provider accepts (video providers). */
  durations: readonly number[];
  supportsImageToVideo: boolean;
  supportsFirstLastFrame: boolean;
  /** Max reference images attachable per request (Veo ~3; Nano Banana ~20). */
  maxReferenceImages: number;
  /** Speed tiers this provider offers; a tier absent here is hidden in the UI. */
  speedTiers: readonly SpeedTierSpec[];
  /** Requests per minute (drives the safe-delay suggestion, spec §10.2). */
  rpm: number;
  /** Max jobs the provider will run at once for one project (spec §2.1). */
  maxConcurrent: number;
  /**
   * Which credential VENDOR this provider draws its key from (see
   * `credentialProviders.ts`). Veo & Nano Banana are Google → `'google'`, so they
   * SHARE one key. `undefined` = no key needed (the keyless `mock` provider). A new
   * vendor's providers point at a new credential id and get their own key.
   */
  credentialProviderId?: string;
}

/* ============================================================
   Platform presets — convenience layer over provider aspects (spec §11)
   ============================================================ */

/** A social-platform target the user can pick instead of a raw aspect ratio. */
export type PlatformPreset =
  | 'youtube'
  | 'facebook'
  | 'tiktok'
  | 'reels'
  | 'shorts'
  | 'instagram-feed'
  | 'instagram-portrait';

/* ============================================================
   Data model (spec §6) — Project / Scene / Job / Character / RunConfig
   ============================================================ */

/**
 * How aggressively character sync is applied for a scene/job (spec §9.3). The
 * achievable level depends on provider capabilities:
 *   1 = reference images attached directly (best; needs `maxReferenceImages > 0`).
 *   2 = pre-generate a first frame (Nano Banana) then image-to-video.
 *   3 = text-only fixed description (fallback; always works, weakest sync).
 */
export type CharacterSyncLevel = 1 | 2 | 3;

/**
 * What an asset represents (spec §2.3: Veo "ingredients" take reference images in
 * several ROLES). `character` = a person/subject, usually attached by an inline
 * `@key`; `setting` = a location/background, usually ASSIGNED to a group of scenes;
 * `style` = a look/tone (image OR a text `description`); `prompt` = a reusable
 * block of extra prompt text applied to a group of scenes (no image, no @key).
 * Image-bearing kinds feed the same `reference_images` list; text `description`
 * of any kind is appended to the outgoing prompt (`composeScenePrompt`).
 */
export type AssetKind = 'character' | 'setting' | 'style' | 'prompt';

/**
 * An asset used to keep something consistent across clips (spec §9, §2.3) — a
 * character, a setting/location, a style, or a reusable prompt block. Attached to
 * a scene either by an inline `@key` (see characterTagger) or by scene assignment
 * (`Scene.assetIds`). Its CONTENT can be reference `images` (feed the provider's
 * reference list) and/or a text `description` (a level-3 text sync hint / shared
 * prompt appended to the scene text — spec §9.3, level 3).
 */
export interface Asset {
  id: string;
  kind: AssetKind;
  /** Match key referenced in prompts as `@key` (spec §9.1). Empty for `prompt` kind. */
  key: string;
  displayName: string;
  /** 0..N reference images (as data-URLs in the app; opaque here). */
  images: string[];
  /**
   * Optional text content: a `style` described in words when there's no image, a
   * `prompt`-kind's reusable text, or a character/setting text description
   * (level-3 fallback). Appended to the scene prompt by `composeScenePrompt`.
   */
  description?: string;
  /** Highlight colour for this asset's mentions — pure data (spec §13.5). */
  color: string;
}

/** @deprecated Kept so existing imports compile; use {@link Asset}. */
export type Character = Asset;

/** The job state machine (spec §14). */
export type JobStatus = 'queued' | 'processing' | 'success' | 'error' | 'canceled';

/** Coarse error classes, each with a distinct UI action (spec §10.3, §14). */
export type JobErrorCode =
  | 'network'
  | 'rate-limit'
  | 'provider-5xx'
  | 'content-policy'
  | 'billing'
  | 'download'
  | 'unknown';

export interface JobError {
  code: JobErrorCode;
  /** Whether the queue should auto-retry (network/429/5xx) vs. wait for the user. */
  retriable: boolean;
  /** Optional raw provider detail (e.g. "API key not valid") — shown alongside the
   * translated category. Runtime-only; not required to persist. */
  message?: string;
}

/** One concrete "make a single video" unit — a scene with count N yields N jobs. */
export interface Job {
  id: string;
  sceneId: string;
  /** 0..count-1 — which variant of the scene this job produces. */
  index: number;
  status: JobStatus;
  /** The provider's own job id, once submitted (async operation, spec §2.1). */
  providerRef?: string;
  /** 0..100, when the provider reports it. */
  progress?: number;
  error?: JobError;
  attempts: number;
  /** RELATIVE saved path shown to the user (browser hides absolute path, §12). */
  outputPath?: string;
  costActual?: Money;
  startedAt?: string;
  finishedAt?: string;
}

/** A single scene = one item in the list (spec §6, §8). */
export interface Scene {
  id: string;
  order: number;
  /** This scene's own prompt text. */
  text: string;
  /** Per-card aspect override (spec §11); falls back to `RunConfig.aspect`. */
  aspectOverride?: AspectRatio;
  /** Per-card count override (1..4); falls back to `RunConfig.count`. */
  countOverride?: number;
  /** Character keys detected in `text` (derived by characterTagger). */
  characterKeys: string[];
  /**
   * Assets ASSIGNED to this scene by id (typically settings/styles applied to a
   * group of scenes, spec §2.3). Combined with the `@key` mentions in `text` to
   * form the scene's full reference list — see `sceneAssets`.
   */
  assetIds?: string[];
  jobs: Job[];
}

/** Batch-wide configuration (spec §6). */
export interface RunConfig {
  providerId: ProviderId;
  modelId: string;
  source: AccountSource;
  speed: SpeedTier;
  /** Default videos per scene, 1..4. A scene may override via `countOverride`. */
  count: number;
  /** Default aspect; a scene may override via `aspectOverride`. */
  aspect: AspectRatio;
  /** Clip length in seconds (video providers): 4|6|8 for Veo. Drives cost. */
  durationSeconds: number;
  runMode: RunMode;
  /** Delay between submits — only meaningful when `runMode === 'all'` (spec §10.2). */
  delaySeconds: DelaySeconds;
  /** Max concurrent jobs; clamped to the provider's `maxConcurrent`. */
  concurrency: number;
  /** Generate audio (Veo supports it) — off keeps clips cheaper/quieter. */
  audio?: boolean;
  /** Fixed seed for reproducibility (spec §15). */
  seed?: number;
  /** Spend guard: warn/block if the estimated batch cost exceeds this (USD). */
  maxCostPerRun?: number;
  /** Spend guard: warn/block if the batch would create more than this many jobs. */
  maxJobsPerRun?: number;
}

/** A saveable/reopenable batch of work (spec §6, §12.1 — persisted to MongoDB). */
export interface Project {
  id: string;
  name: string;
  /** The output folder label the user picked (relative; browser hides abs, §12). */
  outputDirLabel?: string;
  /** The original prompt pasted in, before scene splitting. */
  sourcePrompt: string;
  runConfig: RunConfig;
  scenes: Scene[];
  /** The reference-asset roster (characters + settings + styles). Field name kept
   * as `characters` for storage compatibility; items are {@link Asset} of any kind. */
  characters: Asset[];
  createdAt: string;
  updatedAt: string;
}
