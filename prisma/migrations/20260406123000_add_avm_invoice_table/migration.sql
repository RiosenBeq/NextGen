CREATE TABLE IF NOT EXISTS "AvmInvoice" (
  id TEXT PRIMARY KEY,
  "locationId" TEXT REFERENCES "Location"(id) ON DELETE SET NULL,
  "invoiceType" TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  "invoiceDate" TIMESTAMP NOT NULL,
  "dueDate" TIMESTAMP,
  "isPaid" BOOLEAN NOT NULL DEFAULT FALSE,
  "paidAt" TIMESTAMP,
  "attachmentUrl" TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AvmInvoice_invoiceDate_idx" ON "AvmInvoice" ("invoiceDate");
CREATE INDEX IF NOT EXISTS "AvmInvoice_dueDate_idx" ON "AvmInvoice" ("dueDate");
CREATE INDEX IF NOT EXISTS "AvmInvoice_isPaid_idx" ON "AvmInvoice" ("isPaid");
