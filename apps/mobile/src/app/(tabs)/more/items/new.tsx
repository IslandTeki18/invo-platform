import React from 'react';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import { ThemedView } from '@/components/primitives/themed-view';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ItemPresetForm } from '@/components/item-preset/item-preset-form';

export default function NewItemPresetScreen() {
  const router = useRouter();
  const create = useMutation(api.itemPresets.create);

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScreenHeader title="New Item" onBack={router.back} />
      <ItemPresetForm
        submitLabel="Create Item"
        onSubmit={async (values) => {
          await create({
            name: values.name,
            description: values.description || undefined,
            defaultPrice: values.defaultPrice,
            taxable: values.taxable,
          });
          router.back();
        }}
      />
    </ThemedView>
  );
}
