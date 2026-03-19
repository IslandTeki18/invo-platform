import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { FormButton } from '@/components/form';
import { EmptyState } from '@/components/ui/empty-state';
import { DraftLineItem, LineItemCard } from './line-item-card';

export type LineItemListProps = {
  items: DraftLineItem[];
  onUpdate: (localId: string, field: string, value: string | boolean) => void;
  onRemove: (localId: string) => void;
  onAdd: () => void;
  onOpenPresetPicker: () => void;
  errors?: Record<string, string>;
};

export function LineItemList({
  items,
  onUpdate,
  onRemove,
  onAdd,
  onOpenPresetPicker,
  errors,
}: LineItemListProps) {
  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <EmptyState
          message="Add your first line item"
          actionLabel="Add Line Item"
          onAction={onAdd}
        />
      ) : (
        <>
          {items.map((item) => (
            <LineItemCard
              key={item.localId}
              item={item}
              onUpdate={onUpdate}
              onRemove={onRemove}
              errors={errors}
            />
          ))}

          <View style={styles.actions}>
            <FormButton label="Add Line Item" onPress={onAdd} variant="secondary" />
            <FormButton label="From Preset" onPress={onOpenPresetPicker} variant="secondary" />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  actions: {
    gap: Spacing.two,
  },
});
