import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Spacing } from '@/constants/theme';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SearchableList } from '@/components/ui/searchable-list';
import { FormButton, FormSegment } from '@/components/form';
import { ClientRow } from '@/components/client/client-row';

type Segment = 'active' | 'archived';

export default function ClientListScreen() {
  const router = useRouter();
  const { currentOrg, isLoading } = useCurrentOrg();
  const [segment, setSegment] = useState<Segment>('active');

  const clients = useQuery(
    api.clients.listByOrg,
    currentOrg ? { orgId: currentOrg._id as Id<'organizations'>, includeArchived: true } : 'skip',
  );

  const visible = (clients ?? []).filter((c) => c.archived === (segment === 'archived'));
  const loading = isLoading || (currentOrg !== null && clients === undefined);

  return (
    <ThemedView style={styles.root}>
      <ScreenHeader
        title="Clients"
        right={<FormButton label="New" onPress={() => router.push('/clients/new')} />}
      />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : !currentOrg ? (
        <EmptyState message="Select an organization to view clients" />
      ) : (
        <>
          <View style={styles.segment}>
            <FormSegment
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Archived', value: 'archived' },
              ]}
              selected={segment}
              onSelect={(value) => setSegment(value as Segment)}
            />
          </View>
          {visible.length === 0 && segment === 'active' ? (
            <EmptyState
              message="No clients yet"
              actionLabel="New Client"
              onAction={() => router.push('/clients/new')}
            />
          ) : (
            <SearchableList
              data={visible}
              placeholder="Search clients..."
              emptyMessage={segment === 'archived' ? 'No archived clients' : 'No clients found'}
              filterFn={(c, q) => {
                const needle = q.toLowerCase();
                return (
                  c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle)
                );
              }}
              renderItem={(c) => (
                <ClientRow
                  name={c.name}
                  email={c.email}
                  archived={c.archived}
                  onPress={() => router.push(`/clients/${c._id}`)}
                />
              )}
            />
          )}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segment: { padding: Spacing.three },
});
