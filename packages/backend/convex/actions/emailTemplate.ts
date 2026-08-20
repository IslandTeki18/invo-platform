"use node";

import type { InvoiceSendEmailData } from "@repo/types";
import { formatMoney } from "@repo/utils";

export function buildInvoiceSendHtml(data: InvoiceSendEmailData): string {
  const formattedAmount = formatMoney(data.amount);
  const formattedDueDate =
    data.dueDate !== null
      ? new Date(data.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Upon receipt";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice from ${escapeHtml(data.orgName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 16px;text-align:center;border-bottom:1px solid #e4e4e7;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#18181b;">${escapeHtml(data.orgName)}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 16px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#18181b;">You have a new invoice</h1>
              <p style="margin:0;font-size:14px;color:#71717a;">Hi ${escapeHtml(data.clientName)}, here are the details:</p>
            </td>
          </tr>
          <!-- Amount -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Amount Due</p>
              <p style="margin:0;font-size:36px;font-weight:700;color:#18181b;">${formattedAmount}</p>
            </td>
          </tr>
          <!-- Due Date -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Due Date</p>
              <p style="margin:0;font-size:16px;font-weight:600;color:#18181b;">${formattedDueDate}</p>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#2563eb;border-radius:6px;">
                    <a href="${escapeHtml(data.invoiceUrl)}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">View Invoice</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">This invoice was sent via Invo</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
