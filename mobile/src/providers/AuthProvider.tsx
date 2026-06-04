import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { getSupabase, isSupabaseConfigured, clearLocalAuthSession } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    username?: string
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const client = getSupabase();
    client.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setIsLoading(false);
      })
      .catch(async (err) => {
        console.warn('[Auth] getSession failed:', err?.message ?? err);
        await clearLocalAuthSession();
        setIsLoading(false);
      });

    const { data: sub } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      return { error: error?.message };
    } catch (e) {
      return { error: String(e) };
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, username?: string) => {
    try {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) return { error: error.message };
      if (!data.session) return { needsEmailConfirmation: true };
      return {};
    } catch (e) {
      return { error: String(e) };
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    try {
      const redirectTo = makeRedirectUri({ scheme: 'atlasrun' });
      const { data, error } = await getSupabase().auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) return { error: error.message };
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          const url = Linking.parse(result.url);
          const access_token = url.queryParams?.access_token as string | undefined;
          const refresh_token = url.queryParams?.refresh_token as string | undefined;
          if (access_token && refresh_token) {
            await getSupabase().auth.setSession({ access_token, refresh_token });
          }
        }
      }
      return {};
    } catch (e) {
      return { error: String(e) };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await getSupabase().auth.signOut();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
