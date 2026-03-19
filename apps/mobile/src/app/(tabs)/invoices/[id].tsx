import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { useInvoiceForm } from '@/hooks/use-invoice-form';
import { ComposerShell } from '@/components/invoice/composer-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { InvoiceDetail } from '@/components/invoice/invoice-detail';

export default function EditInvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentOrg } = useCurrentOrg();
  const invoice = useQuery(
    api.invoices.get,
    id ? { invoiceId: id as Id<'invoices'> } : 'skip',
  );

  if (!currentOrg || invoice === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (invoice === null) {
    return <EmptyState message="Invoice not found" />;
  }

  if (invoice.status !== 'DRAFT') {
    return <InvoiceDetail invoice={invoice} onBack={router.back} />;
  }

  return <EditInvoiceForm orgId={currentOrg._id} invoice={invoice} />;
}

function EditInvoiceForm({
  orgId,
  invoice,
}: {
  orgId: string;
  invoice: NonNullable<ReturnType<typeof useQuery<typeof api.invoices.get>>>;
}) {
  const form = useInvoiceForm({ orgId, existingInvoice: invoice });
  return <ComposerShell form={form} mode="edit" orgId={orgId} />;
}
