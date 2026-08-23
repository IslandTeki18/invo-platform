import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ManualPaymentMethod } from '@repo/types';
import { formatMoney } from '@repo/utils';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { FormButton, FormField, FormSegment } from '@/components/form';

const METHOD_OPTIONS = [
  { label: 'Cash', value: ManualPaymentMethod.CASH },
  { label: 'Check', value: ManualPaymentMethod.CHECK },
  { label: 'Other', value: ManualPaymentMethod.OTHER },
];

export type MarkPaidSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (input: {
    method: ManualPaymentMethod;
    reference?: string;
  }) => void;
  isSubmitting: boolean;
  total: number;
};

export function MarkPaidSheet({
  visible,
  onClose,
  onConfirm,
  isSubmitting,
  total,
}: MarkPaidSheetProps) {
  const [method, setMethod] = useState<ManualPaymentMethod>(
    ManualPaymentMethod.CASH,
  );
  const [reference, setReference] = useState('');

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Mark as Paid">
      <View style={styles.content}>
        <ThemedText>
          Record a payment of {formatMoney(total)} received outside Stripe.
        </ThemedText>

        <FormSegment
          options={METHOD_OPTIONS}
          selected={method}
          onSelect={(value) => setMethod(value as ManualPaymentMethod)}
        />

        <FormField
          label="Reference (optional)"
          value={reference}
          onChangeText={setReference}
          placeholder="Check number, receipt, etc."
        />

        <ThemedText type="small" themeColor="textSecondary">
          This marks the invoice as paid. It cannot be undone.
        </ThemedText>

        <View style={styles.buttonRow}>
          <View style={styles.buttonFlex}>
            <FormButton
              label="Cancel"
              onPress={onClose}
              variant="secondary"
              disabled={isSubmitting}
            />
          </View>
          <View style={styles.buttonFlex}>
            <FormButton
              label="Confirm Paid"
              onPress={() =>
                onConfirm({
                  method,
                  reference: reference.trim() || undefined,
                })
              }
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buttonFlex: {
    flex: 1,
  },
});
