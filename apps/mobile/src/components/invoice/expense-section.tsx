import { Pressable, StyleSheet, View } from 'react-native';

import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { FormButton } from '@/components/form';
import { formatMoney } from '@repo/utils';

export type ExpenseSectionProps = {
  expenseIds: string[];
  orgId: string;
  onOpenPicker: () => void;
  onRemove: (id: string) => void;
};

export function ExpenseSection({
  expenseIds,
  orgId,
  onOpenPicker,
  onRemove,
}: ExpenseSectionProps) {
  const theme = useTheme();

  const allExpenses = useQuery(api.expenses.listByOrg, {
    orgId: orgId as Id<'organizations'>,
  });

  const attachedExpenses = (allExpenses ?? []).filter((expense) =>
    expenseIds.includes(expense._id)
  );

  return (
    <View style={styles.container}>
      {attachedExpenses.length > 0 && (
        <ThemedView type="backgroundElement" style={styles.list}>
          {attachedExpenses.map((expense, index) => (
            <View
              key={expense._id}
              style={[
                styles.row,
                index < attachedExpenses.length - 1 && {
                  borderBottomColor: theme.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View style={styles.rowInfo}>
                <ThemedText type="default" style={styles.description}>
                  {expense.description}
                </ThemedText>
                {expense.category ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {expense.category}
                  </ThemedText>
                ) : null}
              </View>
              <View style={styles.rowRight}>
                <ThemedText type="small" style={styles.amount}>
                  {formatMoney(expense.amount)}
                </ThemedText>
                <Pressable onPress={() => onRemove(expense._id)} hitSlop={8}>
                  <ThemedText type="small" themeColor="destructive">
                    Remove
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ))}
        </ThemedView>
      )}

      <FormButton label="Attach Expenses" onPress={onOpenPicker} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  list: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  rowInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  description: {
    fontWeight: '500',
    flexShrink: 1,
  },
  amount: {
    fontWeight: '600',
  },
});
