import { useEffect } from 'react';
import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { boot, useApp } from '../stores/app';
import { useTheme } from '../hooks/use-theme';
import { Button, ErrorText, Label, OverlayProvider } from '../components/ui';

export default function Layout() {
  const { ready, error, data } = useApp(); const c = useTheme();
  useEffect(() => { void boot(); }, []);
  const dark = c.background === '#0B0F14';
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><ThemeProvider value={{ ...(dark ? DarkTheme : DefaultTheme), colors: { ...(dark ? DarkTheme : DefaultTheme).colors, background: c.background, card: c.surface, text: c.text, border: c.border, primary: c.accent } }}><OverlayProvider><StatusBar style={dark ? 'light' : 'dark'} />
    {!ready ? <View style={{ flex: 1, backgroundColor: c.background, justifyContent: 'center', padding: 32, gap: 20 }}><Label large>FORMA</Label>{error ? <><ErrorText message={`Local storage could not open: ${error}`} /><Button title="Try again" onPress={() => void boot()} /></> : <ActivityIndicator color={c.accent} />}</View> : <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
      <Stack.Protected guard={!!data.profile}><Stack.Screen name="(tabs)" /><Stack.Screen name="workout" /><Stack.Screen name="exercise" /><Stack.Screen name="nutrition" /><Stack.Screen name="hydration" /><Stack.Screen name="calendar" /><Stack.Screen name="recovery" /><Stack.Screen name="settings" /><Stack.Screen name="meal-planner" /></Stack.Protected>
      <Stack.Screen name="index" /><Stack.Screen name="onboarding" />
    </Stack>}
  </OverlayProvider></ThemeProvider></SafeAreaProvider></GestureHandlerRootView>;
}
