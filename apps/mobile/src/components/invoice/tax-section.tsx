import { FormField } from '@/components/form';

export type TaxSectionProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function TaxSection({ value, onChangeText }: TaxSectionProps) {
  return (
    <FormField
      label="Tax Rate (%)"
      value={value}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      placeholder="0"
    />
  );
}
