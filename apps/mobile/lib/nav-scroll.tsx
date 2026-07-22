import { usePathname } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

// Drives the FloatingNav collapse/expand morph from screen scroll — mirrors the
// web BottomNav: near the top → expanded; scrolling down → collapse to the mini
// circle; scrolling up → expand again. Screens attach `onScroll` to their list.
type NavScroll = {
  expanded: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const Ctx = createContext<NavScroll>({ expanded: true, onScroll: () => {} });

export function useNavScroll() {
  return useContext(Ctx);
}

export function NavScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const last = useRef(0);

  // Reset to expanded on every tab change.
  useEffect(() => {
    setExpanded(true);
    last.current = 0;
  }, [pathname]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y < 10) {
      setExpanded(true);
      last.current = y;
      return;
    }
    if (y > last.current + 6) setExpanded(false);
    else if (y < last.current - 6) setExpanded(true);
    last.current = y;
  }, []);

  return <Ctx.Provider value={{ expanded, onScroll }}>{children}</Ctx.Provider>;
}
