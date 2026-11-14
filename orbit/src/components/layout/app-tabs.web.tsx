import { router } from 'expo-router';
import { TabList, TabListProps, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, type PressableProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { TABS } from '@/data/navigation';
import type { IconName } from '@/data/types';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { FixedColors, Opacity, TabBarHeight } from '@/styles/theme';

import { styles } from './app-tabs.web.styles';

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
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Orbit, go to Home"
        onPress={() => router.navigate('/')}
        style={(s) => [styles.brand, s.pressed && { opacity: Opacity.pressed }]}>
        <View style={styles.logo}>
          <Icon name="trip-origin" size="xl" color={FixedColors.white} />
        </View>
        <ThemedText type="heading" style={styles.brandText}>
          ORBIT
        </ThemedText>
      </Pressable>
      <View style={styles.nav}>{props.children}</View>
    </View>
  );
}
