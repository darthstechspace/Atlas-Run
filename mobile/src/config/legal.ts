import Constants from 'expo-constants';

type Extra = { privacyPolicyUrl?: string };

function trim(value: string | undefined): string {
  return (value ?? '').trim();
}

/** Public HTTPS privacy policy URL (store listing + in-app link). */
export function readPrivacyPolicyUrl(): string {
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  return trim(extra?.privacyPolicyUrl ?? process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL);
}

export function isPrivacyPolicyConfigured(): boolean {
  const url = readPrivacyPolicyUrl();
  return url.startsWith('https://');
}
