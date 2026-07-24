-- Reconciles migration history with columns that already exist in the
-- database (added via db push during earlier dev iteration, never
-- captured as a migration). No-op against current data.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "buyerCity" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "buyerNotes" TEXT;
