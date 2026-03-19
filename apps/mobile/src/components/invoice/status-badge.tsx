import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { InvoiceStatus } from '@repo/types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatusBadge({ status }: { status: string }) {
  const theme = useTheme();

  const badgeColor = useMemo(() => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return theme.textSecondary;
      case InvoiceStatus.SENT:
        return theme.accent;
      case InvoiceStatus.VIEWED:
        return theme.accent;
      case InvoiceStatus.PAID:
        return '#22C55E';
      case InvoiceStatus.VOID:
        return theme.destructive;
      default:
        return theme.textSecondary;
    }
  }, [status, theme]);

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
      <ThemedText type="small" style={styles.badgeText}>
        {status}
      </ThemedText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});
