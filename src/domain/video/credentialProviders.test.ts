import { describe, it, expect } from 'vitest';
import { getCredentialProvider, previewFieldOf } from './credentialProviders';
import {
  getCapabilities,
  PROVIDER_VEO31,
  PROVIDER_NANOBANANA,
  PROVIDER_MOCK,
} from './providerCapabilities';

describe('credential providers registry', () => {
  it('knows Google and its single apiKey field', () => {
    const google = getCredentialProvider('google');
    expect(google?.id).toBe('google');
    expect(google?.fields.map((f) => f.name)).toEqual(['apiKey']);
    expect(google?.fields[0]?.secret).toBe(true);
    expect(previewFieldOf(google!)).toBe('apiKey');
  });

  it('returns undefined for unknown or missing vendor', () => {
    expect(getCredentialProvider('runway')).toBeUndefined();
    expect(getCredentialProvider(undefined)).toBeUndefined();
  });

  it('Veo and Nano Banana share the Google vendor; mock is keyless', () => {
    expect(getCapabilities(PROVIDER_VEO31)?.credentialProviderId).toBe('google');
    expect(getCapabilities(PROVIDER_NANOBANANA)?.credentialProviderId).toBe('google');
    expect(getCapabilities(PROVIDER_MOCK)?.credentialProviderId).toBeUndefined();
  });
});
