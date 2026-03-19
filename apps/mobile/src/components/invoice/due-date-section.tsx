import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';

export type DueDateSectionProps = {
  dueDate: number | null;
  onDateChange: (timestamp: number | null) => void;
};

export function DueDateSection({ dueDate, onDateChange }: DueDateSectionProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const formattedDate = dueDate
    ? new Date(dueDate).toLocaleDateString()
    : 'No due date set';

  function handlePress() {
    setShowPicker(true);
  }

  function handleChange(_event: unknown, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onDateChange(selectedDate.getTime());
    }
  }

  function handleClear() {
    onDateChange(null);
    setShowPicker(false);
  }

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={styles.label}>
        Due Date
      </ThemedText>

      <View style={styles.row}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.dateButton,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <ThemedText
            type="default"
            themeColor={dueDate ? 'text' : 'textSecondary'}
          >
            {formattedDate}
          </ThemedText>
        </Pressable>

        {dueDate !== null && (
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [
              styles.clearButton,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <ThemedText type="small" themeColor="destructive">
              Clear
            </ThemedText>
          </Pressable>
        )}
      </View>

      {showPicker && (
        <>
          {Platform.OS === 'ios' ? (
            <ThemedView type="backgroundElement" style={styles.iosPicker}>
              <DateTimePicker
                value={dueDate ? new Date(dueDate) : new Date()}
                mode="date"
                display="inline"
                onChange={handleChange}
                minimumDate={new Date()}
              />
              <Pressable
                onPress={() => setShowPicker(false)}
                style={[styles.iosDoneButton, { borderTopColor: theme.border }]}
              >
                <ThemedText type="small" themeColor="accent">
                  Done
                </ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            <DateTimePicker
              value={dueDate ? new Date(dueDate) : new Date()}
              mode="date"
              display="default"
              onChange={handleChange}
              minimumDate={new Date()}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  label: {
    marginBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  clearButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPicker: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  iosDoneButton: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
});
