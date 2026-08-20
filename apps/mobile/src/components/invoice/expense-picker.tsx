import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useQuery } from 'convex/react';
import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { FormButton } from '@/components/form';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { formatMoney } from '@repo/utils';

export type ExpensePickerProps = {
  visible: boolean;
  onClose: () => void;
  orgId: string;
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
};

export function ExpensePicker({
  visible,
  onClose,
  orgId,
  selectedIds,
  onConfirm,
}: ExpensePickerProps) {
  const theme = useTheme();

  const expenses = useQuery(api.expenses.listByOrg, {
    orgId: orgId as Id<'organizations'>,
  });

  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);

  // Sync local state when the sheet opens with new selectedIds
  // (controlled by re-mounting or parent passing updated selectedIds)

  function toggleExpense(id: string) {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleConfirm() {
    onConfirm(localSelected);
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Attach Expenses">
      {expenses === undefined || expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText themeColor="textSecondary">No expenses available</ThemedText>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {expenses.map((expense, index) => {
              const isChecked = localSelected.includes(expense._id);

              return (
                <Pressable
                  key={expense._id}
                  onPress={() => toggleExpense(expense._id)}
                  style={({ pressed }) => [
                    styles.row,
                    index < expenses.length - 1 && {
                      borderBottomColor: theme.border,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                    pressed && { backgroundColor: theme.backgroundElement },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isChecked ? theme.accent : theme.border,
                        backgroundColor: isChecked ? theme.accent : 'transparent',
                      },
                    ]}
                  >
                    {isChecked && (
                      <ThemedText style={styles.checkmark}>✓</ThemedText>
                    )}
                  </View>

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

                  <ThemedText type="small" style={styles.amount}>
                    {formatMoney(expense.amount)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <FormButton label="Confirm" onPress={handleConfirm} />
          </View>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  list: {
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    gap: Spacing.three,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 13,
    lineHeight: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  rowInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  description: {
    fontWeight: '500',
    flexShrink: 1,
  },
  amount: {
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
