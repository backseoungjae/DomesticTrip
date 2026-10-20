import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from '@/shared/i18n/LanguageProvider';
import { languageStorage } from '@/shared/i18n/languageStorage';
import { QueryProvider } from '@/shared/query/QueryProvider';
import { useColors } from '@/shared/theme';

export const unstable_settings = { anchor: '(tabs)' };
export { RouteErrorScreen as ErrorBoundary } from '@/shared/RouteErrorScreen';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = useColors();
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <LanguageProvider storage={languageStorage}>
          <QueryProvider>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" />
            </Stack>
          </QueryProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
