import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { FormButton } from '@/components/form';
import { InvoiceRow } from '@/components/invoice/invoice-row';
import type { InvoiceItem } from '@/components/invoice/invoice-row';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_ORDER = ['DRAFT', 'SENT', 'VIEWED', 'PAID', 'VOID'] as const;

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
      <ThemedText
        type="small"
        themeColor="textSecondary"
        style={styles.sectionHeaderText}
      >
        {title}
      </ThemedText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function InvoiceListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const { currentOrg, isLoading: orgLoading } = useCurrentOrg();

  const grouped = useQuery(
    api.invoices.listByOrgGroupedByStatus,
    currentOrg
      ? { orgId: currentOrg._id as Id<'organizations'> }
      : 'skip',
  );

  const sections = useMemo(() => {
    if (!grouped) return [];
    return STATUS_ORDER.filter(
      (status) => grouped[status] && grouped[status].length > 0,
    ).map((status) => ({
      title: status,
      data: grouped[status],
    }));
  }, [grouped]);

  const isEmpty = grouped !== undefined && sections.length === 0;
  const isLoading = orgLoading || (currentOrg !== null && grouped === undefined);

  return (
    <ThemedView style={styles.root}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.three, borderBottomColor: theme.border },
        ]}
      >
        <ThemedText type="subtitle">Invoices</ThemedText>
        <FormButton
          label="New Invoice"
          onPress={() => router.push('invoices/new')}
          variant="primary"
        />
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : !currentOrg ? (
        <EmptyState message="Select an organization to view invoices" />
      ) : isEmpty ? (
        <EmptyState
          message="No invoices yet"
          actionLabel="Create Invoice"
          onAction={() => router.push('invoices/new')}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <InvoiceRow
              invoice={item}
              onPress={() => router.push(`invoices/${item._id}`)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: BottomTabInset + Spacing.three },
          ]}
          stickySectionHeadersEnabled
        />
      )}
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  sectionHeader: {
    paddingVertical: Spacing.two,
    paddingTop: Spacing.three,
  },
  sectionHeaderText: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
