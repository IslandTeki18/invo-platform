import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';

export type ClientSectionProps = {
  clientName: string | null;
  clientEmail: string | null;
  onOpenPicker: () => void;
  onClear: () => void;
  error?: string;
};

export function ClientSection({
  clientName,
  clientEmail,
  onOpenPicker,
  onClear,
  error,
}: ClientSectionProps) {
  const theme = useTheme();
  const hasClient = clientName !== null && clientEmail !== null;

  return (
    <View style={styles.container}>
      {hasClient ? (
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.clientInfo}>
              <ThemedText type="default" style={styles.clientName}>
                {clientName}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {clientEmail}
              </ThemedText>
            </View>
            <Pressable onPress={onClear} hitSlop={8}>
              <ThemedText type="small" themeColor="destructive">
                Clear
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      ) : (
        <Pressable onPress={onOpenPicker}>
          <ThemedView
            type="backgroundElement"
            style={[styles.placeholder, { borderColor: error ? theme.destructive : theme.border }]}
          >
            <ThemedText type="default" themeColor="textSecondary">
              Select Client
            </ThemedText>
          </ThemedView>
        </Pressable>
      )}

      {error ? (
        <ThemedText type="small" themeColor="destructive" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  card: {
    borderRadius: 8,
    padding: Spacing.three,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  clientName: {
    fontWeight: '600',
  },
  placeholder: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
  },
  errorText: {
    marginTop: Spacing.one,
  },
});
