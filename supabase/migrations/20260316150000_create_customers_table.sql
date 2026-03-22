
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  mobile_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow public insert for registration
CREATE POLICY "Allow public insert customers" ON public.customers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow public select for login verification
CREATE POLICY "Allow public select customers" ON public.customers
  FOR SELECT TO anon, authenticated USING (true);
