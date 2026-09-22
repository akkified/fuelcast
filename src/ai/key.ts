// The athlete's own Anthropic API key, kept in the iOS Keychain (expo-secure-store).
// On web, where SecureStore isn't available, it falls back to local storage.
// The key is never part of the app state JSON and never leaves the device except
// in requests to api.anthropic.com.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'fuelcast.anthropicApiKey';

export async function getApiKey(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return await AsyncStorage.getItem(KEY);
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function setApiKey(value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (value) await AsyncStorage.setItem(KEY, value);
    else await AsyncStorage.removeItem(KEY);
    return;
  }
  if (value) await SecureStore.setItemAsync(KEY, value);
  else await SecureStore.deleteItemAsync(KEY);
}

/** Show only the end of a key, e.g. "…a1B2". */
export const maskKey = (k: string) => `…${k.slice(-4)}`;
