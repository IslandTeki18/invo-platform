import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { FormButton } from '@/components/form';
import { ClientForm } from '@/components/client/client-form';

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const clientId = id as Id<'clients'>;

  const client = useQuery(api.clients.get, { clientId });
  const update = useMutation(api.clients.update);
  const archive = useMutation(api.clients.archive);
  const restore = useMutation(api.clients.restore);

  function confirm(title: string, action: () => Promise<unknown>) {
    Alert.alert(title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: title,
        style: title === 'Archive' ? 'destructive' : 'default',
        onPress: () => action().catch((err) => Alert.alert('Error', err.message)),
      },
    ]);
  }

  return (
    <ThemedView style={styles.root}>
      <ScreenHeader title="Edit Client" onBack={router.back} />
      {client === undefined ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : client === null ? (
        <EmptyState message="Client not found" />
      ) : (
        <ClientForm
          key={client._id}
          initialValues={{
            name: client.name,
            email: client.email,
            phone: client.phone ?? '',
            notes: client.notes ?? '',
          }}
          submitLabel="Save"
          onSubmit={async (values) => {
            await update({
              clientId,
              name: values.name,
              email: values.email,
              phone: values.phone || null,
              notes: values.notes || null,
            });
            router.back();
          }}
          footer={
            client.archived ? (
              <FormButton
                label="Restore"
                variant="secondary"
                onPress={() => confirm('Restore', () => restore({ clientId }))}
              />
            ) : (
              <FormButton
                label="Archive"
                variant="destructive"
                onPress={() => confirm('Archive', () => archive({ clientId }))}
              />
            )
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
