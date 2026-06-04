import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/theme';
import { TabIcon } from '../../src/components/MapIcons';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.backgroundDark },
        headerTintColor: theme.accentGold,
        tabBarStyle: {
          backgroundColor: theme.cardBackground,
          borderTopColor: theme.cardBorder,
          paddingBottom: tabBarBottom,
          height: 52 + tabBarBottom,
        },
        tabBarActiveTintColor: theme.accentGold,
        tabBarInactiveTintColor: theme.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ focused }) => <TabIcon name="explore" focused={focused} /> }} />
      <Tabs.Screen name="quests" options={{ title: 'Quests', tabBarIcon: ({ focused }) => <TabIcon name="quests" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} /> }} />
      <Tabs.Screen name="friends" options={{ title: 'Social', tabBarIcon: ({ focused }) => <TabIcon name="friends" focused={focused} /> }} />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ focused }) => <TabIcon name="shop" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
