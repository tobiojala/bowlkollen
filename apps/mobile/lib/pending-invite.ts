import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';

// A tapped invite link may arrive before the user is authenticated — the root
// navigator then redirects to /login and the route (with the code) is lost. So we
// stash the code the moment any invite link opens the app, and the invite gate
// redeems it once the user is signed in. SecureStore so it survives a cold start
// (e.g. the app is killed between tapping the link and finishing login).

const KEY = 'pending_invite_code';
let mem: string | null = null;

// Pull the invite code out of any shape of link we might receive:
//   bowlkollen://invite?code=XXX   ·   https://bowlkollen.se/invite?code=XXX
//   exp://192.168.x.x:8081/--/invite?code=XXX   (Expo Go)
export function parseInviteCode(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { path, hostname, queryParams } = Linking.parse(url);
    const isInvite = (path ?? '').includes('invite') || hostname === 'invite';
    const code = queryParams?.code;
    if (isInvite && typeof code === 'string' && code.trim()) return code.trim();
  } catch {
    // malformed URL — ignore
  }
  return null;
}

export async function setPendingInvite(code: string): Promise<void> {
  mem = code;
  try {
    await SecureStore.setItemAsync(KEY, code);
  } catch {
    // SecureStore unavailable (e.g. web) — the in-memory copy still covers this session.
  }
}

export async function getPendingInvite(): Promise<string | null> {
  if (mem) return mem;
  try {
    mem = await SecureStore.getItemAsync(KEY);
  } catch {
    mem = null;
  }
  return mem;
}

export async function clearPendingInvite(): Promise<void> {
  mem = null;
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // nothing to clear
  }
}

// Watch the incoming deep-link URL and stash any invite code we see. Mounted once
// at the app root so it captures cold-start and warm links alike.
export function useCaptureInviteLinks(): void {
  const url = Linking.useURL();
  useEffect(() => {
    const code = parseInviteCode(url);
    if (code) void setPendingInvite(code);
  }, [url]);
}
