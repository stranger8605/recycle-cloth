-- Add district column to customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS district text;
