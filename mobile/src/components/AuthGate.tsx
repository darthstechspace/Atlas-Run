import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { GlowButton } from '../components/UI';
import { theme } from '../theme';
import { isSupabaseConfigured, pingSupabaseAuth } from '../lib/supabase';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading, isConfigured } = useAuth();

  if (!isConfigured) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accentGold} />
      </View>
    );
  }

  if (!session) {
    return <SignInScreen />;
  }

  return <>{children}</>;
}

function SignInScreen() {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [signupMessage, setSignupMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [networkOk, setNetworkOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    pingSupabaseAuth().then(({ ok, error: pingError }) => {
      setNetworkOk(ok);
      if (!ok && pingError) {
        console.warn('[Auth] Supabase unreachable from device:', pingError);
      }
    });
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    setSignupMessage(null);
    const result =
      mode === 'signin'
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password, username.trim() || undefined);
    if (result.error) {
      setError(result.error);
    } else if ('needsEmailConfirmation' in result && result.needsEmailConfirmation) {
      setSignupMessage('please confirm your email address and then login!');
      setMode('signin');
      setPassword('');
    }
    setBusy(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Atlas Run</Text>
      <Text style={styles.sub}>Sign in to sync progress across devices</Text>

      {networkOk === false ? (
        <Text style={styles.error}>
          Cannot reach Supabase from this device. Check Wi‑Fi/mobile data, disable VPN, then restart Expo with{' '}
          <Text style={styles.mono}>npx expo start -c</Text>.
        </Text>
      ) : null}

      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={theme.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <GlowButton label={busy ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'} onPress={submit} />

      {signupMessage ? <Text style={styles.success}>{signupMessage}</Text> : null}

      <Pressable
        onPress={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setSignupMessage(null);
          setError(null);
        }}
      >
        <Text style={styles.switch}>
          {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </Text>
      </Pressable>

      <View style={styles.oauthRow}>
        <Pressable style={styles.oauthBtn} onPress={() => signInWithOAuth('google')}>
          <Text style={styles.oauthText}>Google</Text>
        </Pressable>
        <Pressable style={styles.oauthBtn} onPress={() => signInWithOAuth('apple')}>
          <Text style={styles.oauthText}>Apple</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundDark },
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: theme.backgroundDark, gap: 12 },
  title: { color: theme.accentGold, fontSize: 32, fontWeight: '900', textAlign: 'center' },
  sub: { color: theme.textSecondary, textAlign: 'center', marginBottom: 12 },
  input: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 12,
    padding: 14,
    color: '#fff',
  },
  error: { color: '#ff6666', textAlign: 'center' },
  success: { color: theme.accentGold, textAlign: 'center', fontWeight: '600' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#ffaaaa' },
  switch: { color: theme.accentBlue, textAlign: 'center', marginTop: 8 },
  oauthRow: { flexDirection: 'row', gap: 12, marginTop: 16, justifyContent: 'center' },
  oauthBtn: {
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  oauthText: { color: '#fff', fontWeight: '700' },
});
