import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { formatMoney } from '@repo/utils';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { FormButton } from '@/components/form';

export default function ExpenseListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { currentOrg, isLoading } = useCurrentOrg();
  const expenses = useQuery(
    api.expenses.listByOrg,
    currentOrg ? { orgId: currentOrg._id as Id<'organizations'> } : 'skip',
  );
  const loading = isLoading || (currentOrg !== null && expenses === undefined);

  return (
    <ThemedView style={styles.root}>
      <ScreenHeader
        title="Expenses"
        onBack={router.back}
        right={<FormButton label="New" onPress={() => router.push('/more/expenses/new')} />}
      />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : !currentOrg ? (
        <EmptyState message="Select an organization to view expenses" />
      ) : !expenses || expenses.length === 0 ? (
        <EmptyState
          message="No expenses yet"
          actionLabel="New Expense"
          onAction={() => router.push('/more/expenses/new')}
        />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.three }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/more/expenses/${item._id}`)}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: theme.border },
                pressed && { backgroundColor: theme.backgroundElement },
              ]}
            >
              <View style={styles.rowBody}>
                <ThemedText style={styles.description}>{item.description}</ThemedText>
                {item.category ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.category}
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText type="small" style={styles.amount}>
                {formatMoney(item.amount)}
              </ThemedText>
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  rowBody: { flex: 1, gap: Spacing.half },
  description: { fontWeight: '500' },
  amount: { fontWeight: '600' },
});
