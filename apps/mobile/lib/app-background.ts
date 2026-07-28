import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

// The user's private "lockscreen" / Profil background. Their own photo, kept ON DEVICE
// (copied into the app's document dir) — never uploaded, only they ever see it, so there
// is nothing to moderate. It's a wallpaper.

const KEY = 'bk_app_background';

export async function getBackground(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

async function deletePrev() {
  const prev = await SecureStore.getItemAsync(KEY).catch(() => null);
  if (prev) {
    try {
      const f = new File(prev);
      if (f.exists) f.delete();
    } catch {
      /* ignore */
    }
  }
}

// Pick a photo → copy into persistent app storage → remember it. Returns the uri (or
// null if cancelled / denied).
export async function pickBackground(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
  if (res.canceled || !res.assets?.[0]) return null;

  await deletePrev();
  const src = res.assets[0].uri;
  try {
    const dest = new File(Paths.document, `bg_${Date.now()}.jpg`);
    new File(src).copy(dest);
    await SecureStore.setItemAsync(KEY, dest.uri);
    return dest.uri;
  } catch {
    // Copy failed — keep the picker uri (usually still valid this session).
    await SecureStore.setItemAsync(KEY, src);
    return src;
  }
}

export async function clearBackground(): Promise<void> {
  await deletePrev();
  await SecureStore.deleteItemAsync(KEY).catch(() => {});
}

export function useAppBackground() {
  const [uri, setUri] = useState<string | null>(null);
  const reload = useCallback(async () => setUri(await getBackground()), []);
  useEffect(() => {
    void reload();
  }, [reload]);

  const pick = useCallback(async () => {
    const u = await pickBackground();
    if (u) setUri(u);
    return u;
  }, []);
  const clear = useCallback(async () => {
    await clearBackground();
    setUri(null);
  }, []);

  return { uri, pick, clear, reload };
}
