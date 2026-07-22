import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { FloatingNav } from '@/components/FloatingNav';
import { ScrollBlur } from '@/components/ScrollBlur';
import { COLOR } from '@/theme';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
      <Tabs
        tabBar={(props) => <FloatingNav {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="schema" />
        <Tabs.Screen name="discover" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <ScrollBlur overTabBar />
    </View>
  );
}
