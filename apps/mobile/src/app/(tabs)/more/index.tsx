import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, type Href } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { ScreenHeader } from '@/components/ui/screen-header';

const TOTAL_SETUP_STEPS = 3;

function HubRow({ label, detail, href }: { label: string; detail?: string; href: Href }) {
  const router = useRouter();
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border },
        pressed && { backgroundColor: theme.backgroundElement },
      ]}
    >
      <View style={styles.rowBody}>
        <ThemedText>{label}</ThemedText>
        {detail ? (
          <ThemedText type="small" themeColor="textSecondary">
            {detail}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText themeColor="textSecondary">›</ThemedText>
    </Pressable>
  );
}

export default function MoreScreen() {
  const { signOut } = useAuth();
  const { currentOrg } = useCurrentOrg();
  const status = useQuery(
    api.onboarding.getStatus,
    currentOrg ? { orgId: currentOrg._id as Id<'organizations'> } : 'skip',
  );

  const completed = status
    ? [status.orgCreated, status.businessInfoSet, status.stripeConnected].filter(Boolean).length
    : null;

  return (
    <ThemedView style={styles.root}>
      <ScreenHeader title="More" />
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.three }}>
        <HubRow
          label="Setup"
          detail={completed === null ? undefined : `${completed} of ${TOTAL_SETUP_STEPS} complete`}
          href="/more/setup"
        />
        <HubRow label="Items" detail="Reusable line items" href="/more/items" />
        <HubRow label="Expenses" detail="Attachable to invoices" href="/more/expenses" />
        <Pressable
          onPress={async () => {
            await AsyncStorage.removeItem('invo:currentOrgId');
            await signOut();
          }}
          style={({ pressed }) => [
            styles.row,
            pressed && { opacity: 0.6 },
          ]}
        >
          <ThemedText themeColor="destructive">Sign out</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowBody: { flex: 1, gap: Spacing.half },
});
