// AI Coach provider settings and API keys.
//
// Keys live in the iOS Keychain (expo-secure-store); on web, where SecureStore
// isn't available, they fall back to local storage. They're never part of the app
// state JSON, and they only leave the device in requests to that provider's API.
//
// Development builds (Expo Go / `npx expo start`) can also read a Grok key from the
// git-ignored `.env.local` file (EXPO_PUBLIC_XAI_API_KEY). The __DEV__ guard means
// production builds, including the public website, never contain it.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type AiProvider = 'claude' | 'grok';

export const PROVIDER_NAME: Record<AiProvider, string> = { claude: 'Claude', grok: 'Grok' };

const KEY_NAMES: Record<AiProvider, string> = { claude: 'fuelcast.anthropicApiKey', grok: 'fuelcast.xaiApiKey' };
const PROVIDER_PREF = 'fuelcast.aiProvider';

/** Development-only Grok key from .env.local. Always undefined in production builds. */
const DEV_GROK_KEY: string | undefined = __DEV__ ? process.env.EXPO_PUBLIC_XAI_API_KEY || undefined : undefined;

async function readSecure(name: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return await AsyncStorage.getItem(name);
    return await SecureStore.getItemAsync(name);
  } catch {
    return null;
  }
}

async function writeSecure(name: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (value) await AsyncStorage.setItem(name, value);
    else await AsyncStorage.removeItem(name);
    return;
  }
  if (value) await SecureStore.setItemAsync(name, value);
  else await SecureStore.deleteItemAsync(name);
}

export async function getAiProvider(): Promise<AiProvider> {
  try {
    const saved = await AsyncStorage.getItem(PROVIDER_PREF);
    if (saved === 'claude' || saved === 'grok') return saved;
  } catch {
    // fall through to the default
  }
  return DEV_GROK_KEY ? 'grok' : 'claude';
}

export async function setAiProvider(p: AiProvider): Promise<void> {
  await AsyncStorage.setItem(PROVIDER_PREF, p);
}

export interface ProviderKey {
  key: string;
  /** "saved" = entered in Settings; "dev" = from .env.local in a development build. */
  source: 'saved' | 'dev';
}

export async function getProviderKey(provider: AiProvider): Promise<ProviderKey | null> {
  const saved = await readSecure(KEY_NAMES[provider]);
  if (saved) return { key: saved, source: 'saved' };
  if (provider === 'grok' && DEV_GROK_KEY) return { key: DEV_GROK_KEY, source: 'dev' };
  return null;
}

export async function setProviderKey(provider: AiProvider, value: string | null): Promise<void> {
  await writeSecure(KEY_NAMES[provider], value);
}

export interface AiConfig extends ProviderKey {
  provider: AiProvider;
}

/** The provider the athlete chose, with its key, or null if it isn't connected. */
export async function getAiConfig(): Promise<AiConfig | null> {
  const provider = await getAiProvider();
  const k = await getProviderKey(provider);
  return k ? { provider, ...k } : null;
}

/** Show only the end of a key, e.g. "…a1B2". */
export const maskKey = (k: string) => `…${k.slice(-4)}`;
