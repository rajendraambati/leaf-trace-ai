-- Update processing units status to 'processing' for units that have batches
UPDATE processing_units
SET status = 'processing', updated_at = now()
WHERE id IN (
  SELECT DISTINCT unit_id FROM processing_batches
);