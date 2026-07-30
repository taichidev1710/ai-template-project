/**
 * CREDENTIAL PROVIDER registry — the "vendor" a stored key belongs to, SEPARATE
 * from the video provider the user picks (veo31 / nanobanana / mock).
 *
 * Providers from the same vendor SHARE one key: Veo 3.1 + Nano Banana are both
 * Google → the single `google` credential powers both. A brand-new vendor
 * (Runway, Kling, …) gets its OWN credential id. Each vendor declares WHICH
 * fields its credential needs (data-driven), so a future vendor that needs an
 * endpoint / region / access-key+secret pair is a DATA change here — not new UI
 * code in the key manager (which renders a form FROM this).
 *
 * MUST stay mirrored with the BE registry
 * (`src/modules/provider-key/credential-providers.ts` in the backend repo).
 *
 * i18n rule (see domain/video/types.ts header): the domain returns CODES, not
 * prose. So field labels are `labelKey`s the feature layer maps with `t(...)`.
 * The vendor `label` is a proper noun kept as data (like ProviderCapabilities.label).
 */

/** One field of a credential (e.g. `apiKey`, `endpoint`, `region`). */
export interface CredentialField {
  /** Key under which the value is stored (and sent to the backend `fields`). */
  name: string;
  /** i18n key for the field label — feature maps with `t(field.labelKey)`. */
  labelKey: string;
  /** Secret → Input.Password + masked `••••last4`, never shown back. */
  secret: boolean;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  /** i18n key for a placeholder, optional. */
  placeholderKey?: string;
}

/** A credential vendor and the shape of the credential it needs. */
export interface CredentialProviderSpec {
  id: string;
  /** Brand name — a proper noun kept as data (like ProviderCapabilities.label). */
  label: string;
  fields: CredentialField[];
  /** Which field's last4 is shown as the masked hint (defaults to first secret). */
  previewField?: string;
  /** External page where the user obtains the credential. */
  helpUrl?: string;
  /** i18n key for the "get your key" link text. */
  helpLabelKey?: string;
}

/** Every registered credential vendor. Add a vendor by adding a row. */
export const CREDENTIAL_PROVIDERS: readonly CredentialProviderSpec[] = [
  {
    id: 'google',
    label: 'Google (Gemini / Veo / Nano Banana)',
    fields: [
      {
        name: 'apiKey',
        labelKey: 'credential.field.apiKey',
        secret: true,
        required: true,
        minLength: 10,
        maxLength: 500,
        placeholderKey: 'apiKey.placeholder',
      },
    ],
    previewField: 'apiKey',
    helpUrl: 'https://aistudio.google.com/apikey',
    helpLabelKey: 'apiKey.getKey',
  },
];

const BY_ID = new Map<string, CredentialProviderSpec>(CREDENTIAL_PROVIDERS.map((c) => [c.id, c]));

/** Spec for a credential vendor id, or `undefined` if unknown. */
export function getCredentialProvider(id: string | undefined): CredentialProviderSpec | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** The field whose last4 is displayed as the masked hint for a vendor. */
export function previewFieldOf(spec: CredentialProviderSpec): string | undefined {
  return spec.previewField ?? spec.fields.find((f) => f.secret)?.name;
}
