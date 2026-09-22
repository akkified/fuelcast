import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from '@/state/store';
import { goBack } from '@/ui/components';
import { colors } from '@/ui/theme';

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    primary: colors.accent,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="light" />
          <AppStack />
        </ThemeProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function CloseButton() {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={goBack} hitSlop={12} style={{ paddingHorizontal: 4 }}>
      <Ionicons name="close" size={26} color={colors.text} />
    </Pressable>
  );
}

/** Wait for saved data to load before showing any screen, so nothing renders with defaults first. */
function AppStack() {
  const { ready } = useStore();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="window/[id]" options={{ presentation: 'modal', title: 'Fuel window', headerLeft: CloseButton }} />
      <Stack.Screen name="event" options={{ presentation: 'modal', title: 'Session', headerLeft: CloseButton }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
