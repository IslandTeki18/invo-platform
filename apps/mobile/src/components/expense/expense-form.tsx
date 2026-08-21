import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { centsToDollars, dollarsToCents, expenseSchema } from '@repo/utils';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { FormButton, FormField } from '@/components/form';

export type ExpenseFormValues = {
  description: string;
  amount: number;
  category: string;
};

export type ExpenseFormProps = {
  initialValues?: Partial<ExpenseFormValues>;
  submitLabel: string;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  footer?: React.ReactNode;
};

export function ExpenseForm({ initialValues, submitLabel, onSubmit, footer }: ExpenseFormProps) {
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [amount, setAmount] = useState(
    initialValues?.amount === undefined ? '' : String(centsToDollars(initialValues.amount)),
  );
  const [category, setCategory] = useState(initialValues?.category ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const values: ExpenseFormValues = {
      description: description.trim(),
      amount: dollarsToCents(parseFloat(amount) || 0),
      category: category.trim(),
    };
    if (!expenseSchema.safeParse(values).success) {
      setError(values.description ? 'Amount must be greater than zero.' : 'Description is required.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.three }]}
      keyboardShouldPersistTaps="handled"
    >
      <FormField label="Description" value={description} onChangeText={setDescription} />
      <FormField
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      <FormField label="Category" value={category} onChangeText={setCategory} />
      {error ? <ThemedText themeColor="destructive">{error}</ThemedText> : null}
      <FormButton label={submitLabel} onPress={handleSubmit} loading={saving} />
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
});
