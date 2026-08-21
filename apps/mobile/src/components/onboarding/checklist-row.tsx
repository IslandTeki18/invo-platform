import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';

export type ChecklistRowProps = {
  label: string;
  done: boolean;
  onPress?: () => void;
  hint?: string;
};

export function ChecklistRow({ label, done, onPress, hint }: ChecklistRowProps) {
  const theme = useTheme();
  const color = done ? theme.accent : theme.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border },
        pressed && { backgroundColor: theme.backgroundElement },
      ]}
    >
      <ThemedText style={[styles.indicator, { color }]}>{done ? '●' : '○'}</ThemedText>
      <View style={styles.body}>
        <ThemedText>{label}</ThemedText>
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        ) : null}
      </View>
      {onPress ? <ThemedText themeColor="textSecondary">›</ThemedText> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  indicator: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
});
