import { type ReactNode, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';

export type SearchableListProps<T> = {
  data: T[];
  renderItem: (item: T) => ReactNode;
  filterFn: (item: T, query: string) => boolean;
  placeholder?: string;
  emptyMessage?: string;
};

export function SearchableList<T>({
  data,
  renderItem,
  filterFn,
  placeholder = 'Search...',
  emptyMessage = 'No results',
}: SearchableListProps<T>) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const filtered = query.trim() === ''
    ? data
    : data.filter((item) => filterFn(item, query.trim()));

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText themeColor="textSecondary">{emptyMessage}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(_, index) => String(index)}
          renderItem={({ item }) => <>{renderItem(item)}</>}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
  },
});
