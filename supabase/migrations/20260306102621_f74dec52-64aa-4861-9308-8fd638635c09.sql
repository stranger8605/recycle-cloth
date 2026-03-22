
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  phone TEXT,
  gender TEXT,
  age_range TEXT,
  selected_clothes TEXT[] DEFAULT '{}',
  cloth_quantities JSONB DEFAULT '{}',
  district TEXT,
  category TEXT,
  selected_shop TEXT,
  address TEXT,
  contact_phone TEXT,
  pickup_date TEXT,
  pickup_time TEXT,
  payment_method TEXT,
  total_items INTEGER DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert orders (public-facing app)
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read orders (for admin view - will secure later)
CREATE POLICY "Anyone can read orders" ON public.orders
  FOR SELECT USING (true);

-- Allow updates
CREATE POLICY "Anyone can update orders" ON public.orders
  FOR UPDATE USING (true);
