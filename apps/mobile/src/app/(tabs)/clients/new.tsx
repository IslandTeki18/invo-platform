import React from 'react';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { ThemedView } from '@/components/primitives/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ClientForm } from '@/components/client/client-form';

export default function NewClientScreen() {
  const router = useRouter();
  const { currentOrg } = useCurrentOrg();
  const create = useMutation(api.clients.create);

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScreenHeader title="New Client" onBack={router.back} />
      {!currentOrg ? (
        <EmptyState message="Select an organization first" />
      ) : (
        <ClientForm
          submitLabel="Create Client"
          onSubmit={async (values) => {
            await create({
              orgId: currentOrg._id as Id<'organizations'>,
              name: values.name,
              email: values.email,
              phone: values.phone || undefined,
              notes: values.notes || undefined,
            });
            router.back();
          }}
        />
      )}
    </ThemedView>
  );
}
