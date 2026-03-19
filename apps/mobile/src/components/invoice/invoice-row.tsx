import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatMoney } from '@repo/utils';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { StatusBadge } from './status-badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InvoiceItem = {
  _id: string;
  clientSnapshot?: { name: string; email: string; phone?: string };
  total: number;
  status: string;
  createdAt: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceRow({
  invoice,
  onPress,
}: {
  invoice: InvoiceItem;
  onPress?: () => void;
}) {
  const theme = useTheme();

  const date = new Date(invoice.createdAt).toLocaleDateString();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        pressed && onPress && { opacity: 0.7 },
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
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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
});
