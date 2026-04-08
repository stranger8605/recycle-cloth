-- Add cloth_photos column to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cloth_photos TEXT[] DEFAULT '{}';
