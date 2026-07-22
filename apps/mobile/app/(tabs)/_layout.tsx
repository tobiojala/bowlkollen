import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { ScrollBlur } from '@/components/ScrollBlur';
import { COLOR, FONT } from '@/theme';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLOR.gold,
        tabBarInactiveTintColor: COLOR.ink3,
        tabBarStyle: {
          backgroundColor: COLOR.bg,
          borderTopColor: COLOR.hairline,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: FONT.semibold },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hem',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schema"
        options={{
          title: 'Schema',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Hitta',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      </Tabs>
      <ScrollBlur overTabBar />
    </View>
  );
}
