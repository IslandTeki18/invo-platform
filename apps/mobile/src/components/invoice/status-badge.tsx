import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_ORDER = ['DRAFT', 'SENT', 'VIEWED', 'PAID', 'VOID'] as const;

type InvoiceStatus = (typeof STATUS_ORDER)[number];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatusBadge({ status }: { status: string }) {
  const theme = useTheme();

  const badgeColor = useMemo(() => {
    switch (status as InvoiceStatus) {
      case 'DRAFT':
        return theme.textSecondary;
      case 'SENT':
        return theme.accent;
      case 'VIEWED':
        return theme.accent;
      case 'PAID':
        return '#22C55E';
      case 'VOID':
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
