import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Discount } from '@repo/types';
import { formatMoney, applyDiscount } from '@repo/utils';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { StatusBadge } from '@/components/invoice/status-badge';
import { TotalsSection } from '@/components/invoice/totals-section';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvoiceLineItem = {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
  total: number;
};

type InvoiceExpense = {
  id: string;
  description: string;
  amount: number;
  category?: string;
};

type InvoiceDetailProps = {
  invoice: {
    _id: string;
    status: string;
    clientSnapshot?: { name: string; email: string; phone?: string | null };
    lineItems: InvoiceLineItem[];
    expenses: InvoiceExpense[];
    subtotal: number;
    discount?: Discount | null;
    tax?: { rate: number; amount: number; taxableSubtotal: number };
    total: number;
    dueDate?: number;
    sentAt?: number;
    paidAt?: number;
    createdAt: number;
  };
  onBack: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceDetail({ invoice, onBack }: InvoiceDetailProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const discountedSubtotal = applyDiscount(
    invoice.subtotal,
    invoice.discount ?? null,
  );

  return (
    <ThemedView style={styles.root}>
      {/* Header */}
      <ThemedView
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.two,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
            <ThemedText type="default" themeColor="accent">
              ←
            </ThemedText>
          </Pressable>

          <ThemedText type="default" style={styles.headerTitle} numberOfLines={1}>
            Invoice
          </ThemedText>

          <View style={styles.headerRight}>
            <StatusBadge status={invoice.status} />
          </View>
        </View>
      </ThemedView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + Spacing.three },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Card */}
        <ThemedView type="backgroundElement" style={styles.card}>
          {invoice.clientSnapshot ? (
            <>
              <ThemedText type="default" style={styles.clientName}>
                {invoice.clientSnapshot.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {invoice.clientSnapshot.email}
              </ThemedText>
              {invoice.clientSnapshot.phone ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {invoice.clientSnapshot.phone}
                </ThemedText>
              ) : null}
            </>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              No client information
            </ThemedText>
          )}
        </ThemedView>

        {/* Line Items */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          LINE ITEMS
        </ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          {invoice.lineItems.map((item, index) => (
            <View key={item.id}>
              {index > 0 && (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              )}
              <View style={styles.lineItemRow}>
                <View style={styles.lineItemLeft}>
                  <ThemedText type="small" style={styles.lineItemName}>
                    {item.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.quantity} × {formatMoney(item.unitPrice)}
                  </ThemedText>
                  {item.taxable ? (
                    <ThemedText type="small" themeColor="accent" style={styles.taxableBadge}>
                      Taxable
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText type="small" style={styles.lineItemTotal}>
                  {formatMoney(item.total)}
                </ThemedText>
              </View>
            </View>
          ))}
        </ThemedView>

        {/* Expenses */}
        {invoice.expenses.length > 0 ? (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              EXPENSES
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.card}>
              {invoice.expenses.map((expense, index) => (
                <View key={expense.id}>
                  {index > 0 && (
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  )}
                  <View style={styles.expenseRow}>
                    <ThemedText type="small" style={styles.expenseDescription}>
                      {expense.description}
                    </ThemedText>
                    <ThemedText type="small">
                      {formatMoney(expense.amount)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </ThemedView>
          </>
        ) : null}

        {/* Totals */}
        <TotalsSection
          totals={{
            subtotal: invoice.subtotal,
            discountedSubtotal,
            tax: { amount: invoice.tax?.amount ?? 0 },
            total: invoice.total,
          }}
        />

        {/* Dates */}
        <ThemedView type="backgroundElement" style={[styles.card, styles.datesCard]}>
          <View style={styles.dateRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Created
            </ThemedText>
            <ThemedText type="small">
              {new Date(invoice.createdAt).toLocaleDateString()}
            </ThemedText>
          </View>

          <View style={styles.dateRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Due
            </ThemedText>
            <ThemedText type="small">
              {invoice.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString()
                : 'None'}
            </ThemedText>
          </View>

          {invoice.sentAt != null ? (
            <View style={styles.dateRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Sent
              </ThemedText>
              <ThemedText type="small">
                {new Date(invoice.sentAt).toLocaleDateString()}
              </ThemedText>
            </View>
          ) : null}

          {invoice.paidAt != null ? (
            <View style={styles.dateRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Paid
              </ThemedText>
              <ThemedText type="small">
                {new Date(invoice.paidAt).toLocaleDateString()}
              </ThemedText>
            </View>
          ) : null}
        </ThemedView>
      </ScrollView>
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
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backButton: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    borderRadius: 12,
    padding: Spacing.three,
  },
  clientName: {
    fontWeight: '600',
    marginBottom: Spacing.half,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: -Spacing.two,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  lineItemLeft: {
    flex: 1,
    gap: Spacing.half,
    paddingRight: Spacing.two,
  },
  lineItemName: {
    fontWeight: '600',
  },
  lineItemTotal: {
    fontWeight: '600',
  },
  taxableBadge: {
    fontSize: 11,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  expenseDescription: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  datesCard: {
    gap: Spacing.two,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});
