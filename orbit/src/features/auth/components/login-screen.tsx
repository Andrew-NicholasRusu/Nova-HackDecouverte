import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthFrame } from '@/components/layout/auth-frame';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/ui/themed-text';
import { signIn, signUp } from '@/features/auth/auth';

import { styles } from './login-screen.styles';

type Mode = 'signIn' | 'signUp';

/** Sign in or create an account (route: /login). */
export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignUp = mode === 'signUp';

  async function submit() {
    setError(null);
    setNotice(null);
    setBusy(true);
    if (isSignUp) {
      const result = await signUp(email, password, displayName);
      if (result.error) setError(result.error);
      else if (result.needsConfirmation) {
        setNotice(`Check ${email.trim().toLowerCase()} for a confirmation link, then sign in.`);
        setMode('signIn');
      }
    } else {
      setError(await signIn(email, password));
    }
    setBusy(false);
  }

  return (
    <AuthFrame>
      <Card style={styles.card}>
        <ThemedText type="subtitle">{isSignUp ? 'Create your account' : 'Welcome back'}</ThemedText>

        {isSignUp && (
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
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
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
          label={busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          onPress={submit}
          disabled={busy}
        />

        <View style={styles.switchRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {isSignUp ? 'Already have an account?' : 'New to ORBIT?'}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode(isSignUp ? 'signIn' : 'signUp');
              setError(null);
            }}>
            <ThemedText type="link">{isSignUp ? 'Sign in' : 'Create an account'}</ThemedText>
          </Pressable>
        </View>
      </Card>
    </AuthFrame>
  );
}
