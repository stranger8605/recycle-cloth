-- Create otp_codes table for storing OTP verification codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage OTP codes (used by edge functions)
CREATE POLICY "Service role can manage otp_codes"
  ON public.otp_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_otp_codes_phone ON public.otp_codes (phone);

-- Auto-cleanup expired OTPs (runs on insert)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_expired_otps
  AFTER INSERT ON public.otp_codes
  EXECUTE FUNCTION cleanup_expired_otps();
