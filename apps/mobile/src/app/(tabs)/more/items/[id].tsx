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
import { ItemPresetForm } from '@/components/item-preset/item-preset-form';

export default function EditItemPresetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const presetId = id as Id<'itemPresets'>;

  const preset = useQuery(api.itemPresets.get, { presetId });
  const update = useMutation(api.itemPresets.update);
  const remove = useMutation(api.itemPresets.remove);

  function confirmDelete() {
    Alert.alert('Delete item?', 'Existing invoices are not affected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove({ presetId })
            .then(() => router.back())
            .catch((err) => Alert.alert('Error', err.message)),
      },
    ]);
  }

  return (
    <ThemedView style={styles.root}>
      <ScreenHeader title="Edit Item" onBack={router.back} />
      {preset === undefined ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : preset === null ? (
        <EmptyState message="Item not found" />
      ) : (
        <ItemPresetForm
          key={preset._id}
          initialValues={{
            name: preset.name,
            description: preset.description ?? '',
            defaultPrice: preset.defaultPrice,
            taxable: preset.taxable,
          }}
          submitLabel="Save"
          onSubmit={async (values) => {
            await update({
              presetId,
              name: values.name,
              description: values.description || null,
              defaultPrice: values.defaultPrice,
              taxable: values.taxable,
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
