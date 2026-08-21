import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

import { useTheme } from '@/hooks/use-theme';

// ponytail: placeholder icon for every tab, matching the existing Invoices tab
const TAB_ICON = require('@/assets/images/tabIcons/home.png');

export default function TabsLayout() {
  const colors = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon src={TAB_ICON} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="invoices">
        <Label>Invoices</Label>
        <Icon src={TAB_ICON} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="clients">
        <Label>Clients</Label>
        <Icon src={TAB_ICON} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="more">
        <Label>More</Label>
        <Icon src={TAB_ICON} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
