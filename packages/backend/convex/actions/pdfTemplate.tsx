"use node";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatMoney, applyDiscount } from "@repo/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type InvoicePdfProps = {
  invoice: {
    clientSnapshot?: {
      name: string;
      email: string;
      phone?: string;
    } | null;
    lineItems: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
      description?: string;
    }>;
    expenses: Array<{ description: string; amount: number }>;
    subtotal: number;
    discount?: { type: "percentage" | "fixed"; value: number } | null;
    tax?: { rate: number; amount: number } | null;
    total: number;
    dueDate?: number | null;
    sentAt?: number | null;
  };
  org: {
    name: string;
    businessAddress?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    } | null;
  };
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  orgName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  orgAddress: {
    fontSize: 10,
    color: "#666666",
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 24,
    color: "#cccccc",
    textAlign: "right",
  },

  // Client block
  clientBlock: {
    marginBottom: 24,
  },
  billToLabel: {
    fontSize: 9,
    color: "#888888",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  clientDetail: {
    fontSize: 10,
    color: "#444444",
    marginTop: 2,
  },

  // Line items table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  colName: {
    flex: 3,
  },
  colQty: {
    flex: 1,
    textAlign: "right",
  },
  colUnitPrice: {
    flex: 1.5,
    textAlign: "right",
  },
  colTotal: {
    flex: 1.5,
    textAlign: "right",
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  lineItemDescription: {
    fontSize: 8,
    color: "#888888",
    marginTop: 2,
  },

  // Expenses
  expensesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingBottom: 4,
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },

  // Totals
  totalsBlock: {
    alignItems: "flex-end",
    marginTop: 10,
    marginBottom: 30,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 200,
    paddingVertical: 3,
  },
  totalLabel: {
    flex: 1,
    textAlign: "right",
    paddingRight: 12,
    color: "#666666",
  },
  totalValue: {
    width: 80,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 200,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    marginTop: 4,
  },
  grandTotalLabel: {
    flex: 1,
    textAlign: "right",
    paddingRight: 12,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  grandTotalValue: {
    width: 80,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },

  // Footer
  footer: {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#888888",
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDiscountLabel(discount: { type: "percentage" | "fixed"; value: number }): string {
  if (discount.type === "percentage") {
    return `Discount (${discount.value}%)`;
  }
  return `Discount (${formatMoney(discount.value)})`;
}

function discountAmount(
  subtotal: number,
  discount: { type: "percentage" | "fixed"; value: number },
): number {
  return subtotal - applyDiscount(subtotal, discount);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoicePdf({ invoice, org }: InvoicePdfProps) {
  const addr = org.businessAddress;
  const client = invoice.clientSnapshot;
  const hasExpenses = invoice.expenses.length > 0;
  const hasDiscount = invoice.discount != null && invoice.discount.value > 0;
  const hasTax = invoice.tax != null && invoice.tax.rate > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>{org.name}</Text>
            {addr && (
              <View>
                <Text style={styles.orgAddress}>{addr.street}</Text>
                <Text style={styles.orgAddress}>
                  {addr.city}, {addr.state} {addr.postalCode}
                </Text>
                {addr.country !== "US" && (
                  <Text style={styles.orgAddress}>{addr.country}</Text>
                )}
              </View>
            )}
          </View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        {/* Bill To */}
        {client && (
          <View style={styles.clientBlock}>
            <Text style={styles.billToLabel}>Bill To:</Text>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientDetail}>{client.email}</Text>
            {client.phone && (
              <Text style={styles.clientDetail}>{client.phone}</Text>
            )}
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colName]}>Name</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>
              Unit Price
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>
          {invoice.lineItems.map((item, i) => (
            <View key={i}>
              <View style={styles.tableRow}>
                <Text style={styles.colName}>{item.name}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colUnitPrice}>
                  {formatMoney(item.unitPrice)}
                </Text>
                <Text style={styles.colTotal}>{formatMoney(item.total)}</Text>
              </View>
              {item.description && (
                <Text style={styles.lineItemDescription}>
                  {item.description}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Expenses */}
        {hasExpenses && (
          <View style={styles.expensesSection}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            {invoice.expenses.map((expense, i) => (
              <View key={i} style={styles.expenseRow}>
                <Text>{expense.description}</Text>
                <Text>{formatMoney(expense.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatMoney(invoice.subtotal)}
            </Text>
          </View>

          {hasDiscount && invoice.discount && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {formatDiscountLabel(invoice.discount)}
              </Text>
              <Text style={styles.totalValue}>
                -{formatMoney(discountAmount(invoice.subtotal, invoice.discount))}
              </Text>
            </View>
          )}

          {hasTax && invoice.tax && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.tax.rate}%)</Text>
              <Text style={styles.totalValue}>
                {formatMoney(invoice.tax.amount)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatMoney(invoice.total)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Due: {invoice.dueDate ? formatDate(invoice.dueDate) : "Upon receipt"}
          </Text>
          {invoice.sentAt && <Text>Sent: {formatDate(invoice.sentAt)}</Text>}
        </View>
      </Page>
    </Document>
  );
}
