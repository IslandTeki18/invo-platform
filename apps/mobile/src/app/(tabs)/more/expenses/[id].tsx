import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { FormButton } from '@/components/form';
import { ExpenseForm } from '@/components/expense/expense-form';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const expenseId = id as Id<'expenses'>;

  const expense = useQuery(api.expenses.get, { expenseId });
  const update = useMutation(api.expenses.update);
  const remove = useMutation(api.expenses.remove);

  function confirmDelete() {
    Alert.alert('Delete expense?', 'Invoices that already include it keep their copy.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove({ expenseId })
            .then(() => router.back())
            .catch((err) => Alert.alert('Error', err.message)),
      },
    ]);
  }

  return (
    <ThemedView style={styles.root}>
      <ScreenHeader title="Edit Expense" onBack={router.back} />
      {expense === undefined ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : expense === null ? (
        <EmptyState message="Expense not found" />
      ) : (
        <ExpenseForm
          key={expense._id}
          initialValues={{
            description: expense.description,
            amount: expense.amount,
            category: expense.category ?? '',
          }}
          submitLabel="Save"
          onSubmit={async (values) => {
            await update({
              expenseId,
              description: values.description,
              amount: values.amount,
              category: values.category || null,
            });
            router.back();
          }}
          footer={<FormButton label="Delete" variant="destructive" onPress={confirmDelete} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
