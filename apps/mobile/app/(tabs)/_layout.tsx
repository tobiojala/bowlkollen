import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { FloatingNav } from '@/components/FloatingNav';
import { LockScreen } from '@/components/LockScreen';
import { ScrollBlur } from '@/components/ScrollBlur';
import { NavScrollProvider } from '@/lib/nav-scroll';
import { COLOR } from '@/theme';

export default function TabsLayout() {
  return (
    <NavScrollProvider>
      <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
        <Tabs
          tabBar={() => null}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="schema" />
          <Tabs.Screen name="discover" />
          <Tabs.Screen name="tavlingar" />
          <Tabs.Screen name="profile" />
        </Tabs>
        {/* Overlays share one compositing layer over the content, so the glass
            samples the content behind it (same as the blur bands). */}
        <ScrollBlur overTabBar />
        <FloatingNav />
        <LockScreen />
      </View>
    </NavScrollProvider>
  );
}
