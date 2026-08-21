import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { OrganizationRole } from '@repo/types';
import { businessAddressSchema } from '@repo/utils';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { FormButton, FormField } from '@/components/form';

type Org = NonNullable<ReturnType<typeof useCurrentOrg>['currentOrg']>;

const ADDRESS_FIELDS = [
  ['street', 'Street'],
  ['city', 'City'],
  ['state', 'State'],
  ['postalCode', 'Postal code'],
  ['country', 'Country'],
] as const;

type AddressKey = (typeof ADDRESS_FIELDS)[number][0];

export default function BusinessInfoScreen() {
  const router = useRouter();
  const { currentOrg, isLoading } = useCurrentOrg();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!currentOrg) return <EmptyState message="Select an organization first" />;
  // Keyed by org so the form state resets if the selected org changes.
  return <BusinessInfoForm key={currentOrg._id} org={currentOrg} onDone={router.back} />;
}

function BusinessInfoForm({ org, onDone }: { org: Org; onDone: () => void }) {
  const update = useMutation(api.organizations.update);
  const canEdit = org.role === OrganizationRole.OWNER || org.role === OrganizationRole.ADMIN;

  const [name, setName] = useState(org.name);
  const [address, setAddress] = useState<Record<AddressKey, string>>({
    street: org.businessAddress?.street ?? '',
    city: org.businessAddress?.city ?? '',
    state: org.businessAddress?.state ?? '',
    postalCode: org.businessAddress?.postalCode ?? '',
    country: org.businessAddress?.country ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Organization name is required.');
      return;
    }
    const trimmed = Object.fromEntries(
      ADDRESS_FIELDS.map(([key]) => [key, address[key].trim()]),
    ) as Record<AddressKey, string>;
    if (!businessAddressSchema.safeParse(trimmed).success) {
      setError('All address fields are required.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await update({
        orgId: org._id as Id<'organizations'>,
        name: trimmedName,
        businessAddress: trimmed,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.root}>
      <ScreenHeader title="Business Info" onBack={onDone} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.three }]}
        keyboardShouldPersistTaps="handled"
      >
        {!canEdit ? (
          <ThemedText type="small" themeColor="textSecondary">
            Only owners and admins can edit business information.
          </ThemedText>
        ) : null}
        <FormField label="Organization name" value={name} onChangeText={setName} editable={canEdit} />
        {ADDRESS_FIELDS.map(([key, label]) => (
          <FormField
            key={key}
            label={label}
            value={address[key]}
            onChangeText={(text) => setAddress((prev) => ({ ...prev, [key]: text }))}
            editable={canEdit}
          />
        ))}
        {error ? <ThemedText themeColor="destructive">{error}</ThemedText> : null}
        {canEdit ? <FormButton label="Save" onPress={handleSave} loading={saving} /> : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
});
