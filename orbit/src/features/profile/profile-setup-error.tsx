import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Props = { message: string; missingTable: boolean; onRetry: () => void };

/** Shown when the profile can't be loaded, e.g. before the database migration has been run. */
export function ProfileSetupError({ message, missingTable, onRetry }: Props) {
  return (
    <Screen title="ORBIT" maxWidth={560}>
      {missingTable ? (
        <Card style={styles.card}>
          <ThemedText type="heading" themeColor="warning">
            Database setup needed
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            The profiles table doesn&apos;t exist yet. In the Supabase dashboard, open SQL Editor and
            run supabase/migrations/20261114000000_profiles.sql, then sign up again (accounts created
            before the migration have no profile).
          </ThemedText>
          <Button label="Try again" variant="secondary" onPress={onRetry} />
        </Card>
      ) : (
        <ErrorState message={message} onRetry={onRetry} />
      )}
      <Button label="Sign out" variant="secondary" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.four },
});
