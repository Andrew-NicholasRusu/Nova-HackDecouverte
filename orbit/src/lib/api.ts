import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Origin of the ORBIT server (Expo Router API routes).
 * Web: same origin. Native: EXPO_PUBLIC_API_ORIGIN if set, otherwise the Metro dev host.
 */
function apiOrigin(): string {
  if (Platform.OS === 'web') return '';
  const explicit = process.env.EXPO_PUBLIC_API_ORIGIN;
  if (explicit) return explicit.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081" in dev
  return host ? `http://${host}` : '';
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiOrigin()}${path}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}
