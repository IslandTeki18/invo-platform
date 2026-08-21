import { FlatList, StyleSheet, View } from 'react-native';

import { useQuery } from 'convex/react';
import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ItemPresetRow } from '@/components/item-preset/item-preset-row';

export type PresetPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (preset: {
    name: string;
    description?: string;
    defaultPrice: number;
    taxable: boolean;
  }) => void;
};

type ItemPreset = {
  _id: Id<'itemPresets'>;
  name: string;
  description?: string;
  defaultPrice: number;
  taxable: boolean;
};

export function PresetPicker({ visible, onClose, onSelect }: PresetPickerProps) {
  const presets = useQuery(api.itemPresets.list);

  function handleSelect(preset: ItemPreset) {
    onSelect({
      name: preset.name,
      description: preset.description,
      defaultPrice: preset.defaultPrice,
      taxable: preset.taxable,
    });
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Item Presets">
      {presets === undefined || presets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText themeColor="textSecondary">No presets available</ThemedText>
        </View>
      ) : (
        <FlatList<ItemPreset>
          data={presets}
          keyExtractor={(item) => item._id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ItemPresetRow
              name={item.name}
              description={item.description}
              defaultPrice={item.defaultPrice}
              taxable={item.taxable}
              onPress={() => handleSelect(item)}
            />
          )}
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
});
