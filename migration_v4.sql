-- Migration v4: Add AvmPayment table (isolated AVM payment tracking)

CREATE TABLE IF NOT EXISTS "AvmPayment" (
  "id" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "paymentType" TEXT NOT NULL,
  "description" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AvmPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AvmPayment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AvmPayment_locationId_idx" ON "AvmPayment"("locationId");
CREATE INDEX IF NOT EXISTS "AvmPayment_month_idx" ON "AvmPayment"("month");
