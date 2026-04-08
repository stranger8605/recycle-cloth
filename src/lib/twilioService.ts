/**
 * OTP Service with WhatsApp delivery via Twilio Sandbox.
 * - Sends OTP to the user's WhatsApp via Twilio WhatsApp Sandbox
 * - Falls back to on-screen display if WhatsApp delivery fails
 * - Verifies OTP from in-memory store
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

// ─── In-memory OTP store ────────────────────────────────────────────
interface OtpEntry {
  code: string;
  expiresAt: number; // timestamp ms
}

const otpStore = new Map<string, OtpEntry>();

// ─── Twilio credentials from env ────────────────────────────────────
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || '+14155238886';

/**
 * Send a WhatsApp message via Twilio API (using Vite proxy to avoid CORS).
 */
async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn('⚠️ Twilio credentials not configured. Set VITE_TWILIO_ACCOUNT_SID and VITE_TWILIO_AUTH_TOKEN in .env');
    return false;
  }

  try {
    // Format phone: add country code 91 for India if not present
    const fullPhone = phone.length === 10 ? `+91${phone}` : phone.startsWith('+') ? phone : `+${phone}`;

    // Twilio API endpoint (proxied via Vite to avoid CORS)
    const url = `/api/twilio/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const body = new URLSearchParams({
      To: `whatsapp:${fullPhone}`,
      From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      Body: message,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (response.ok || response.status === 201) {
      console.log(`✅ WhatsApp message sent to ${phone}`, data.sid);
      return true;
    } else {
      console.warn(`⚠️ Twilio WhatsApp send failed:`, data.message || data);
      return false;
    }
  } catch (err: any) {
    console.warn('⚠️ WhatsApp send error:', err.message);
    return false;
  }
}

/**
 * Generate a 6-digit OTP, store in memory, and send via WhatsApp.
 * Returns the OTP code so the UI can display it as fallback.
 */
export async function sendOtp(
  phone: string
): Promise<{ success: boolean; code?: string; sentViaWhatsApp?: boolean; error?: string }> {
  try {
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return { success: false, error: 'Invalid phone number. Must be 10 digits.' };
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min expiry

    // Store in memory
    otpStore.set(phone, { code, expiresAt });

    console.log(`📱 OTP for ${phone}: ${code}`);

    // Try to send via Twilio WhatsApp Sandbox
    const whatsAppMessage = `🌿 *EcoThreads* - Your OTP\n\nYour verification code is: *${code}*\n\nThis code expires in 10 minutes.\nDo not share this code with anyone.`;

    const sentViaWhatsApp = await sendWhatsAppMessage(phone, whatsAppMessage);

    if (sentViaWhatsApp) {
      console.log('✅ OTP sent via WhatsApp successfully!');
    } else {
      console.log('ℹ️ WhatsApp delivery failed. OTP displayed on screen.');
    }

    return { success: true, code, sentViaWhatsApp };
  } catch (err: any) {
    console.error('sendOtp exception:', err);
    return { success: false, error: err.message || 'Failed to generate OTP' };
  }
}

/**
 * Verify an OTP code from the in-memory store.
 */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    if (!phone || !code) {
      return { verified: false, error: 'Phone and code are required' };
    }

    const entry = otpStore.get(phone);

    if (!entry) {
      return { verified: false, error: 'No OTP found. Please request a new one.' };
    }

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phone);
      return { verified: false, error: 'OTP has expired. Please request a new one.' };
    }

    // Check code
    if (entry.code !== code) {
      return { verified: false, error: 'Invalid OTP. Please check and try again.' };
    }

    // Valid — remove so it can't be reused
    otpStore.delete(phone);
    return { verified: true };
  } catch (err: any) {
    console.error('verifyOtp exception:', err);
    return { verified: false, error: err.message || 'Verification error' };
  }
}

/**
 * Send order confirmation via WhatsApp (and console log as fallback).
 */
export async function sendOrderNotification(
  details: OrderNotificationData
): Promise<{ success: boolean; channel?: string; error?: string }> {
  try {
    const isDonation = details.category === 'orphanage';

    let message: string;
    if (isDonation) {
      message =
        `🌿 *EcoThreads - Donation Confirmed!*\n\n` +
        `📦 Order: *${details.orderId}*\n` +
        `📍 District: ${details.district}\n` +
        `👕 Items: ${details.totalItems}\n` +
        `📅 Pickup: ${details.pickupDate || 'Soon'} ${details.pickupTime || ''}\n\n` +
        `Thank you for your generous donation! 💚`;
    } else {
      message =
        `🌿 *EcoThreads - Order Confirmed!*\n\n` +
        `📦 Order: *${details.orderId}*\n` +
        `📍 District: ${details.district}\n` +
        `🏪 Shop: ${details.selectedShop || 'N/A'}\n` +
        `👕 Items: ${details.totalItems}\n` +
        `💰 Earnings: ₹${details.totalAmount}\n` +
        `💳 Payment: ${details.paymentMethod || 'N/A'}\n` +
        `📅 Pickup: ${details.pickupDate || 'Soon'} ${details.pickupTime || ''}\n\n` +
        `Your pickup will be arranged within 24 hours! ♻️`;
    }

    // Try WhatsApp first
    const sentViaWhatsApp = await sendWhatsAppMessage(details.phone, message);

    // Always log to console
    console.log(message);

    return {
      success: true,
      channel: sentViaWhatsApp ? 'whatsapp' : 'local',
    };
  } catch (err: any) {
    console.error('sendOrderNotification exception:', err);
    return { success: false, error: err.message || 'Notification error' };
  }
}
