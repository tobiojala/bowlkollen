import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import type { Database } from '@bowlkollen/core';

// Session persistence via Expo SecureStore (Keychain / encrypted Android
// storage) per AGENTS.md security rule #7 — never AsyncStorage.
//
// Guarded: this module is created at import time with persistSession, so it also
// runs during Metro's Node-side evaluation (expo-router route/RSC extraction),
// where the native SecureStore module is absent and every call throws. An
// unguarded throw there takes the whole dev server down. On device these succeed;
// off-device they no-op (there is no session to persist there anyway).
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  setItem: async (key: string, value: string) => {
    try { await SecureStore.setItemAsync(key, value); } catch { /* no native store here */ }
  },
  removeItem: async (key: string) => {
    try { await SecureStore.deleteItemAsync(key); } catch { /* no native store here */ }
  },
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (apps/mobile/.env.local)',
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // no URL-based auth callback in a native app
  },
});
