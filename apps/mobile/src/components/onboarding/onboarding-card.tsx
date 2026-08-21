import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';

export function OnboardingCard() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push('/more/setup')}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.accent },
        pressed && { opacity: 0.7 },
      ]}
    >
      <ThemedText style={styles.title}>Finish setup to send invoices</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Add your business address and connect Stripe payouts.
      </ThemedText>
      <ThemedText type="small" themeColor="accent">
        Open setup ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontWeight: '600',
  },
});
