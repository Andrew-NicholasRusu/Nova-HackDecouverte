import { useState } from 'react';
import { Image } from 'expo-image';

import { HERO_FOCUS, HERO_PHOTO, HERO_PHOTO_ALT } from '@/constants/images';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { AuthFormWidth, FixedColors, Size, Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
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
  const { isWide } = useLayout();
  const theme = useTheme();

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
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {isWide && (
        <View style={styles.photo}>
          <Image
            source={HERO_PHOTO}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={HERO_FOCUS}
            accessibilityLabel={HERO_PHOTO_ALT}
          />
          <LinearGradient
            colors={[FixedColors.heroScrimEnd, FixedColors.heroScrimStart]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.photoCopy}>
            <ThemedText type="display" style={{ color: FixedColors.white }}>
              Your university. Connected.
            </ThemedText>
          </View>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.formWrap}>
        <View style={styles.form}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Icon name="trip-origin" size="xl" color={FixedColors.white} />
            </View>
            <ThemedText type="displaySmall" accessibilityRole="header">
              ORBIT
            </ThemedText>
          </View>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  photo: { flex: 1, justifyContent: 'flex-end', padding: Spacing.six, backgroundColor: FixedColors.shell },
  photoCopy: { maxWidth: Size.copyMax },
  formWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three },
  form: { width: '100%', maxWidth: AuthFormWidth, gap: Spacing.four },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  logo: {
    width: Spacing.six - Spacing.three,
    height: Spacing.six - Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: FixedColors.shellActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { gap: Spacing.three },
  switchRow: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'center', flexWrap: 'wrap' },
});
