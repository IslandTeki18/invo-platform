import { useQuery } from "convex/react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { formatMoney } from "@repo/utils";
import "./invoice.css";

export default function PaymentSuccessPage() {
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const id = invoiceId as Id<"invoices"> | undefined;
  const invoice = useQuery(api.invoices.getPublic, id && token ? { invoiceId: id, token } : "skip");

  if (!id || !token || invoice === null) {
    return <main className="invoice-state">Invoice not found</main>;
  }
  if (invoice === undefined) {
    return <main className="invoice-state">Loading…</main>;
  }

  const paid = invoice.status === "PAID";
  return (
    <main className="payment-page">
      <div className={`invoice-banner invoice-banner--${paid ? "green" : "yellow"}`}>
        {paid ? "Payment received" : "Confirming your payment…"}
      </div>
      <h1>{formatMoney(invoice.total)}</h1>
      {paid && invoice.paidAt && <p>Paid on {new Date(invoice.paidAt).toLocaleDateString()}</p>}
      {!paid && <p>This may take a moment.</p>}
      <a href={`/invoice/${id}?token=${encodeURIComponent(token)}`}>View invoice</a>
    </main>
  );
}
