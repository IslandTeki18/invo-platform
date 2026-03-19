import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { FormField, FormSegment, FormSwitch } from '@/components/form';

export type DiscountSectionProps = {
  discountEnabled: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  onToggle: () => void;
  onTypeChange: (type: 'percentage' | 'fixed') => void;
  onValueChange: (value: string) => void;
};

const DISCOUNT_TYPE_OPTIONS = [
  { label: 'Percentage', value: 'percentage' },
  { label: 'Fixed ($)', value: 'fixed' },
] as const;

export function DiscountSection({
  discountEnabled,
  discountType,
  discountValue,
  onToggle,
  onTypeChange,
  onValueChange,
}: DiscountSectionProps) {
  const fieldLabel = discountType === 'percentage' ? 'Discount (%)' : 'Discount ($)';

  return (
    <View style={styles.container}>
      <FormSwitch label="Discount" value={discountEnabled} onValueChange={onToggle} />

      {discountEnabled && (
        <View style={styles.fields}>
          <FormSegment
            options={DISCOUNT_TYPE_OPTIONS as unknown as { label: string; value: string }[]}
            selected={discountType}
            onSelect={(value) => onTypeChange(value as 'percentage' | 'fixed')}
          />
          <FormField
            label={fieldLabel}
            value={discountValue}
            onChangeText={onValueChange}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  fields: {
    gap: Spacing.two,
  },
});
