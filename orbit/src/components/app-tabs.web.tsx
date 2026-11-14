import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { TABS } from '@/constants/tabs';
import { FixedColors, Opacity, Radius, SidebarWidth, Spacing, TabBarHeight, TouchTarget } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';

/** Sidebar on wide screens, bottom tab bar on narrow ones (column-reverse puts the list last). */
export default function AppTabs() {
  const { isWide } = useLayout();
  return (
    <Tabs style={[styles.root, { flexDirection: isWide ? 'row' : 'column-reverse' }]}>
      <TabList asChild>
        <CustomTabList wide={isWide}>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton icon={tab.icon} wide={isWide} hidden={!isWide && !tab.bar}>
                {isWide ? tab.label : tab.barLabel}
              </TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
      <TabSlot style={styles.slot} />
    </Tabs>
  );
}

type ButtonProps = TabTriggerSlotProps & { icon: IconName; wide: boolean; hidden?: boolean };

export function TabButton({ children, isFocused, icon, wide, hidden, ...props }: ButtonProps) {
  const theme = useTheme();
  // Routes stay registered (Settings is reachable from the avatar) but get no bar slot on phones.
  if (hidden) return null;
  const fg = wide ? (isFocused ? FixedColors.white : FixedColors.shellMuted) : isFocused ? theme.accentLink : theme.textSecondary;

  return (
    <Pressable
      // The slot's ref type is looser than Pressable's; the runtime value is a valid element ref.
      {...(props as unknown as PressableProps)}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered;
        return [
          wide ? styles.sideItem : styles.barItem,
          wide && isFocused && { backgroundColor: FixedColors.shellActive },
          wide && hovered && !isFocused && { backgroundColor: FixedColors.shellHover },
          !wide && hovered && { backgroundColor: theme.backgroundSelected },
          state.pressed && { opacity: Opacity.pressed },
        ];
      }}>
      <Icon name={icon} size="lg" color={fg} />
      <ThemedText type={wide ? 'smallBold' : 'caption'} style={{ color: fg }} numberOfLines={1}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function CustomTabList({ wide, ...props }: TabListProps & { wide: boolean }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!wide) {
    return (
      <View
        {...props}
        accessibilityRole="tablist"
        style={[
          styles.bar,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            paddingBottom: insets.bottom,
            height: TabBarHeight + insets.bottom,
          },
        ]}
      />
    );
  }

  return (
    <View {...props} accessibilityRole="tablist" style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Icon name="trip-origin" size="xl" color={FixedColors.white} />
        </View>
        <ThemedText type="heading" style={styles.brandText}>
          ORBIT
        </ThemedText>
      </View>
      <View style={styles.nav}>{props.children}</View>
      <View style={styles.footer}>
        <View style={styles.school}>
          <View style={styles.goldRule} />
          <ThemedText type="smallBold" style={{ color: FixedColors.shellText }}>
            Concordia University
          </ThemedText>
          <ThemedText type="caption" style={{ color: FixedColors.shellMuted }}>
            Montréal
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slot: { flex: 1 },
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'stretch',
  },
  barItem: {
    flex: 1,
    minHeight: TouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
  },
  sidebar: {
    width: SidebarWidth,
    backgroundColor: FixedColors.shell,
    borderRightWidth: 1,
    borderRightColor: FixedColors.shellBorder,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.two },
  logo: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: Radius.md,
    backgroundColor: FixedColors.shellActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { color: FixedColors.shellText, letterSpacing: 3 },
  nav: { gap: Spacing.one, flex: 1 },
  sideItem: {
    minHeight: TouchTarget + Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  footer: { gap: Spacing.three },
  school: { gap: Spacing.half, paddingHorizontal: Spacing.two },
  goldRule: {
    width: Spacing.five,
    height: Spacing.half,
    backgroundColor: FixedColors.gold,
    marginBottom: Spacing.two,
  },
});
