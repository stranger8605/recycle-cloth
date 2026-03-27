import { supabase } from '@/integrations/supabase/client';

/**
 * Local OTP Service — generates OTPs locally, stores in Supabase `otp_codes` table,
 * and shows codes via toast (no Twilio / WhatsApp dependency).
 */

export interface OrderNotificationData {
  phone: string;
  orderId: string;
  district: string;
  category: string;
  totalItems: number;
  totalAmount?: number;
  pickupDate?: string;
  pickupTime?: string;
  selectedShop?: string;
  paymentMethod?: string;
}

/**
 * Generate and store a 6-digit OTP in the database.
 * Returns the OTP code so the UI can display it (dev/demo mode).
 */
export async function sendOtp(phone: string): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return { success: false, error: 'Invalid phone number. Must be 10 digits.' };
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry

    // Delete any existing OTPs for this phone
    await supabase.from('otp_codes').delete().eq('phone', phone);

    // Store new OTP
    const { error: insertError } = await supabase.from('otp_codes').insert({
      phone,
      code,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('OTP insert error:', insertError);
      return { success: false, error: 'Failed to generate OTP. Please try again.' };
    }

    console.log(`📱 OTP for ${phone}: ${code}`);
    return { success: true, code };
  } catch (err: any) {
    console.error('sendOtp exception:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Verify an OTP code against the database.
 */
export async function verifyOtp(phone: string, code: string): Promise<{ verified: boolean; error?: string }> {
  try {
    if (!phone || !code) {
      return { verified: false, error: 'Phone and code are required' };
    }

    // Look up OTP in database
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .limit(1);

    if (error) {
      console.error('verifyOtp error:', error);
      return { verified: false, error: 'Verification failed. Please try again.' };
    }

    if (!data || data.length === 0) {
      return { verified: false, error: 'Invalid OTP. Please check and try again.' };
    }

    const otpRecord = data[0];

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase.from('otp_codes').delete().eq('id', otpRecord.id);
      return { verified: false, error: 'OTP has expired. Please request a new one.' };
    }

    // Valid — delete so it can't be reused
    await supabase.from('otp_codes').delete().eq('id', otpRecord.id);
    return { verified: true };
  } catch (err: any) {
    console.error('verifyOtp exception:', err);
    return { verified: false, error: err.message || 'Network error' };
  }
}

/**
 * Show order confirmation as a local notification (no Twilio dependency).
 */
export async function sendOrderNotification(details: OrderNotificationData): Promise<{ success: boolean; channel?: string; error?: string }> {
  try {
    const isDonation = details.category === 'orphanage';

    if (isDonation) {
      console.log(
        `🌿 EcoThreads Donation Confirmed!\n` +
        `Order: ${details.orderId} | District: ${details.district}\n` +
        `Items: ${details.totalItems} | Pickup: ${details.pickupDate || 'Soon'}`
      );
    } else {
      console.log(
        `🌿 EcoThreads Order Confirmed!\n` +
        `Order: ${details.orderId} | District: ${details.district}\n` +
        `Shop: ${details.selectedShop || 'N/A'} | Items: ${details.totalItems}\n` +
        `Earnings: ₹${details.totalAmount} | Pickup: ${details.pickupDate || 'Soon'}`
      );
    }

    return { success: true, channel: 'local' };
  } catch (err: any) {
    console.error('sendOrderNotification exception:', err);
    return { success: false, error: err.message || 'Notification error' };
  }
}
