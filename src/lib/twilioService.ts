import { supabase } from '@/integrations/supabase/client';

/**
 * Twilio Service - handles OTP and notification operations
 * All calls go through Supabase PostgreSQL functions (RPC) to keep Twilio credentials secure.
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
 * Send OTP to a phone number via SMS
 */
export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('send_otp_sms', {
      phone_number: phone,
    });

    if (error) {
      console.error('sendOtp error:', error);
      return { success: false, error: error.message || 'Failed to send OTP' };
    }

    const result = data as any;
    if (result?.success) {
      return { success: true };
    } else {
      return { success: false, error: result?.error || 'Failed to send OTP' };
    }
  } catch (err: any) {
    console.error('sendOtp exception:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Verify an OTP code
 */
export async function verifyOtp(phone: string, code: string): Promise<{ verified: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('verify_otp_code', {
      phone_number: phone,
      otp_code: code,
    });

    if (error) {
      console.error('verifyOtp error:', error);
      return { verified: false, error: error.message || 'Verification failed' };
    }

    const result = data as any;
    return {
      verified: result?.verified === true,
      error: result?.error,
    };
  } catch (err: any) {
    console.error('verifyOtp exception:', err);
    return { verified: false, error: err.message || 'Network error' };
  }
}

/**
 * Send order confirmation notification via SMS
 * This is non-blocking — failures are logged but don't prevent the order flow.
 */
export async function sendOrderNotification(details: OrderNotificationData): Promise<{ success: boolean; channel?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('send_order_notification', {
      phone_number: details.phone,
      order_id: details.orderId,
      district: details.district || '',
      category: details.category || '',
      total_items: details.totalItems || 0,
      total_amount: details.totalAmount || 0,
      pickup_date: details.pickupDate || '',
      pickup_time: details.pickupTime || '',
      selected_shop: details.selectedShop || '',
      payment_method: details.paymentMethod || '',
    });

    if (error) {
      console.error('sendOrderNotification error:', error);
      return { success: false, error: error.message || 'Failed to send notification' };
    }

    const result = data as any;
    if (result?.success) {
      return { success: true, channel: result?.channel };
    } else {
      return { success: false, error: result?.error };
    }
  } catch (err: any) {
    console.error('sendOrderNotification exception:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}
