import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { FormField, FormSwitch, FormButton } from '@/components/form';
import { formatMoney, calculateLineItemTotal, dollarsToCents } from '@repo/utils';

export type DraftLineItem = {
  localId: string;
  name: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxable: boolean;
};

export type LineItemCardProps = {
  item: DraftLineItem;
  onUpdate: (localId: string, field: string, value: string | boolean) => void;
  onRemove: (localId: string) => void;
  errors?: Record<string, string>;
};

export function LineItemCard({ item, onUpdate, onRemove, errors }: LineItemCardProps) {
  const theme = useTheme();

  const quantityCents = parseFloat(item.quantity) || 0;
  const unitPriceCents = dollarsToCents(parseFloat(item.unitPrice) || 0);
  const lineTotal = formatMoney(calculateLineItemTotal(quantityCents, unitPriceCents));

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <FormField
        label="Name"
        value={item.name}
        onChangeText={(val) => onUpdate(item.localId, 'name', val)}
        error={errors?.[`lineItem_${item.localId}_name`]}
        placeholder="Item name"
      />

      <FormField
        label="Description"
        value={item.description}
        onChangeText={(val) => onUpdate(item.localId, 'description', val)}
        placeholder="Optional description"
        multiline
      />

      <View style={styles.row}>
        <View style={styles.rowField}>
          <FormField
            label="Quantity"
            value={item.quantity}
            onChangeText={(val) => onUpdate(item.localId, 'quantity', val)}
            error={errors?.[`lineItem_${item.localId}_quantity`]}
            placeholder="0"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.rowField}>
          <FormField
            label="Unit Price"
            value={item.unitPrice}
            onChangeText={(val) => onUpdate(item.localId, 'unitPrice', val)}
            error={errors?.[`lineItem_${item.localId}_unitPrice`]}
            placeholder="$0.00"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <FormSwitch
        label="Taxable"
        value={item.taxable}
        onValueChange={(val) => onUpdate(item.localId, 'taxable', val)}
      />

      <View style={styles.totalRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Line Total
        </ThemedText>
        <ThemedText type="smallBold">{lineTotal}</ThemedText>
      </View>

      <FormButton
        label="Remove"
        onPress={() => onRemove(item.localId)}
        variant="destructive"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rowField: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
});
