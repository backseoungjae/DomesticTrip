import type { ComponentRef, PropsWithChildren, ReactNode, Ref } from 'react';
import {
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type TextProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, typography, useColors } from './theme';

export function AppText({
  variant = 'body',
  muted = false,
  style,
  ...props
}: TextProps & {
  ref?: Ref<ComponentRef<typeof Text>>;
  variant?: keyof typeof typography;
  muted?: boolean;
}) {
  const colors = useColors();
  return (
    <Text
      {...props}
      style={[typography[variant], { color: muted ? colors.muted : colors.text }, style]}
    />
  );
}

export function Screen({
  children,
  scrollRef,
  footer,
}: PropsWithChildren<{ scrollRef?: Ref<ComponentRef<typeof ScrollView>>; footer?: ReactNode }>) {
  const colors = useColors();
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.column}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
      {footer && <FixedFooter>{footer}</FixedFooter>}
    </SafeAreaView>
  );
}

/** A virtualized list owns scrolling; do not nest it in Screen's ScrollView. */
export function ListScreen({ children, footer }: PropsWithChildren<{ footer?: ReactNode }>) {
  const colors = useColors();
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      {children}
      {footer && <FixedFooter>{footer}</FixedFooter>}
    </SafeAreaView>
  );
}

function FixedFooter({ children }: PropsWithChildren) {
  const colors = useColors();
  return (
    <View
      style={{
        padding: spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      <View style={styles.column}>{children}</View>
    </View>
  );
}

export const listStyles = StyleSheet.create({
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 688,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: { gap: spacing.lg, paddingBottom: spacing.lg },
  footer: { gap: spacing.lg, paddingTop: spacing.lg },
  separator: { height: spacing.lg },
});

export function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.heading}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <AppText muted>{description}</AppText>
    </View>
  );
}

export function Card({ children }: PropsWithChildren) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

export function Button({
  label,
  secondary = false,
  busy = false,
  destructive = false,
  disabled,
  accessibilityLabel,
  accessibilityState,
  style,
  ...props
}: PressableProps & {
  ref?: Ref<ComponentRef<typeof Pressable>>;
  label: string;
  secondary?: boolean;
  busy?: boolean;
  destructive?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      style={(state) => [
        styles.button,
        { backgroundColor: destructive ? colors.danger : secondary ? colors.tint : colors.primary },
        (state.pressed || disabled || busy) && styles.dim,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {busy && (
        <ActivityIndicator
          accessible={false}
          importantForAccessibility="no"
          color={secondary ? colors.primary : colors.onPrimary}
        />
      )}
      <AppText
        variant="label"
        style={{ color: secondary ? colors.primary : colors.onPrimary, textAlign: 'center' }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function BackButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: PressableProps['onPress'];
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={spacing.sm}
      style={({ pressed }) => [
        styles.backButton,
        { backgroundColor: pressed ? colors.tint : 'transparent' },
      ]}
    >
      <View accessible={false} style={[styles.backIcon, { borderColor: colors.primary }]} />
    </Pressable>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      <AppText muted>{description}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: spacing.lg },
  heading: { gap: spacing.sm, paddingTop: spacing.md },
  card: { padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, gap: spacing.md },
  button: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { opacity: 0.65 },
  backButton: {
    alignSelf: 'flex-start',
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
});
