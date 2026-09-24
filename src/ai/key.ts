// AI Coach provider settings and API keys.
//
// Keys live in the iOS Keychain (expo-secure-store); on web, where SecureStore
// isn't available, they fall back to local storage. They're never part of the app
// state JSON, and they only leave the device in requests to that provider's API.
//
// Three ways to reach Grok, in priority order:
//  1. A key the athlete pasted in Settings.
//  2. Development builds only: EXPO_PUBLIC_XAI_API_KEY from the git-ignored .env.local
//     (the __DEV__ guard keeps it out of production builds and the website).
//  3. The shared FuelCast coach server (EXPO_PUBLIC_COACH_API_URL). The server holds
//     one key for everyone, so users need no key. The URL isn't secret.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type AiProvider = 'claude' | 'grok';

export const PROVIDER_NAME: Record<AiProvider, string> = { claude: 'Claude', grok: 'Grok' };

const KEY_NAMES: Record<AiProvider, string> = { claude: 'fuelcast.anthropicApiKey', grok: 'fuelcast.xaiApiKey' };
const PROVIDER_PREF = 'fuelcast.aiProvider';

/** Development-only Grok key from .env.local. Always undefined in production builds. */
const DEV_GROK_KEY: string | undefined = __DEV__ ? process.env.EXPO_PUBLIC_XAI_API_KEY || undefined : undefined;

/** Shared coach server endpoint, e.g. https://fuelcast.netlify.app/api/coach. */
export const COACH_SERVER_URL: string | undefined = process.env.EXPO_PUBLIC_COACH_API_URL || undefined;

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
  return DEV_GROK_KEY || COACH_SERVER_URL ? 'grok' : 'claude';
}

export async function setAiProvider(p: AiProvider): Promise<void> {
  await AsyncStorage.setItem(PROVIDER_PREF, p);
}

export interface ProviderKey {
  /** Absent when going through the coach server. */
  key?: string;
  serverUrl?: string;
  /** "saved" = entered in Settings; "dev" = .env.local in a development build; "server" = shared coach server. */
  source: 'saved' | 'dev' | 'server';
}

export async function getProviderKey(provider: AiProvider): Promise<ProviderKey | null> {
  const saved = await readSecure(KEY_NAMES[provider]);
  if (saved) return { key: saved, source: 'saved' };
  if (provider === 'grok' && DEV_GROK_KEY) return { key: DEV_GROK_KEY, source: 'dev' };
  if (provider === 'grok' && COACH_SERVER_URL) return { serverUrl: COACH_SERVER_URL, source: 'server' };
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
