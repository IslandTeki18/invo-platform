import React, { useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { formatMoney } from '@repo/utils';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { FormButton, FormField } from '@/components/form';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { InvoiceRow, type InvoiceItem } from '@/components/invoice/invoice-row';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Org context
  const { currentOrg, isLoading: orgLoading } = useCurrentOrg();

  // Dashboard data
  const summary = useQuery(
    api.invoices.getDashboardSummary,
    currentOrg ? { orgId: currentOrg._id as Id<'organizations'> } : 'skip',
  );

  // Client quick-create sheet state
  const [showClientSheet, setShowClientSheet] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientError, setClientError] = useState('');
  const [clientSaving, setClientSaving] = useState(false);
  const createClient = useMutation(api.clients.create);

  const closeSheet = useCallback(() => {
    setShowClientSheet(false);
    setClientName('');
    setClientEmail('');
    setClientError('');
  }, []);

  const handleCreateClient = useCallback(async () => {
    if (!clientName.trim()) {
      setClientError('Name is required.');
      return;
    }
    if (!clientEmail.trim()) {
      setClientError('Email is required.');
      return;
    }
    if (!currentOrg) return;

    setClientError('');
    setClientSaving(true);
    try {
      await createClient({
        orgId: currentOrg._id as Id<'organizations'>,
        name: clientName.trim(),
        email: clientEmail.trim(),
      });
      closeSheet();
    } catch (err) {
      setClientError(err instanceof Error ? err.message : 'Failed to create client.');
    } finally {
      setClientSaving(false);
    }
  }, [clientName, clientEmail, currentOrg, createClient, closeSheet]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (orgLoading || (currentOrg && summary === undefined)) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  // ---------------------------------------------------------------------------
  // No org state
  // ---------------------------------------------------------------------------

  if (!currentOrg) {
    return (
      <ThemedView style={styles.centered}>
        <EmptyState message="Select an organization" />
      </ThemedView>
    );
  }

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + Spacing.three },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + Spacing.three,
            paddingHorizontal: Spacing.three,
            paddingBottom: Spacing.three,
          }}
        >
          <ThemedText type="subtitle">Dashboard</ThemedText>
        </View>

        {/* Metric cards */}
        <View style={styles.metricsRow}>
          <ThemedView type="backgroundElement" style={styles.metricCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Unpaid Amount
            </ThemedText>
            <ThemedText type="subtitle">
              {formatMoney(summary?.unpaidTotal ?? 0)}
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.metricCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Unpaid Invoices
            </ThemedText>
            <ThemedText type="subtitle">
              {String(summary?.unpaidCount ?? 0)}
            </ThemedText>
          </ThemedView>
        </View>

        {/* Recent invoices */}
        <View style={styles.section}>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.sectionLabel}
          >
            RECENT INVOICES
          </ThemedText>

          {summary && summary.recentInvoices.length > 0 ? (
            summary.recentInvoices.map((item: InvoiceItem) => (
              <InvoiceRow
                key={item._id}
                invoice={item}
                onPress={() => router.push(`/invoices/${item._id}`)}
              />
            ))
          ) : (
            <ThemedText themeColor="textSecondary">No invoices yet</ThemedText>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.sectionLabel}
          >
            QUICK ACTIONS
          </ThemedText>

          <View style={styles.actionsStack}>
            <FormButton
              label="New Invoice"
              variant="primary"
              onPress={() => router.push('/invoices/new')}
            />
            <FormButton
              label="Add Client"
              variant="secondary"
              onPress={() => setShowClientSheet(true)}
            />
          </View>
        </View>
      </ScrollView>

      {/* Client quick-create bottom sheet */}
      <BottomSheet
        visible={showClientSheet}
        onClose={closeSheet}
        title="Add Client"
      >
        <View style={{ paddingHorizontal: Spacing.three, gap: Spacing.two }}>
          <FormField
            label="Name"
            value={clientName}
            onChangeText={setClientName}
          />
          <FormField
            label="Email"
            value={clientEmail}
            onChangeText={setClientEmail}
            keyboardType="email-address"
          />
          {clientError ? (
            <ThemedText themeColor="destructive">{clientError}</ThemedText>
          ) : null}
          <FormButton
            label="Create Client"
            onPress={handleCreateClient}
            loading={clientSaving}
          />
        </View>
      </BottomSheet>
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    gap: Spacing.three,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  section: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  sectionLabel: {
    letterSpacing: 0.8,
  },
  actionsStack: {
    gap: Spacing.two,
  },
});
