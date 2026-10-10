import { useState } from 'react';
﻿import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingTabBar, FloatingTabButton } from '../../components/FloatingTabBar';
import { FLOATING_TAB_HEIGHT, FloatingTabInsetContext, floatingTabBottom } from '../../hooks/floating-tab-inset';
import { useTheme } from '../../hooks/use-theme';
import { useProfilePhoto } from '../../features/profile-photo/store';

const tabs = [
  ['home', '/(tabs)', 'Home', 'home-outline'],
  ['train', '/(tabs)/train', 'Train', 'barbell-outline'],
  ['run', '/(tabs)/run', 'Run', 'pulse-outline'],
  ['progress', '/(tabs)/progress', 'Progress', 'stats-chart-outline'],
  ['profile', '/(tabs)/profile', 'Profile', 'person-outline'],
] as const;

export default function TabLayout() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const photo = useProfilePhoto();
  const [barHeight,setBarHeight] = useState(FLOATING_TAB_HEIGHT);
  const contentInset = barHeight + floatingTabBottom(insets.bottom) + 20;
  return <FloatingTabInsetContext.Provider value={contentInset}>
    <Tabs style={{ flex: 1, backgroundColor: c.background }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild><FloatingTabBar onHeightChange={setBarHeight}>
        {tabs.map(([name, href, label, icon]) => <TabTrigger key={name} name={name} href={href} asChild><FloatingTabButton label={label} icon={icon} avatarUri={name === 'profile' ? photo.uri : undefined} /></TabTrigger>)}
      </FloatingTabBar></TabList>
    </Tabs>
  </FloatingTabInsetContext.Provider>;
}
