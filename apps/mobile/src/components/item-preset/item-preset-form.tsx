import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { centsToDollars, dollarsToCents, itemPresetSchema } from '@repo/utils';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { FormButton, FormField, FormSwitch } from '@/components/form';

export type ItemPresetFormValues = {
  name: string;
  description: string;
  defaultPrice: number;
  taxable: boolean;
};

export type ItemPresetFormProps = {
  initialValues?: Partial<ItemPresetFormValues>;
  submitLabel: string;
  onSubmit: (values: ItemPresetFormValues) => Promise<void>;
  footer?: React.ReactNode;
};

export function ItemPresetForm({ initialValues, submitLabel, onSubmit, footer }: ItemPresetFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [price, setPrice] = useState(
    initialValues?.defaultPrice === undefined ? '' : String(centsToDollars(initialValues.defaultPrice)),
  );
  const [taxable, setTaxable] = useState(initialValues?.taxable ?? true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const values: ItemPresetFormValues = {
      name: name.trim(),
      description: description.trim(),
      defaultPrice: dollarsToCents(parseFloat(price) || 0),
      taxable,
    };
    const parsed = itemPresetSchema.safeParse(values);
    if (!parsed.success) {
      setError(values.name ? 'Price must be a non-negative amount.' : 'Name is required.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.three }]}
      keyboardShouldPersistTaps="handled"
    >
      <FormField label="Name" value={name} onChangeText={setName} />
      <FormField label="Description" value={description} onChangeText={setDescription} multiline />
      <FormField
        label="Default price"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      <FormSwitch label="Taxable" value={taxable} onValueChange={setTaxable} />
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
