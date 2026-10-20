import {
  useEffect,
  useRef,
  type ComponentRef,
  type PropsWithChildren,
  type RefObject,
} from 'react';
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, useColors } from './theme';
import { AppText } from './ui';

export function Dialog({
  visible,
  title,
  onClose,
  children,
  contentStyle,
  returnFocusRef,
  fallbackFocusRef,
}: PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  returnFocusRef?: RefObject<ComponentRef<typeof View> | null>;
  fallbackFocusRef?: RefObject<ComponentRef<typeof View> | null>;
}>) {
  const colors = useColors();
  const heading = useRef<ComponentRef<typeof View>>(null);
  const shown = useRef(false);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!visible) return;
    return () => {
      clearTimeout(focusTimer.current);
      if (!shown.current) return;
      shown.current = false;
      // Wait for the native fade/window dismissal before restoring the opener.
      focusTimer.current = setTimeout(() => {
        const target = returnFocusRef?.current ?? fallbackFocusRef?.current;
        // TalkBack follows exploration events; iOS follows explicit focus events.
        if (target)
          AccessibilityInfo.sendAccessibilityEvent(
            target,
            Platform.OS === 'android' ? 'viewHoverEnter' : 'focus',
          );
      }, 200);
    };
  }, [visible, returnFocusRef, fallbackFocusRef]);
  useEffect(() => {
    if (!visible || !shown.current) return;
    // A place menu can become a confirmation without closing the native modal.
    clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => {
      if (heading.current)
        AccessibilityInfo.sendAccessibilityEvent(
          heading.current,
          Platform.OS === 'android' ? 'viewHoverEnter' : 'focus',
        );
    }, 600);
  }, [title, visible]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => {
        shown.current = true;
        clearTimeout(focusTimer.current);
        // The native window must receive focus before its heading can receive it.
        focusTimer.current = setTimeout(() => {
          if (heading.current)
            AccessibilityInfo.sendAccessibilityEvent(
              heading.current,
              Platform.OS === 'android' ? 'viewHoverEnter' : 'focus',
            );
        }, 600);
      }}
    >
      <SafeAreaView style={styles.overlay}>
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[styles.dialog, { backgroundColor: colors.surface }]}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
        >
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
          >
            <View
              ref={heading}
              accessible
              focusable
              accessibilityRole="header"
              accessibilityLabel={title}
            >
              <AppText accessible={false} importantForAccessibility="no" variant="heading">
                {title}
              </AppText>
            </View>
            {children}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000070',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  content: { padding: spacing.lg, gap: spacing.md },
});
