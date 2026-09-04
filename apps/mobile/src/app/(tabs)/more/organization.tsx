import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';

import { api } from '@repo/backend/convex/_generated/api';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedView } from '@/components/primitives/themed-view';
import { ScreenHeader } from '@/components/ui/screen-header';
import { FormButton, FormField } from '@/components/form';

export default function OrganizationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { currentOrg, organizations, selectOrg } = useCurrentOrg();
  const create = useMutation(api.organizations.create);

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const orgId = await create({ name: name.trim() });
      selectOrg(orgId);
      setName('');
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization.');
    } finally {
      setSaving(false);
    }
  }, [name, create, selectOrg, router]);

  return (
    <ThemedView style={styles.root}>
      <ScreenHeader title="Organization" onBack={router.back} />
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.three }}>
        {organizations.length > 0 ? (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              YOUR ORGANIZATIONS
            </ThemedText>
            {organizations.map((org) => {
              const selected = org._id === currentOrg?._id;
              return (
                <Pressable
                  key={org._id}
                  onPress={() => selectOrg(org._id)}
                  style={({ pressed }) => [
                    styles.row,
                    { borderBottomColor: theme.border },
                    pressed && { backgroundColor: theme.backgroundElement },
                  ]}
                >
                  <View style={styles.rowBody}>
                    <ThemedText>{org.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {org.role}
                    </ThemedText>
                  </View>
                  {selected ? <ThemedText themeColor="accent">✓</ThemedText> : null}
                </Pressable>
              );
            })}
          </>
        ) : null}

        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          CREATE ORGANIZATION
        </ThemedText>
        <View style={styles.form}>
          <FormField label="Name" value={name} onChangeText={setName} error={error || undefined} />
          <FormButton label="Create Organization" onPress={handleCreate} loading={saving} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sectionLabel: {
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowBody: { flex: 1, gap: Spacing.half },
  form: { paddingHorizontal: Spacing.three, gap: Spacing.two },
});
