import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { OrganizationRole } from '@repo/types';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ChecklistRow } from '@/components/onboarding/checklist-row';
import { StripeConnectRow } from '@/components/onboarding/stripe-connect-row';

export default function SetupScreen() {
  const router = useRouter();
  const { currentOrg, isLoading } = useCurrentOrg();
  const orgId = currentOrg?._id as Id<'organizations'> | undefined;
  const status = useQuery(api.onboarding.getStatus, orgId ? { orgId } : 'skip');

  return (
    <ThemedView style={styles.root}>
      <ScreenHeader title="Setup" onBack={router.back} />
      {isLoading || (orgId && status === undefined) ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : !currentOrg || !orgId || !status ? (
        <EmptyState message="Select an organization first" />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: BottomTabInset + Spacing.three },
          ]}
        >
          <ThemedText type="small" themeColor="textSecondary">
            {status.readyToSendInvoice
              ? 'Ready to send invoices'
              : 'Complete these steps to send invoices'}
          </ThemedText>
          <ChecklistRow
            label="Organization name"
            done={status.orgCreated}
            hint={currentOrg.name}
            onPress={() => router.push('/more/business-info')}
          />
          <ChecklistRow
            label="Business address"
            done={status.businessInfoSet}
            onPress={() => router.push('/more/business-info')}
          />
          <StripeConnectRow
            orgId={orgId}
            isOwner={currentOrg.role === OrganizationRole.OWNER}
          />
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
});
