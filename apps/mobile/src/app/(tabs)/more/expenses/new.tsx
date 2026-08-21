import React from 'react';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ExpenseForm } from '@/components/expense/expense-form';

export default function NewExpenseScreen() {
  const router = useRouter();
  const { currentOrg } = useCurrentOrg();
  const create = useMutation(api.expenses.create);

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScreenHeader title="New Expense" onBack={router.back} />
      {!currentOrg ? (
        <EmptyState message="Select an organization first" />
      ) : (
        <ExpenseForm
          submitLabel="Create Expense"
          onSubmit={async (values) => {
            await create({
              orgId: currentOrg._id as Id<'organizations'>,
              description: values.description,
              amount: values.amount,
              category: values.category || undefined,
            });
            router.back();
          }}
        />
      )}
    </ThemedView>
  );
}
