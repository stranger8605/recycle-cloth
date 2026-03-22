-- ============================================================
-- TWILIO WHATSAPP - FIXED FUNCTIONS (uses http_post with auth in URL)
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Send OTP via WhatsApp (FIXED)
CREATE OR REPLACE FUNCTION public.send_otp_sms(phone_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp_code text;
  expiry timestamptz;
  twilio_url text := 'https://ACa135d256aca01d12bc425a7dd1580765:1fc3be9855206d7423f0e04afa177cc0@api.twilio.com/2010-04-01/Accounts/ACa135d256aca01d12bc425a7dd1580765/Messages.json';
  req_body text;
  response extensions.http_response;
BEGIN
  IF phone_number IS NULL OR length(phone_number) != 10 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid phone number');
  END IF;

  otp_code := lpad(floor(random() * 1000000)::text, 6, '0');
  expiry := now() + interval '10 minutes';

  DELETE FROM public.otp_codes WHERE phone = phone_number;
  INSERT INTO public.otp_codes (phone, code, expires_at)
  VALUES (phone_number, otp_code, expiry);

  req_body := 'To=whatsapp%3A%2B91' || phone_number ||
              '&From=whatsapp%3A%2B14155238886' ||
              '&Body=Your+EcoThreads+code+is+' || otp_code || '+valid+for+10+mins';

  SELECT * INTO response FROM extensions.http_post(
    twilio_url,
    req_body,
    'application/x-www-form-urlencoded'
  );

  IF response.status >= 200 AND response.status < 300 THEN
    RETURN json_build_object('success', true, 'message', 'OTP sent via WhatsApp');
  ELSE
    RETURN json_build_object('success', false, 'error', 'WhatsApp failed', 'status', response.status, 'details', left(response.content, 300));
  END IF;
END;
$$;

-- Verify OTP (unchanged)
CREATE OR REPLACE FUNCTION public.verify_otp_code(phone_number text, otp_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp_record record;
BEGIN
  IF phone_number IS NULL OR otp_code IS NULL THEN
    RETURN json_build_object('verified', false, 'error', 'Phone and code are required');
  END IF;

  SELECT * INTO otp_record
  FROM public.otp_codes
  WHERE phone = phone_number AND code = otp_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('verified', false, 'error', 'Invalid OTP');
  END IF;

  IF otp_record.expires_at < now() THEN
    DELETE FROM public.otp_codes WHERE id = otp_record.id;
    RETURN json_build_object('verified', false, 'error', 'OTP expired. Request a new one.');
  END IF;

  DELETE FROM public.otp_codes WHERE id = otp_record.id;
  RETURN json_build_object('verified', true);
END;
$$;

-- Send Order Notification via WhatsApp (FIXED)
CREATE OR REPLACE FUNCTION public.send_order_notification(
  phone_number text,
  order_id text,
  district text DEFAULT '',
  category text DEFAULT '',
  total_items int DEFAULT 0,
  total_amount int DEFAULT 0,
  pickup_date text DEFAULT '',
  pickup_time text DEFAULT '',
  selected_shop text DEFAULT '',
  payment_method text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  twilio_url text := 'https://ACa135d256aca01d12bc425a7dd1580765:1fc3be9855206d7423f0e04afa177cc0@api.twilio.com/2010-04-01/Accounts/ACa135d256aca01d12bc425a7dd1580765/Messages.json';
  req_body text;
  msg_body text;
  response extensions.http_response;
BEGIN
  IF phone_number IS NULL OR order_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Phone and order ID required');
  END IF;

  IF category = 'orphanage' THEN
    msg_body := 'EcoThreads+Donation+Confirmed!+Order+' || order_id ||
      '+District+' || replace(COALESCE(district, ''), ' ', '+') ||
      '+Items+' || total_items::text ||
      '+Pickup+' || replace(COALESCE(pickup_date, 'Soon'), ' ', '+') ||
      '+Thank+you+for+donating!';
  ELSE
    msg_body := 'EcoThreads+Order+Confirmed!+Order+' || order_id ||
      '+District+' || replace(COALESCE(district, ''), ' ', '+') ||
      '+Shop+' || replace(COALESCE(selected_shop, 'NA'), ' ', '+') ||
      '+Items+' || total_items::text ||
      '+Earnings+Rs' || total_amount::text ||
      '+Pickup+' || replace(COALESCE(pickup_date, 'Soon'), ' ', '+') ||
      '+Thank+you+for+recycling!';
  END IF;

  req_body := 'To=whatsapp%3A%2B91' || phone_number ||
              '&From=whatsapp%3A%2B14155238886' ||
              '&Body=' || msg_body;

  SELECT * INTO response FROM extensions.http_post(
    twilio_url,
    req_body,
    'application/x-www-form-urlencoded'
  );

  IF response.status >= 200 AND response.status < 300 THEN
    RETURN json_build_object('success', true, 'channel', 'whatsapp');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Notification failed', 'status', response.status);
  END IF;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.send_otp_sms(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_otp_code(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.send_order_notification(text, text, text, text, int, int, text, text, text, text) TO anon;
