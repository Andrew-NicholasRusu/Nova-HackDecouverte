import { StyleSheet } from 'react-native';

import { AuthFormWidth, FixedColors, Size, Spacing, TouchTarget } from '@/styles/theme';

export const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  photo: { flex: 1, justifyContent: 'flex-end', padding: Spacing.six, backgroundColor: FixedColors.shell },
  photoCopy: { maxWidth: Size.copyMax },
  formWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three },
  form: { width: '100%', maxWidth: AuthFormWidth, gap: Spacing.four },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  logo: { width: TouchTarget + Spacing.two, height: TouchTarget + Spacing.two, borderRadius: Spacing.three, backgroundColor: FixedColors.shellActive, alignItems: 'center', justifyContent: 'center' },
});
