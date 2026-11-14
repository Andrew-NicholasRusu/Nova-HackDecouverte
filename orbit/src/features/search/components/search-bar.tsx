import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { Dropdown } from '@/components/ui/dropdown';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import type { SearchResult } from '@/data/types';
import { useSearch } from '@/features/search/use-search';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { useDismissOutside, useOverlay } from '@/lib/overlay';
import { FixedColors, Opacity } from '@/styles/theme';

import { styles } from './search-bar.styles';

/**
 * Global search for the hero. Collapsed it is a pill; opened it expands across the banner and a
 * dropdown lists matches from every module. Choosing a result opens that module focused on it.
 */
export function SearchBar() {
  const theme = useTheme();
  const { isMedium } = useLayout();
  const [open, setOpen] = useOverlay('hero-search');
  const wrap = useRef<ComponentRef<typeof View>>(null);
  const [query, setQuery] = useState('');
  const results = useSearch(query);
  const [active, setActive] = useState(0);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, [setOpen]);
  useDismissOutside(wrap, open, close);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Press "/" anywhere (outside a text field) to start searching, like most web apps.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key === '/' && !open && !/INPUT|TEXTAREA/.test(el?.tagName ?? '')) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  function choose(r: SearchResult) {
    close();
    router.push({ pathname: r.target.pathname, params: r.target.params });
  }

  if (!open) {
    return (
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search classes, buildings, rooms, friends and places"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.pill, pressed && { opacity: Opacity.pressed }]}>
        <Icon name="search" size="md" color={FixedColors.shellMuted} />
        <ThemedText type="small" style={{ color: FixedColors.shellMuted }} numberOfLines={1}>
          Search classes, rooms, friends…
        </ThemedText>
        {Platform.OS === 'web' && isMedium ? (
          <View style={styles.key}>
            <ThemedText type="caption" style={{ color: FixedColors.shellMuted }}>
              /
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
    );
  }

  let lastGroup = '';
  return (
    <View ref={wrap} style={styles.open}>
      <View style={styles.field}>
        <Icon name="search" size="md" color={FixedColors.shellMuted} />
        <TextInput
          ref={input}
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            setActive(0);
          }}
          onKeyPress={(e) => {
            const k = e.nativeEvent.key;
            if (k === 'ArrowDown') setActive((i) => Math.min(results.length - 1, i + 1));
            else if (k === 'ArrowUp') setActive((i) => Math.max(0, i - 1));
            else if (k === 'Enter' && results[active]) choose(results[active]);
          }}
          placeholder="Search classes, rooms, friends, places"
          placeholderTextColor={FixedColors.shellMuted}
          accessibilityLabel="Search"
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Close search" onPress={close} style={styles.close}>
          <Icon name="close" size="md" color={FixedColors.shellMuted} />
        </Pressable>
      </View>
      {query.trim().length > 0 && (
        <Dropdown>
          {results.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary">
                Nothing matches “{query.trim()}”. Try a course code, a room like 1.130, or a name.
              </ThemedText>
            </View>
          ) : (
            results.map((r) => {
              const header = r.group !== lastGroup;
              lastGroup = r.group;
              return (
                <View key={r.id}>
                  {header && (
                    <ThemedText type="caption" themeColor="textSecondary" style={[styles.group, { borderTopColor: theme.border }]}>
                      {r.group}
                    </ThemedText>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${r.title}. ${r.subtitle}`}
                    onPress={() => choose(r)}
                    style={(s) => [
                      styles.row,
                      ((s as { hovered?: boolean }).hovered || results[active]?.id === r.id) && { backgroundColor: theme.accentTint },
                      s.pressed && { opacity: Opacity.pressed },
                    ]}>
                    <View style={[styles.icon, { backgroundColor: theme.accentTint }]}>
                      <Icon name={r.icon} size="md" color="accentLink" />
                    </View>
                    <View style={styles.text}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {r.title}
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                        {r.subtitle}
                      </ThemedText>
                    </View>
                    <Icon name="chevron-right" size="md" color="textSecondary" />
                  </Pressable>
                </View>
              );
            })
          )}
        </Dropdown>
      )}
    </View>
  );
}
