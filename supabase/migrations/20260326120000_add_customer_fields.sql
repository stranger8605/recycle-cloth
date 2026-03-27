-- Add new fields to customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for customer photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-photos', 'customer-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to the customer-photos bucket
CREATE POLICY "Allow public upload customer photos"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'customer-photos');

-- Allow public read access to customer photos
CREATE POLICY "Allow public read customer photos"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'customer-photos');
