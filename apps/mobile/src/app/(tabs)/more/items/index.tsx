import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { FormButton } from '@/components/form';
import { ItemPresetRow } from '@/components/item-preset/item-preset-row';

export default function ItemPresetListScreen() {
  const router = useRouter();
  const presets = useQuery(api.itemPresets.list);

  return (
    <ThemedView style={styles.root}>
      <ScreenHeader
        title="Items"
        onBack={router.back}
        right={<FormButton label="New" onPress={() => router.push('/more/items/new')} />}
      />
      {presets === undefined ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : presets.length === 0 ? (
        <EmptyState
          message="No items yet"
          actionLabel="New Item"
          onAction={() => router.push('/more/items/new')}
        />
      ) : (
        <FlatList
          data={presets}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.three }}
          renderItem={({ item }) => (
            <ItemPresetRow
              name={item.name}
              description={item.description}
              defaultPrice={item.defaultPrice}
              taxable={item.taxable}
              onPress={() => router.push(`/more/items/${item._id}`)}
            />
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
