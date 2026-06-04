import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';
import { isValidSupabaseUrl, readSupabaseEnv } from '../config/env';
import { supabaseAuthStorage } from './supabaseAuthStorage';

const { url: supabaseUrl, anonKey: supabaseAnonKey } = readSupabaseEnv();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && isValidSupabaseUrl(supabaseUrl)
);

if (__DEV__) {
  if (supabaseUrl && !isValidSupabaseUrl(supabaseUrl)) {
    console.warn('[Supabase] Invalid URL: expected https://<ref>.supabase.co');
  } else if (isSupabaseConfigured) {
    console.log('[Supabase] online:', supabaseUrl.replace(/^https:\/\//, ''));
  } else {
    console.warn(
      '[Supabase] offline: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env, then run: npx expo start -c'
    );
  }
}

const appFetch: typeof fetch = Platform.OS === 'web' ? fetch : (expoFetch as typeof fetch);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: supabaseAuthStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        fetch: appFetch,
      },
    })
  : null;

export function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

export async function clearLocalAuthSession(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // ignore
  }
}

export async function pingSupabaseAuth(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Not configured' };
  try {
    const res = await appFetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function getSupabaseConfigDebug(): string {
  const { url, anonKey } = readSupabaseEnv();
  if (!url && !anonKey) return 'No env vars loaded';
  if (!isValidSupabaseUrl(url)) return `Bad URL: ${url || '(empty)'}`;
  if (!anonKey) return 'Missing anon/publishable key';
  return `Connected to ${url.replace(/^https:\/\//, '')}`;
}
