import React from 'react';
import { View, ActivityIndicator } from 'react-native';

import { useCurrentOrg } from '@/hooks/use-current-org';
import { useInvoiceForm } from '@/hooks/use-invoice-form';
import { ComposerShell } from '@/components/invoice/composer-shell';
import { EmptyState } from '@/components/ui/empty-state';

export default function NewInvoiceScreen() {
  const { currentOrg, isLoading } = useCurrentOrg();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!currentOrg) {
    return <EmptyState message="Select an organization first" />;
  }

  return <NewInvoiceForm orgId={currentOrg._id} />;
}

function NewInvoiceForm({ orgId }: { orgId: string }) {
  const form = useInvoiceForm({ orgId });
  return <ComposerShell form={form} mode="create" orgId={orgId} />;
}
