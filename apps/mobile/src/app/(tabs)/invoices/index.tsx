import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import { formatMoney } from '@repo/utils';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { FormButton } from '@/components/form';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_ORDER = ['DRAFT', 'SENT', 'VIEWED', 'PAID', 'VOID'] as const;

type InvoiceStatus = (typeof STATUS_ORDER)[number];

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const theme = useTheme();

  const badgeColor = useMemo(() => {
    switch (status as InvoiceStatus) {
      case 'DRAFT':
        return theme.textSecondary;
      case 'SENT':
        return theme.accent;
      case 'VIEWED':
        return theme.accent;
      case 'PAID':
        return '#22C55E';
      case 'VOID':
        return theme.destructive;
      default:
        return theme.textSecondary;
    }
  }, [status, theme]);

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
      <ThemedText type="small" style={styles.badgeText}>
        {status}
      </ThemedText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Invoice row
// ---------------------------------------------------------------------------

type InvoiceItem = {
  _id: Id<'invoices'>;
  clientSnapshot?: { name: string; email: string; phone?: string };
  total: number;
  status: string;
  createdAt: number;
};

function InvoiceRow({
  invoice,
  onPress,
}: {
  invoice: InvoiceItem;
  onPress?: () => void;
}) {
  const theme = useTheme();

  const date = new Date(invoice.createdAt).toLocaleDateString();
  const isDraft = invoice.status === 'DRAFT';

  return (
    <Pressable
      onPress={isDraft ? onPress : undefined}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        pressed && isDraft && { opacity: 0.7 },
      ]}
    >
      <View style={styles.rowMain}>
        <ThemedText type="default" style={styles.clientName}>
          {invoice.clientSnapshot?.name ?? 'No Client'}
        </ThemedText>
        <ThemedText type="default" style={styles.amount}>
          {formatMoney(invoice.total)}
        </ThemedText>
      </View>
      <View style={styles.rowSub}>
        <StatusBadge status={invoice.status} />
        <ThemedText type="small" themeColor="textSecondary">
          {date}
        </ThemedText>
      </View>
    </Pressable>
  );
}

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
  row: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  rowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  clientName: {
    flex: 1,
  },
  amount: {
    fontWeight: '600',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});
