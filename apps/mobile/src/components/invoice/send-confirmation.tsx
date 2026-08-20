import { StyleSheet, View } from 'react-native';
import { formatMoney } from '@repo/utils';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { FormButton } from '@/components/form';

export type SendConfirmationProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSending: boolean;
  clientName: string;
  total: number;
};

export function SendConfirmation({
  visible,
  onClose,
  onConfirm,
  isSending,
  clientName,
  total,
}: SendConfirmationProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Send Invoice?">
      <View style={styles.content}>
        <ThemedText>
          Send invoice for {formatMoney(total)} to {clientName}?
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary">
          This will email the invoice to the client.
        </ThemedText>

        <View style={styles.buttonRow}>
          <View style={styles.buttonFlex}>
            <FormButton
              label="Cancel"
              onPress={onClose}
              variant="secondary"
              disabled={isSending}
            />
          </View>
          <View style={styles.buttonFlex}>
            <FormButton
              label="Send"
              onPress={onConfirm}
              variant="primary"
              loading={isSending}
              disabled={isSending}
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
