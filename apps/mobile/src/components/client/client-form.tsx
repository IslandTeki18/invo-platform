import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { FormButton, FormField } from '@/components/form';

export type ClientFormValues = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

export type ClientFormProps = {
  initialValues?: Partial<ClientFormValues>;
  submitLabel: string;
  onSubmit: (values: ClientFormValues) => Promise<void>;
  footer?: React.ReactNode;
};

export function ClientForm({ initialValues, submitLabel, onSubmit, footer }: ClientFormProps) {
  const [values, setValues] = useState<ClientFormValues>({
    name: initialValues?.name ?? '',
    email: initialValues?.email ?? '',
    phone: initialValues?.phone ?? '',
    notes: initialValues?.notes ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof ClientFormValues) => (text: string) =>
    setValues((prev) => ({ ...prev, [key]: text }));

  async function handleSubmit() {
    const trimmed = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      notes: values.notes.trim(),
    };
    if (!trimmed.name) return setError('Name is required.');
    if (!trimmed.email) return setError('Email is required.');

    setError('');
    setSaving(true);
    try {
      await onSubmit(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.three }]}
      keyboardShouldPersistTaps="handled"
    >
      <FormField label="Name" value={values.name} onChangeText={set('name')} />
      <FormField
        label="Email"
        value={values.email}
        onChangeText={set('email')}
        keyboardType="email-address"
      />
      <FormField
        label="Phone"
        value={values.phone}
        onChangeText={set('phone')}
        keyboardType="phone-pad"
      />
      <FormField label="Notes" value={values.notes} onChangeText={set('notes')} multiline />
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
