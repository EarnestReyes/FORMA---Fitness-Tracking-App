import { forwardRef, useEffect, useRef, useState } from 'react';
import { Animated, Image, Keyboard, Platform, Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/use-theme';
import { FLOATING_TAB_HEIGHT, floatingTabBottom } from '../hooks/floating-tab-inset';
import { useReducedMotion } from './design';

type TabButtonProps = TabTriggerSlotProps & { label: string; icon: keyof typeof Ionicons.glyphMap; avatarUri?: string | null };

export const FloatingTabButton = forwardRef<View, TabButtonProps>(function FloatingTabButton({ isFocused, label, icon, avatarUri, ...props }, ref) {
  const c = useTheme();
  const reduced = useReducedMotion();
  const highlight = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [avatarUri]);
  useEffect(() => {
    const animation = Animated.timing(highlight, { toValue: isFocused ? 1 : 0, duration: reduced ? 0 : 160, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [highlight, isFocused, reduced]);

  return <Pressable {...props} ref={ref} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: !!isFocused }} style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.65 : 1 }]}>
    <View style={styles.iconContainer}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: c.soft, opacity: highlight }]} />
      {avatarUri && !imageFailed ? <Image accessible={false} source={{ uri: avatarUri }} onError={() => setImageFailed(true)} style={[styles.avatar, { borderColor: isFocused ? c.accent : c.border }]} /> : <Ionicons accessible={false} name={icon} size={23} color={isFocused ? c.accent : c.muted} />}
    </View>
    <Text numberOfLines={1} style={{ fontSize: 11, lineHeight: 16, fontWeight: isFocused ? '700' : '500', color: isFocused ? c.accent : c.muted }}>{label}</Text>
  </Pressable>;
});

// Keep the TabList and its route-defining triggers in the layout; asChild forwards
// them into this visual wrapper without hiding them from Expo Router's parser.
export const FloatingTabBar = forwardRef<View, ViewProps & { onHeightChange?: (height: number) => void }>(function FloatingTabBar({ children, style, onHeightChange, ...props }, ref) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    if (Platform.OS !== 'web') return () => { show.remove(); hide.remove(); };
    // Native keyboard events do not cover mobile-web virtual keyboards. Hiding
    // while editing also keeps desktop form navigation free of an overlay.
    const updateFocus = () => { const element = document.activeElement; setKeyboardVisible(element instanceof HTMLElement && (element.matches('input, textarea, select') || element.isContentEditable)); };
    const onBlur = () => { queueMicrotask(updateFocus); };
    document.addEventListener('focusin', updateFocus);
    document.addEventListener('focusout', onBlur);
    return () => { show.remove(); hide.remove(); document.removeEventListener('focusin', updateFocus); document.removeEventListener('focusout', onBlur); };
  }, []);

  return <View {...props} ref={ref} pointerEvents={keyboardVisible ? 'none' : 'box-none'} accessibilityElementsHidden={keyboardVisible} importantForAccessibility={keyboardVisible ? 'no-hide-descendants' : 'auto'} style={[style, styles.position, { left: insets.left + 16, right: insets.right + 16, bottom: floatingTabBottom(insets.bottom), display: keyboardVisible ? 'none' : 'flex' }]}>
    <View onLayout={event => onHeightChange?.(event.nativeEvent.layout.height)} style={[styles.pill, { backgroundColor: c.surface, borderColor: c.border, shadowColor: c.shadow }]}>{children}</View>
  </View>;
});

const styles = StyleSheet.create({
  position: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  pill: { width: '100%', maxWidth: 520, minHeight: FLOATING_TAB_HEIGHT, paddingHorizontal: 6, paddingVertical: 6, flexDirection: 'row', borderWidth: 1, borderRadius: 32, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 },
  tab: { flex: 1, minWidth: 44, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconContainer: { width: 44, height: 32, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 2 },
});
