import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';

import type { Campus, ProfileEdit, validateProfile } from './use-profile';

type Props = {
  value: ProfileEdit;
  onChange: (next: ProfileEdit) => void;
  errors: ReturnType<typeof validateProfile>;
  showBio?: boolean;
};

const CAMPUSES: { id: Campus; label: string }[] = [
  { id: 'SGW', label: 'Sir George Williams' },
  { id: 'LOY', label: 'Loyola' },
];

function FieldError({ message }: { message?: string }) {
  return message ? (
    <ThemedText type="caption" themeColor="danger">
      {message}
    </ThemedText>
  ) : null;
}

/** Shared by onboarding and the profile editor. */
export function ProfileFields({ value, onChange, errors, showBio = false }: Props) {
  const set = <K extends keyof ProfileEdit>(k: K, v: ProfileEdit[K]) => onChange({ ...value, [k]: v });

  return (
    <View style={styles.fields}>
      <View style={styles.field}>
        <TextField
          label="Display name"
          value={value.display_name}
          onChangeText={(v) => set('display_name', v)}
          autoComplete="name"
          placeholder="How friends will see you"
        />
        <FieldError message={errors.display_name} />
      </View>
      <View style={styles.field}>
        <TextField
          label="Username"
          value={value.username ?? ''}
          onChangeText={(v) => set('username', v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="e.g. alex_m"
        />
        <ThemedText type="caption" themeColor="textSecondary">
          Friends find you by username. Your email is never shown.
        </ThemedText>
        <FieldError message={errors.username} />
      </View>
      <View style={styles.field}>
        <ThemedText type="caption" themeColor="textSecondary">
          Main campus
        </ThemedText>
        <View style={styles.chips}>
          {CAMPUSES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              selected={value.preferred_campus === c.id}
              onPress={() => set('preferred_campus', c.id)}
            />
          ))}
        </View>
      </View>
      {showBio ? (
        <View style={styles.field}>
          <TextField
            label="Bio (optional)"
            value={value.bio ?? ''}
            onChangeText={(v) => set('bio', v)}
            multiline
            style={styles.bio}
            placeholder="Program, year, what you're into"
          />
          <FieldError message={errors.bio} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: Spacing.three },
  field: { gap: Spacing.one },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  bio: { minHeight: 88, paddingTop: Spacing.two, textAlignVertical: 'top' },
});
