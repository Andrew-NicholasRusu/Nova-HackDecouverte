import { router } from 'expo-router';
import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { TABS } from '@/constants/tabs';
import { SIDEBAR_WIDTH, useLayout } from '@/hooks/use-layout';
import { isHovered } from '@/lib/pressable';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/providers/theme-preference';

// The sidebar is always charcoal (brand surface), in both themes.
const SIDEBAR = Colors.dark;

export default function AppTabs() {
  const { sidebar } = useLayout();

  return (
    <Tabs>
      <View style={[styles.shell, sidebar && styles.shellRow]}>
        {/* Triggers must be direct children of the TabList element so the router can find them. */}
        <TabList asChild>
          {sidebar ? (
            <Sidebar>
              {TABS.map((tab) => (
                <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
                  <SidebarButton icon={tab.icon}>{tab.label}</SidebarButton>
                </TabTrigger>
              ))}
            </Sidebar>
          ) : (
            <TopBar>
              {TABS.map((tab) => (
                <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
                  <TopButton>{tab.label}</TopButton>
                </TabTrigger>
              ))}
            </TopBar>
          )}
        </TabList>
        <TabSlot style={styles.slot} />
      </View>
    </Tabs>
  );
}

type ButtonProps = TabTriggerSlotProps & { icon?: IconName };

function SidebarButton({ children, isFocused, icon, ...props }: ButtonProps) {
  return (
    <Pressable
      {...(props as unknown as PressableProps)}
      style={(state) => [
        styles.sideItem,
        isFocused && { backgroundColor: SIDEBAR.accent },
        !isFocused && isHovered(state) && { backgroundColor: SIDEBAR.backgroundSelected },
        state.pressed && styles.pressed,
      ]}>
      {icon ? <Icon name={icon} color={SIDEBAR.text} /> : null}
      <ThemedText type="smallBold" style={{ color: SIDEBAR.text }}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

function Sidebar(props: TabListProps) {
  const { preference, scheme, setPreference } = useThemePreference();
  const isDark = scheme === 'dark';

  return (
    <View {...props} style={[styles.sidebar, { backgroundColor: SIDEBAR.background }]}>
      <ThemedText type="subtitle" style={[styles.brand, { color: SIDEBAR.text }]}>
        ORBIT
      </ThemedText>

      <View style={styles.sideNav}>
        {props.children}
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/settings')}
          style={(state) => [
            styles.sideItem,
            isHovered(state) && { backgroundColor: SIDEBAR.backgroundSelected },
          ]}>
          <Icon name="settings" color={SIDEBAR.text} />
          <ThemedText type="smallBold" style={{ color: SIDEBAR.text }}>
            Settings
          </ThemedText>
        </Pressable>
      </View>

      <View style={[styles.themeToggle, { backgroundColor: SIDEBAR.backgroundElement }]}>
        {(['light', 'dark'] as const).map((mode) => {
          const active = preference !== 'system' ? preference === mode : (mode === 'dark') === isDark;
          return (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityLabel={mode === 'light' ? 'Light mode' : 'Dark mode'}
              accessibilityState={{ selected: active }}
              onPress={() => setPreference(mode)}
              style={[styles.themeBtn, active && { backgroundColor: SIDEBAR.backgroundSelected }]}>
              <Icon name={mode === 'light' ? 'sun' : 'moon'} color={SIDEBAR.text} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TopButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();
  return (
    <Pressable
      {...(props as unknown as PressableProps)}
      style={({ pressed }) => [
        styles.topItem,
        { backgroundColor: isFocused ? theme.accent : 'transparent' },
        pressed && styles.pressed,
      ]}>
      <ThemedText
        type="smallBold"
        style={{ color: isFocused ? theme.accentText : theme.textSecondary }}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

function TopBar(props: TabListProps) {
  const theme = useTheme();
  return (
    <View {...props} style={styles.topContainer}>
      <View
        style={[
          styles.topInner,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <ThemedText type="heading" themeColor="accent" style={styles.topBrand}>
          ORBIT
        </ThemedText>
        {props.children}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Settings"
          onPress={() => router.push('/settings')}
          style={styles.topIcon}>
          <Icon name="settings" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  shellRow: { flexDirection: 'row' },
  slot: { flex: 1, height: '100%' },
  pressed: { opacity: 0.7 },

  sidebar: {
    width: SIDEBAR_WIDTH,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
  },
  brand: { letterSpacing: 3, paddingHorizontal: Spacing.two },
  sideNav: { gap: Spacing.one, flex: 1 },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  themeToggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    padding: Spacing.one,
    gap: Spacing.one,
  },
  themeBtn: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },

  topContainer: {
    position: 'absolute',
    zIndex: 10,
    width: '100%',
    padding: Spacing.three,
    alignItems: 'center',
  },
  topInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  topBrand: { marginRight: 'auto', letterSpacing: 2 },
  topItem: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  topIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
