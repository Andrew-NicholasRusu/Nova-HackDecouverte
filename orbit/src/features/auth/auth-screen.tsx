import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Mode = 'signIn' | 'signUp';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const signUp = mode === 'signUp';

  async function submit() {
    setError(null);
    setNotice(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return setError('Enter your email and password.');
    if (signUp && password.length < 8) return setError('Use at least 8 characters for your password.');
    if (signUp && !displayName.trim()) return setError('Enter a display name.');

    setBusy(true);
    if (signUp) {
      const { data, error: e } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { display_name: displayName.trim() } },
      });
      if (e) setError(e.message);
      else if (!data.session) {
        setNotice(`Check ${cleanEmail} for a confirmation link, then sign in.`);
        setMode('signIn');
      }
    } else {
      const { error: e } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (e) setError(e.message);
    }
    setBusy(false);
  }

  return (
    <Screen title="ORBIT" subtitle="Your university, in one orbit.">
      <Card style={styles.card}>
        <ThemedText type="subtitle">{signUp ? 'Create your account' : 'Welcome back'}</ThemedText>

        {signUp && (
          <TextField
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
            placeholder="How friends will see you"
          />
        )}
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={signUp ? 'new-password' : 'current-password'}
          onSubmitEditing={submit}
        />

        {error && (
          <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
            {error}
          </ThemedText>
        )}
        {notice && (
          <ThemedText type="small" themeColor="success">
            {notice}
          </ThemedText>
        )}

        <Button
          label={busy ? 'Please wait…' : signUp ? 'Create account' : 'Sign in'}
          onPress={submit}
          disabled={busy}
        />

        <View style={styles.switchRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {signUp ? 'Already have an account?' : 'New to ORBIT?'}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode(signUp ? 'signIn' : 'signUp');
              setError(null);
            }}>
            <ThemedText type="link">{signUp ? 'Sign in' : 'Create an account'}</ThemedText>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.four },
  switchRow: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'center', flexWrap: 'wrap' },
});
