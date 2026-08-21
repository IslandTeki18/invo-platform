import { Pressable, StyleSheet, View } from 'react-native';

import { formatMoney } from '@repo/utils';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';

export type ItemPresetRowProps = {
  name: string;
  description?: string;
  defaultPrice: number;
  taxable: boolean;
  onPress: () => void;
};

export function ItemPresetRow({ name, description, defaultPrice, taxable, onPress }: ItemPresetRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundElement }]}
    >
      <View style={styles.rowLeft}>
        <ThemedText type="default" style={styles.presetName}>
          {name}
        </ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.rowRight}>
        <ThemedText type="small" style={styles.price}>
          {formatMoney(defaultPrice)}
        </ThemedText>
        {taxable ? (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={[styles.taxBadge, { borderColor: theme.border }]}
          >
            Taxable
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    gap: Spacing.two,
  },
  rowLeft: {
    flex: 1,
    gap: Spacing.half,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  presetName: {
    fontWeight: '500',
  },
  description: {
    flexShrink: 1,
  },
  price: {
    fontWeight: '600',
  },
  taxBadge: {
    fontSize: 11,
    lineHeight: 16,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: Spacing.one,
  },
});
