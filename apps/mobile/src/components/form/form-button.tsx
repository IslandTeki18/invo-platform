import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type FormButtonVariant = 'primary' | 'secondary' | 'destructive';

export type FormButtonProps = {
  label: string;
  onPress: () => void;
  variant?: FormButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

export function FormButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: FormButtonProps) {
  const theme = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? theme.accent
      : variant === 'destructive'
        ? theme.destructive
        : theme.backgroundElement;

  const textColor = variant === 'secondary' ? theme.text : '#ffffff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor },
        (disabled || loading) && styles.disabledOpacity,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  disabledOpacity: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
});
