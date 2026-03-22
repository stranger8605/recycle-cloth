
CREATE TABLE public.shop_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  shop_location TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  mobile_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_owners ENABLE ROW LEVEL SECURITY;

-- Allow public insert for registration
CREATE POLICY "Allow public insert shop_owners" ON public.shop_owners
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow public select for login verification
CREATE POLICY "Allow public select shop_owners" ON public.shop_owners
  FOR SELECT TO anon, authenticated USING (true);
