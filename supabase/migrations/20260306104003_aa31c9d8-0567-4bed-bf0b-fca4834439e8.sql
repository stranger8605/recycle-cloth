
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;

-- Recreate as permissive policies
CREATE POLICY "Allow public insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public select" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public update" ON public.orders FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Allow public delete" ON public.orders FOR DELETE TO anon, authenticated USING (true);
