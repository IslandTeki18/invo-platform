import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { FormButton } from '@/components/form';

export type EmptyStateProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  const hasAction = actionLabel !== undefined && onAction !== undefined;

  return (
    <View style={styles.container}>
      <ThemedText themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>

      {hasAction && (
        <View style={styles.buttonContainer}>
          <FormButton label={actionLabel} onPress={onAction} variant="primary" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  message: {
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: Spacing.three,
    alignSelf: 'stretch',
  },
});
