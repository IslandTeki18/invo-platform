import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';

export type ComposerHeaderProps = {
  title: string;
  onBack: () => void;
};

export function ComposerHeader({ title, onBack }: ComposerHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.two,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
          <ThemedText type="default" themeColor="accent">
            ←
          </ThemedText>
        </Pressable>

        <ThemedText type="default" style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>

        {/* Spacer to balance the back button and keep title centered */}
        <View style={styles.backButton} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backButton: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
});
