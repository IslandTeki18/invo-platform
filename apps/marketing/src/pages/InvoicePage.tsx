import { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { canAcceptPayment, formatMoney } from "@repo/utils";
import "./invoice.css";

function formatDate(timestamp?: number) {
  return timestamp ? new Date(timestamp).toLocaleDateString() : "";
}

function StatusBanner({
  status,
  dueDate,
  paidAt,
}: {
  status: "DRAFT" | "SENT" | "VIEWED" | "PAID" | "VOID";
  dueDate?: number;
  paidAt?: number;
}) {
  const [now] = useState(Date.now);

  if (status === "PAID") {
    return <div className="invoice-banner invoice-banner--green">Paid on {formatDate(paidAt)}</div>;
  }
  if (status === "VOID") {
    return <div className="invoice-banner invoice-banner--red">This invoice has been voided</div>;
  }
  if (status === "DRAFT") {
    return <div className="invoice-banner invoice-banner--gray">Draft</div>;
  }

  const overdue = dueDate != null && dueDate < now;
  return (
    <div className="invoice-banner invoice-banner--yellow">
      {overdue ? "Overdue" : "Unpaid"}
      {dueDate != null && ` · Due ${formatDate(dueDate)}`}
    </div>
  );
}

export default function InvoicePage() {
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const id = invoiceId as Id<"invoices"> | undefined;
  const args = id && token ? { invoiceId: id, token } : "skip";
  const invoice = useQuery(api.invoices.getPublic, args);
  const recordView = useMutation(api.invoices.recordView);
  const createCheckout = useAction(api.actions.stripe.createCheckoutSession);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState(false);

  async function handlePayment() {
    if (!id || !token) return;
    setPaying(true);
    setPaymentError(false);
    try {
      const { url } = await createCheckout({ invoiceId: id, token });
      window.location.assign(url);
    } catch {
      setPaymentError(true);
      setPaying(false);
    }
  }

  useEffect(() => {
    if (!id || !token) return;
    void recordView({ invoiceId: id, token, userAgent: navigator.userAgent }).catch(
      () => undefined,
    );
  }, [id, recordView, token]);

  if (!id || !token || invoice === null) {
    return <main className="invoice-state">Invoice not found</main>;
  }
  if (invoice === undefined) {
    return <main className="invoice-state">Loading…</main>;
  }

  const hasImages = invoice.lineItems.some((item) => item.imageUrl);
  const payable = canAcceptPayment(invoice.status);

  return (
    <main className="invoice-page">
      <StatusBanner status={invoice.status} dueDate={invoice.dueDate} paidAt={invoice.paidAt} />

      <header className="invoice-header">
        {invoice.org.logoUrl && <img className="invoice-logo" src={invoice.org.logoUrl} alt="" />}
        <div>
          <h1>{invoice.org.name}</h1>
          {invoice.org.businessAddress && (
            <address>
              {invoice.org.businessAddress.street}
              <br />
              {invoice.org.businessAddress.city}, {invoice.org.businessAddress.state}{" "}
              {invoice.org.businessAddress.postalCode}
              <br />
              {invoice.org.businessAddress.country}
            </address>
          )}
        </div>
      </header>

      {invoice.clientSnapshot && (
        <section>
          <h2>Bill to</h2>
          <p>{invoice.clientSnapshot.name}</p>
          <p>
            <a href={`mailto:${invoice.clientSnapshot.email}`}>{invoice.clientSnapshot.email}</a>
          </p>
          {invoice.clientSnapshot.phone && <p>{invoice.clientSnapshot.phone}</p>}
        </section>
      )}

      <section>
        <h2>Line items</h2>
        <div className="invoice-table-wrap">
          <table>
            <thead>
              <tr>
                {hasImages && <th aria-label="Image" />}
                <th className="item-cell">Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id}>
                  {hasImages && (
                    <td>
                      {item.imageUrl && (
                        <img className="line-item-image" src={item.imageUrl} alt="" />
                      )}
                    </td>
                  )}
                  <td className="item-cell">
                    <strong>{item.name}</strong>
                    {item.description && (
                      <span className="item-description">{item.description}</span>
                    )}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unitPrice)}</td>
                  <td>{formatMoney(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {invoice.expenses.length > 0 && (
        <section>
          <h2>Expenses</h2>
          <p className="section-note">Not included in the invoice total.</p>
          <ul className="expense-list">
            {invoice.expenses.map((expense) => (
              <li key={expense.id}>
                <span>
                  {expense.description}
                  {expense.category && ` · ${expense.category}`}
                </span>
                <span>{formatMoney(expense.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="invoice-totals">
        <div>
          <span>Subtotal</span>
          <span>{formatMoney(invoice.subtotal)}</span>
        </div>
        {invoice.discount && (
          <div>
            <span>
              Discount{invoice.discount.type === "percentage" && ` (${invoice.discount.value}%)`}
            </span>
            {invoice.discount.type === "fixed" && (
              <span>{formatMoney(invoice.discount.value)}</span>
            )}
          </div>
        )}
        {invoice.tax && invoice.tax.amount > 0 && (
          <div>
            <span>Tax ({invoice.tax.rate}%)</span>
            <span>{formatMoney(invoice.tax.amount)}</span>
          </div>
        )}
        <div className="invoice-total">
          <span>Total</span>
          <span>{formatMoney(invoice.total)}</span>
        </div>
      </section>

      {invoice.attachments.length > 0 && (
        <section>
          <h2>Attachments</h2>
          <ul className="attachment-list">
            {invoice.attachments.map((attachment) => (
              <li key={attachment.url}>
                <a href={attachment.url} target="_blank" rel="noreferrer">
                  {attachment.displayName}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {payable && (
        <div className="invoice-actions">
          {searchParams.get("payment") === "cancelled" && (
            <p className="invoice-notice">Payment not completed. You can try again below.</p>
          )}
          {paymentError && (
            <p className="invoice-error" role="alert">
              Unable to start payment. Try again.
            </p>
          )}
          {invoice.pdfUrl && (
            <a className="button" href={invoice.pdfUrl} target="_blank" rel="noreferrer">
              Download PDF
            </a>
          )}
          <button type="button" disabled={paying} onClick={() => void handlePayment()}>
            {paying ? "Opening checkout…" : `Pay ${formatMoney(invoice.total)}`}
          </button>
        </div>
      )}
    </main>
  );
}
