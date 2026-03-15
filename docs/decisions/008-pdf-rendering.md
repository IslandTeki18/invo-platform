# 008 — PDF Rendering Approach

**Date:** 2026-03-15
**Status:** Confirmed

---

## Decision

Use `@react-pdf/renderer` to generate invoice PDFs.

---

## Rationale

`@react-pdf/renderer` allows React components to render directly to PDF output. It runs in any Node.js environment, requires no browser binary, and produces lightweight output well within serverless function size constraints.

Key factors:

- **No headless browser required.** Puppeteer bundles ~130MB of Chromium. This is incompatible with Convex actions and pushes Vercel serverless bundles toward their limits.
- **Node.js native.** Convex actions run on Node.js. `@react-pdf/renderer` works without any additional runtime dependencies.
- **Lightweight.** The library is small enough to remain well under the Vercel 50MB serverless limit.
- **React component model.** Keeps PDF layout within the same component paradigm used by the rest of the application, reducing cognitive overhead.

---

## Alternatives Considered

### Puppeteer (headless Chromium)

Renders HTML/CSS to PDF by running a real browser. Produces pixel-perfect output from existing web components.

**Rejected because:**
- ~130MB Chromium binary is incompatible with Convex action constraints.
- Exceeds Vercel serverless bundle limits.
- Significant cold-start overhead.

### Convex Action + Puppeteer (external render worker)

Offload PDF generation to a separate service or worker that runs Puppeteer outside Convex.

**Rejected because:**
- Adds infrastructure complexity with no compelling benefit given `@react-pdf/renderer` satisfies all requirements.
- Introduces an additional failure surface and deployment dependency.

### External PDF Service (e.g., Anvil, DocRaptor, PDFShift)

Send invoice data to a third-party API that returns a PDF.

**Rejected because:**
- Introduces a vendor dependency for a core product feature.
- Adds latency and cost per generation.
- Requires sending invoice data to an external system (privacy and compliance surface).

---

## Runtime Compatibility

| Environment         | Compatible | Notes                                  |
|---------------------|------------|----------------------------------------|
| Convex actions      | Yes        | Node.js runtime; no browser required   |
| Vercel serverless   | Yes        | Well under 50MB bundle limit           |

---

## Visual Fidelity Expectation

Pixel-perfect match with the web invoice viewer is **not required**.

`@react-pdf/renderer` uses its own layout engine, not HTML/CSS. The resulting PDF will differ visually from the browser-rendered invoice viewer. This is acceptable because:

- Invoice PDFs must be **structurally equivalent**: same line items, totals, tax calculations, branding, and metadata.
- **Content accuracy takes priority** over visual identity between the web and PDF outputs.
- Minor layout differences are expected and tolerated by end users in invoice contexts.

---

## Generation Triggers

| Trigger              | Behavior                                              |
|----------------------|-------------------------------------------------------|
| Invoice sent         | PDF generated and attached to or linked from email    |
| Preview requested    | PDF generated on demand; cached for 5 minutes         |

Generated PDFs are stored via Convex File Storage.

---

## Implementation Implications

- Invoice data must be passed to a shared render model consumed by both the web viewer and the PDF renderer.
- The PDF components will be a separate component tree from the web viewer components, but driven by the same typed data structures.
- The 5-minute preview cache must be invalidated if invoice data changes between requests.
- PDF generation logic lives in a Convex action, not a mutation or query, due to the async and compute-intensive nature of the operation.
