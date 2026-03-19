import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';

import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/primitives/themed-text';
import type { UseInvoiceFormReturn } from '@/hooks/use-invoice-form';

import { ComposerHeader } from '@/components/invoice/composer-header';
import { ComposerFooter } from '@/components/invoice/composer-footer';
import { ClientSection } from '@/components/invoice/client-section';
import { ClientPicker } from '@/components/invoice/client-picker';
import { LineItemList } from '@/components/invoice/line-item-list';
import { PresetPicker } from '@/components/invoice/preset-picker';
import { ExpenseSection } from '@/components/invoice/expense-section';
import { ExpensePicker } from '@/components/invoice/expense-picker';
import { DiscountSection } from '@/components/invoice/discount-section';
import { TaxSection } from '@/components/invoice/tax-section';
import { DueDateSection } from '@/components/invoice/due-date-section';
import { TotalsSection } from '@/components/invoice/totals-section';
import { SendConfirmation } from '@/components/invoice/send-confirmation';

export type ComposerShellProps = {
  form: UseInvoiceFormReturn;
  mode: 'create' | 'edit';
  orgId: string;
  invoiceId?: string;
};

export function ComposerShell({ form, mode, orgId, invoiceId }: ComposerShellProps) {
  const router = useRouter();

  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const [presetPickerVisible, setPresetPickerVisible] = useState(false);
  const [expensePickerVisible, setExpensePickerVisible] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const sendInvoice = useMutation(api.invoices.send);

  const handleSend = useCallback(async () => {
    if (!invoiceId) return;
    setIsSending(true);
    try {
      await sendInvoice({ invoiceId: invoiceId as Id<'invoices'> });
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invoice.';
      Alert.alert('Send Failed', message);
      setIsSending(false);
    }
  }, [invoiceId, sendInvoice, router]);

  const title = mode === 'create' ? 'New Invoice' : 'Edit Draft';

  return (
    <View style={styles.root}>
      <ComposerHeader title={title} onBack={router.back} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Client */}
          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              Client
            </ThemedText>
            <ClientSection
              clientName={form.state.clientName}
              clientEmail={form.state.clientEmail}
              onOpenPicker={() => setClientPickerVisible(true)}
              onClear={form.clearClient}
              error={form.state.errors.client}
            />
          </View>

          {/* Line Items */}
          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              Line Items
            </ThemedText>
            <LineItemList
              items={form.state.lineItems}
              onUpdate={form.updateLineItem}
              onRemove={form.removeLineItem}
              onAdd={form.addLineItem}
              onOpenPresetPicker={() => setPresetPickerVisible(true)}
              errors={form.state.errors}
            />
          </View>

          {/* Expenses */}
          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              Expenses
            </ThemedText>
            <ExpenseSection
              expenseIds={form.state.expenseIds}
              orgId={orgId}
              onOpenPicker={() => setExpensePickerVisible(true)}
              onRemove={(id) =>
                form.setExpenses(form.state.expenseIds.filter((e) => e !== id))
              }
            />
          </View>

          {/* Discount */}
          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              Discount
            </ThemedText>
            <DiscountSection
              discountEnabled={form.state.discountEnabled}
              discountType={form.state.discountType}
              discountValue={form.state.discountValue}
              onToggle={form.toggleDiscount}
              onTypeChange={form.setDiscountType}
              onValueChange={form.setDiscountValue}
            />
          </View>

          {/* Tax */}
          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              Tax
            </ThemedText>
            <TaxSection value={form.state.taxRate} onChangeText={form.setTaxRate} />
          </View>

          {/* Due Date */}
          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              Due Date
            </ThemedText>
            <DueDateSection dueDate={form.state.dueDate} onDateChange={form.setDueDate} />
          </View>

          {/* Summary */}
          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              Summary
            </ThemedText>
            <TotalsSection totals={form.totals} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ComposerFooter
        onSave={form.save}
        isSaving={form.state.isSaving}
        errors={form.state.errors}
        onSend={mode === 'edit' && invoiceId ? () => setSendModalVisible(true) : undefined}
        isSendDisabled={isSending}
      />

      {/* Pickers */}
      <ClientPicker
        visible={clientPickerVisible}
        onClose={() => setClientPickerVisible(false)}
        orgId={orgId}
        selectedClientId={form.state.clientId}
        onSelect={form.setClient}
      />

      <PresetPicker
        visible={presetPickerVisible}
        onClose={() => setPresetPickerVisible(false)}
        onSelect={form.insertPreset}
      />

      <ExpensePicker
        visible={expensePickerVisible}
        onClose={() => setExpensePickerVisible(false)}
        orgId={orgId}
        selectedIds={form.state.expenseIds}
        onConfirm={form.setExpenses}
      />

      <SendConfirmation
        visible={sendModalVisible}
        onClose={() => setSendModalVisible(false)}
        onConfirm={handleSend}
        isSending={isSending}
        clientName={form.state.clientName ?? ''}
        total={form.totals.total}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
