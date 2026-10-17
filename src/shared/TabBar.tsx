import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, useColors } from './theme';
import { AppText } from './ui';

const tabs = [
  { name: 'index', label: 'tabs.home', icon: '⌂' },
  { name: 'explore', label: 'tabs.explore', icon: '◎' },
  { name: 'my-trips', label: 'tabs.trips', icon: '▤' },
  { name: 'settings', label: 'tabs.settings', icon: '⚙︎' },
] as const;

export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          paddingLeft: insets.left + spacing.xs,
          paddingRight: insets.right + spacing.xs,
        },
      ]}
    >
      {tabs.map((tab) => {
        const route = state.routes.find((item) => item.name === tab.name);
        if (!route) return null;
        const selected = state.routes[state.index].key === route.key;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={t(tab.label)}
            accessibilityState={{ selected }}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented && !selected) navigateToTab(route.key);
            }}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor: selected ? colors.tint : 'transparent',
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Text
              accessible={false}
              allowFontScaling={false}
              style={{ color: colors.primary, fontSize: 24 }}
            >
              {tab.icon}
            </Text>
            <AppText
              variant="caption"
              style={{
                textAlign: 'center',
                color: selected ? colors.primary : colors.muted,
                fontWeight: selected ? '700' : '400',
              }}
            >
              {t(tab.label)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'stretch', borderTopWidth: 1, paddingTop: spacing.sm },
  tab: {
    flex: 1,
    minHeight: 60,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
});
