import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { FormField, FormButton } from '@/components/form';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { SearchableList } from '@/components/ui/searchable-list';

export type ClientPickerProps = {
  visible: boolean;
  onClose: () => void;
  orgId: string;
  selectedClientId: string | null;
  onSelect: (id: string, name: string, email: string) => void;
};

type Client = {
  _id: Id<'clients'>;
  name: string;
  email: string;
  phone?: string;
  archived: boolean;
};

export function ClientPicker({
  visible,
  onClose,
  orgId,
  selectedClientId,
  onSelect,
}: ClientPickerProps) {
  const theme = useTheme();

  const clients = useQuery(api.clients.listByOrg, {
    orgId: orgId as Id<'organizations'>,
    includeArchived: false,
  });

  const createClient = useMutation(api.clients.create);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function handleSelect(client: Client) {
    onSelect(client._id, client.name, client.email);
    onClose();
  }

  async function handleCreate() {
    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim();

    if (!trimmedName) {
      setCreateError('Name is required.');
      return;
    }
    if (!trimmedEmail) {
      setCreateError('Email is required.');
      return;
    }

    setCreateError(null);
    setCreating(true);

    try {
      const id = await createClient({
        orgId: orgId as Id<'organizations'>,
        name: trimmedName,
        email: trimmedEmail,
      });
      onSelect(id, trimmedName, trimmedEmail);
      setNewName('');
      setNewEmail('');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create client.';
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Select Client">
      <SearchableList<Client>
        data={clients ?? []}
        filterFn={(client, query) => {
          const q = query.toLowerCase();
          return (
            client.name.toLowerCase().includes(q) ||
            client.email.toLowerCase().includes(q)
          );
        }}
        placeholder="Search clients..."
        emptyMessage="No clients found"
        renderItem={(client) => (
          <Pressable
            key={client._id}
            onPress={() => handleSelect(client)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor:
                  client._id === selectedClientId
                    ? theme.backgroundSelected
                    : pressed
                      ? theme.backgroundElement
                      : 'transparent',
              },
            ]}
          >
            <ThemedText type="default" style={styles.rowName}>
              {client.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {client.email}
            </ThemedText>
          </Pressable>
        )}
      />

      <View style={[styles.divider, { borderTopColor: theme.border }]} />

      <ScrollView
        style={styles.createSection}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="small" themeColor="textSecondary" style={styles.createLabel}>
          Quick Create
        </ThemedText>

        <View style={styles.createFields}>
          <FormField
            label="Name"
            value={newName}
            onChangeText={(text) => {
              setNewName(text);
              if (createError) setCreateError(null);
            }}
            placeholder="Client name"
          />
          <FormField
            label="Email"
            value={newEmail}
            onChangeText={(text) => {
              setNewEmail(text);
              if (createError) setCreateError(null);
            }}
            placeholder="client@example.com"
            keyboardType="email-address"
          />

          {createError ? (
            <ThemedText type="small" themeColor="destructive">
              {createError}
            </ThemedText>
          ) : null}

          <FormButton
            label="Create Client"
            onPress={handleCreate}
            loading={creating}
            disabled={creating}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  rowName: {
    fontWeight: '500',
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
  },
  createSection: {
    maxHeight: 280,
  },
  createLabel: {
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createFields: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
});
