import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAction, useQuery } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { StripeConnectAccountStatus } from '@repo/types';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { FormButton } from '@/components/form';
import { ChecklistRow } from './checklist-row';

const RETURN_URL = 'mobile://more/setup';

const BUTTON_LABEL: Record<StripeConnectAccountStatus, string> = {
  NOT_CONNECTED: 'Connect Stripe',
  PENDING: 'Continue Stripe setup',
  CONNECTED: 'Continue Stripe setup',
  CHARGES_ENABLED: 'Connected',
};

export type StripeConnectRowProps = {
  orgId: Id<'organizations'>;
  isOwner: boolean;
};

export function StripeConnectRow({ orgId, isOwner }: StripeConnectRowProps) {
  const account = useQuery(api.connect.getForOrg, { orgId });
  const createLink = useAction(api.actions.stripe.createConnectOnboardingLink);
  const refresh = useAction(api.actions.stripe.refreshConnectStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const status = account?.status ?? StripeConnectAccountStatus.NOT_CONNECTED;
  const done = status === StripeConnectAccountStatus.CHARGES_ENABLED;

  async function handleConnect() {
    setBusy(true);
    setError('');
    try {
      const { url } = await createLink({ orgId });
      await WebBrowser.openAuthSessionAsync(url, RETURN_URL);
      await refresh({ orgId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Stripe setup.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <ChecklistRow
        label="Stripe payouts"
        done={done}
        hint={done ? 'Ready to accept payments' : 'Required to send invoices'}
      />
      <View style={styles.action}>
        {isOwner ? (
          <FormButton
            label={BUTTON_LABEL[status]}
            onPress={handleConnect}
            loading={busy}
            disabled={done}
            variant={done ? 'secondary' : 'primary'}
          />
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Only the owner can connect Stripe.
          </ThemedText>
        )}
        {error ? (
          <ThemedText type="small" themeColor="destructive">
            {error}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
});
