import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';

export type ClientRowProps = {
  name: string;
  email: string;
  archived: boolean;
  onPress: () => void;
};

export function ClientRow({ name, email, archived, onPress }: ClientRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border },
        pressed && { backgroundColor: theme.backgroundElement },
      ]}
    >
      <View style={styles.body}>
        <ThemedText style={styles.name}>{name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {email}
        </ThemedText>
      </View>
      {archived ? (
        <ThemedText type="small" themeColor="textSecondary" style={[styles.badge, { borderColor: theme.border }]}>
          Archived
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  body: { flex: 1, gap: Spacing.half },
  name: { fontWeight: '500' },
  badge: {
    fontSize: 11,
    lineHeight: 16,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: Spacing.one,
  },
});
