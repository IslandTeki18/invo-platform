import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { formatMoney } from '@repo/utils';

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
  const theme = useTheme();
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
            <Pressable
              onPress={() => handleSelect(item)}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: theme.backgroundElement },
              ]}
            >
              <View style={styles.rowLeft}>
                <ThemedText type="default" style={styles.presetName}>
                  {item.name}
                </ThemedText>
                {item.description ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
                    {item.description}
                  </ThemedText>
                ) : null}
              </View>
              <View style={styles.rowRight}>
                <ThemedText type="small" style={styles.price}>
                  {formatMoney(item.defaultPrice)}
                </ThemedText>
                {item.taxable ? (
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={[styles.taxBadge, { borderColor: theme.border }]}
                  >
                    Taxable
                  </ThemedText>
                ) : null}
              </View>
            </Pressable>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    gap: Spacing.two,
  },
  rowLeft: {
    flex: 1,
    gap: Spacing.half,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  presetName: {
    fontWeight: '500',
  },
  description: {
    flexShrink: 1,
  },
  price: {
    fontWeight: '600',
  },
  taxBadge: {
    fontSize: 11,
    lineHeight: 16,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: Spacing.one,
  },
});
