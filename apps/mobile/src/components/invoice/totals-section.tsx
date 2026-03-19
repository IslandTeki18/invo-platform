import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { formatMoney } from '@repo/utils';

export type TotalsSectionProps = {
  totals: {
    subtotal: number;
    discountedSubtotal: number;
    tax: { amount: number };
    total: number;
  };
};

export function TotalsSection({ totals }: TotalsSectionProps) {
  const theme = useTheme();
  const hasDiscount = totals.discountedSubtotal !== totals.subtotal;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.row}>
        <ThemedText type="small" themeColor="textSecondary">
          Subtotal
        </ThemedText>
        <ThemedText type="small">{formatMoney(totals.subtotal)}</ThemedText>
      </View>

      {hasDiscount && (
        <View style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary">
            Discount
          </ThemedText>
          <ThemedText type="small" themeColor="destructive">
            -{formatMoney(totals.subtotal - totals.discountedSubtotal)}
          </ThemedText>
        </View>
      )}

      <View style={styles.row}>
        <ThemedText type="small" themeColor="textSecondary">
          Tax
        </ThemedText>
        <ThemedText type="small">{formatMoney(totals.tax.amount)}</ThemedText>
      </View>

      <View style={[styles.row, styles.totalRow, { borderTopColor: theme.border }]}>
        <ThemedText type="default" style={styles.totalLabel}>
          Total
        </ThemedText>
        <ThemedText type="smallBold" style={styles.totalAmount}>
          {formatMoney(totals.total)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  totalRow: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: {
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
});
