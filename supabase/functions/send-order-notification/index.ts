import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      phone,
      orderId,
      district,
      category,
      totalItems,
      totalAmount,
      pickupDate,
      pickupTime,
      selectedShop,
      paymentMethod,
    } = await req.json();

    if (!phone || !orderId) {
      return new Response(
        JSON.stringify({ error: "Phone and orderId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER")!;
    const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "";

    const isDonation = category === "orphanage";

    // Build WhatsApp/SMS message
    let messageBody = "";
    if (isDonation) {
      messageBody = `🌿 *EcoThreads - Donation Confirmed!* 🙏\n\n` +
        `📋 *Order ID:* ${orderId}\n` +
        `📍 *District:* ${district}\n` +
        `👕 *Total Items:* ${totalItems}\n` +
        `🏠 *Type:* Free Donation to Orphanage\n` +
        `📅 *Pickup Date:* ${pickupDate || "Within 24 hours"}\n` +
        `⏰ *Pickup Time:* ${pickupTime || "TBD"}\n\n` +
        `Thank you for your generous contribution! 💚\nYour clothes will bring joy to children in need.`;
    } else {
      messageBody = `🌿 *EcoThreads - Order Confirmed!* ✅\n\n` +
        `📋 *Order ID:* ${orderId}\n` +
        `📍 *District:* ${district}\n` +
        `🏪 *Shop:* ${selectedShop || "N/A"}\n` +
        `👕 *Total Items:* ${totalItems}\n` +
        `💰 *Estimated Earnings:* ₹${totalAmount}\n` +
        `💳 *Payment:* ${paymentMethod || "N/A"}\n` +
        `📅 *Pickup Date:* ${pickupDate || "Within 24 hours"}\n` +
        `⏰ *Pickup Time:* ${pickupTime || "TBD"}\n\n` +
        `Your pickup will be arranged shortly. Thank you for recycling! ♻️`;
    }

    // Try WhatsApp first, fall back to SMS
    const useWhatsApp = !!TWILIO_WHATSAPP_NUMBER;
    const fromNumber = useWhatsApp
      ? `whatsapp:${TWILIO_WHATSAPP_NUMBER}`
      : TWILIO_PHONE_NUMBER;
    const toNumber = useWhatsApp
      ? `whatsapp:+91${phone}`
      : `+91${phone}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: toNumber,
        From: fromNumber,
        Body: messageBody,
      }),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioData);

      // If WhatsApp failed, try SMS as fallback
      if (useWhatsApp) {
        console.log("WhatsApp failed, trying SMS fallback...");
        const smsFallback = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: `+91${phone}`,
            From: TWILIO_PHONE_NUMBER,
            Body: messageBody,
          }),
        });

        const smsData = await smsFallback.json();
        if (!smsFallback.ok) {
          console.error("SMS fallback error:", smsData);
          return new Response(
            JSON.stringify({ error: "Failed to send notification", details: smsData.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, channel: "sms" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to send notification", details: twilioData.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, channel: useWhatsApp ? "whatsapp" : "sms" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
