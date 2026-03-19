import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { FormButton } from '@/components/form';

export type ComposerFooterProps = {
  onSave: () => void;
  isSaving: boolean;
  errors: Record<string, string>;
  onSend?: () => void;
  isSendDisabled?: boolean;
};

export function ComposerFooter({ onSave, isSaving, errors, onSend, isSendDisabled }: ComposerFooterProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const errorCount = Object.keys(errors).length;
  const saveError = errors.save;

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + Spacing.three,
          borderTopColor: theme.border,
        },
      ]}
    >
      {saveError ? (
        <ThemedText type="small" themeColor="destructive" style={styles.errorText}>
          {saveError}
        </ThemedText>
      ) : errorCount > 0 ? (
        <ThemedText type="small" themeColor="destructive" style={styles.errorText}>
          {errorCount} {errorCount === 1 ? 'error' : 'errors'} to fix
        </ThemedText>
      ) : null}

      {onSend ? (
        <View style={styles.buttonRow}>
          <View style={styles.buttonFlex}>
            <FormButton
              label="Save Draft"
              onPress={onSave}
              variant="secondary"
              loading={isSaving}
              disabled={isSaving}
            />
          </View>
          <View style={styles.buttonFlex}>
            <FormButton
              label="Send Invoice"
              onPress={onSend}
              variant="primary"
              disabled={isSendDisabled || isSaving}
            />
          </View>
        </View>
      ) : (
        <FormButton
          label="Save Draft"
          onPress={onSave}
          variant="primary"
          loading={isSaving}
          disabled={isSaving}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  errorText: {
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buttonFlex: {
    flex: 1,
  },
});
