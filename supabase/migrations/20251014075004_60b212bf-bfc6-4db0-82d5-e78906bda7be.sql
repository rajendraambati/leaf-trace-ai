-- Make total_price a generated column that auto-calculates from quantity_kg * price_per_kg
ALTER TABLE public.procurement_batches 
DROP COLUMN total_price;

ALTER TABLE public.procurement_batches 
ADD COLUMN total_price numeric GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED;