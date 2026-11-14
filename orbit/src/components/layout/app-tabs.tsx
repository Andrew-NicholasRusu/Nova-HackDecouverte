import { NativeTabs } from 'expo-router/native-tabs';

import { TABS } from '@/constants/tabs';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.backgroundElement}
      indicatorColor={theme.accentTint}
      tintColor={theme.accentLink}
      labelStyle={{ selected: { color: theme.text } }}>
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name} hidden={!tab.bar}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
