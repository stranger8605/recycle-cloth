import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import { supabase } from '@/integrations/supabase/client';
import StepLayout from '@/components/StepLayout';
import { Ticket, Tag, Store, CakeSlice, Sparkles, Film, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { sendOrderNotification } from '@/lib/twilioService';
import { saveRewardTicket, getRewardForAmount } from '@/lib/rewardTickets';

const priceMap: Record<string, number> = {
  'cotton-shirt': 50,
  'jeans': 100,
  'saree': 150,
  'kurta': 80,
  'jacket': 120,
  't-shirt': 40,
  'trousers': 70,
  'others': 60,
};

const clothLabels: Record<string, string> = {
  'cotton-shirt': 'Cotton Shirts',
  'jeans': 'Jeans',
  'saree': 'Sarees',
  'kurta': 'Kurtas',
  'jacket': 'Jackets',
  't-shirt': 'T-Shirts',
  'trousers': 'Trousers',
  'others': 'Others',
};

const PricingPage = () => {
  const navigate = useNavigate();
  const { state, update } = useRecycle();

  const qm = state.qualityMultiplier || 1.0;
  const qualityLabel = qm >= 1.2 ? 'Excellent' : qm >= 0.95 ? 'Good' : qm >= 0.75 ? 'Fair' : 'Poor';
  const qualityColor = qm >= 1.2 ? 'text-green-600 bg-green-100' : qm >= 0.95 ? 'text-blue-600 bg-blue-100' : qm >= 0.75 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100';
  const hasQuality = state.clothPhotos && state.clothPhotos.length > 0 && qm !== 1.0;

  const lineItems = state.selectedClothes.map((id) => ({
    id,
    label: clothLabels[id] || id,
    qty: state.clothQuantities[id] || 1,
    basePrice: priceMap[id] || 50,
    price: Math.round((priceMap[id] || 50) * qm),
  }));

  const total = lineItems.reduce((sum, item) => sum + item.qty * item.price, 0);

  // Calculate reward preview
  const reward = getRewardForAmount(total);

  const handleNext = async () => {
    const orderId = 'RC' + Date.now().toString().slice(-8);
    const totalItems = lineItems.reduce((s, i) => s + i.qty, 0);

    // Payment method is now always ticket/discount based
    const paymentMethod = reward.type === 'ticket'
      ? `ticket:${reward.count}`
      : `discount:${reward.discountPercent}%`;

    const orderData = {
      order_id: orderId,
      phone: state.contactPhone,
      gender: state.gender || null,
      age_range: state.ageRange || null,
      selected_clothes: state.selectedClothes,
      cloth_photos: state.clothPhotos || [],
      cloth_quantities: state.clothQuantities,
      district: state.district,
      category: state.category,
      selected_shop: state.selectedShop,
      address: state.address,
      contact_phone: state.contactPhone,
      pickup_date: state.pickupDate,
      pickup_time: state.pickupTime,
      payment_method: paymentMethod,
      total_items: totalItems,
      total_amount: total,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('orders').insert(orderData as any);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Supabase unreachable, saving order locally:', err.message);
      const localOrders = JSON.parse(localStorage.getItem('eco_local_orders') || '[]');
      localOrders.push(orderData);
      localStorage.setItem('eco_local_orders', JSON.stringify(localOrders));
    }

    // Save reward ticket
    saveRewardTicket(orderId, total);

    update({ paymentMethod, orderId });

    // Send notification (non-blocking)
    sendOrderNotification({
      phone: state.contactPhone,
      orderId,
      district: state.district,
      category: state.category,
      totalItems,
      totalAmount: total,
      pickupDate: state.pickupDate,
      pickupTime: state.pickupTime,
      selectedShop: state.selectedShop,
      paymentMethod,
    }).then((result) => {
      if (result.success) {
        toast.success(`Order confirmation sent via WhatsApp! 📱`);
      }
    });

    // Notify shop owner
    if (state.selectedShop) {
      supabase
        .from('shop_owners')
        .select('mobile')
        .eq('shop_name', state.selectedShop)
        .limit(1)
        .then(({ data: shopData, error: shopError }) => {
          let shopMobile = shopData?.[0]?.mobile;
          if (shopError || !shopMobile) {
            const localShops = JSON.parse(localStorage.getItem('eco_local_shop_owners') || '[]');
            const localShop = localShops.find((s: any) => s.shop_name === state.selectedShop);
            shopMobile = localShop?.mobile;
          }
          if (shopMobile) {
            sendOrderNotification({
              phone: shopMobile,
              orderId,
              district: state.district,
              category: state.category,
              totalItems,
              totalAmount: total,
              pickupDate: state.pickupDate,
              pickupTime: state.pickupTime,
              selectedShop: state.selectedShop,
              paymentMethod,
            });
          }
        });
    }

    navigate('/thankyou');
  };

  return (
    <StepLayout
      step={5}
      totalSteps={6}
      title="Your Rewards"
      subtitle="See what you've earned for recycling!"
      onNext={handleNext}
      onBack={() => navigate('/quantity')}
      nextLabel="Claim Rewards 🎉"
    >
      <div className="space-y-4">
        {/* Quality Badge */}
        {hasQuality && (
          <div className={`flex items-center justify-between p-3 rounded-xl border ${qualityColor.replace('text-', 'border-').split(' ')[0]}/30 ${qualityColor.split(' ')[1]}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">📸 Photo Quality:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${qualityColor}`}>
                {qualityLabel}
              </span>
            </div>
            <span className="text-xs font-medium">
              {qm > 1 ? `+${Math.round((qm - 1) * 100)}% bonus` : qm < 1 ? `${Math.round((1 - qm) * 100)}% reduced` : 'Standard rate'}
            </span>
          </div>
        )}

        {/* Line items */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-3 bg-muted border-b border-border">
            <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground">
              <span className="col-span-2">Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Points</span>
            </div>
          </div>
          {lineItems.map((item) => (
            <div key={item.id} className="p-3 border-b border-border last:border-0">
              <div className="grid grid-cols-4 text-sm items-center">
                <span className="col-span-2 font-medium text-foreground">{item.label}</span>
                <span className="text-center text-muted-foreground">{item.qty}</span>
                <span className="text-right font-medium text-foreground">{item.qty * item.price} pts</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {hasQuality && item.basePrice !== item.price ? (
                  <>
                    <span className="text-xs text-muted-foreground line-through">{item.basePrice} pts/piece</span>
                    <span className={`text-xs font-medium ${qm >= 1 ? 'text-green-600' : 'text-red-500'}`}>{item.price} pts/piece</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">{item.price} pts/piece</span>
                )}
              </div>
            </div>
          ))}
          <div className="p-3 bg-accent/50">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">Total Points</span>
              <span className="text-xl font-bold text-primary flex items-center gap-1">
                <Sparkles className="w-5 h-5" /> {total} pts
              </span>
            </div>
          </div>
        </div>

        {/* 🎟️ Reward Preview Card */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Your Reward
          </label>

          {reward.type === 'ticket' ? (
            /* Ticket reward */
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-5 text-white shadow-lg">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/20" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="w-5 h-5 text-yellow-200" />
                  <span className="text-sm font-semibold text-white/90">
                    {total >= 1000 ? '🔥 Premium Reward!' : '⭐ Reward!'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-4xl font-extrabold">{reward.count}</p>
                    <p className="text-sm text-white/80 font-medium">
                      {reward.count === 1 ? 'Ticket' : 'Tickets'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: reward.count }).map((_, i) => (
                      <div
                        key={i}
                        className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                      >
                        <Ticket className="w-8 h-8 text-yellow-200" />
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-white/70 font-medium uppercase tracking-wider mb-1.5">Redeemable at</p>
                <div className="flex flex-wrap gap-1.5">
                  {reward.redeemableAt.map((place) => (
                    <span key={place} className="bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1">
                      {place === 'Dress Shop' && <Store className="w-3 h-3" />}
                      {place === 'Bakery' && <CakeSlice className="w-3 h-3" />}
                      {place === 'Movie Theater' && <Film className="w-3 h-3" />}
                      {place === 'Restaurant' && <UtensilsCrossed className="w-3 h-3" />}
                      {place}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Discount reward */
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-5 text-white shadow-lg">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/20" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-5 h-5 text-emerald-200" />
                  <span className="text-sm font-semibold text-white/90">🏷️ Discount Coupon!</span>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-4xl font-extrabold">{reward.discountPercent}%</p>
                    <p className="text-sm text-white/80 font-medium">OFF</p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Tag className="w-9 h-9 text-emerald-200" />
                  </div>
                </div>

                <p className="text-[11px] text-white/70 font-medium uppercase tracking-wider mb-1.5">Valid at</p>
                <div className="flex flex-wrap gap-1.5">
                  {reward.redeemableAt.map((place) => (
                    <span key={place} className="bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1">
                      {place === 'Dress Shop' && <Store className="w-3 h-3" />}
                      {place === 'Bakery' && <CakeSlice className="w-3 h-3" />}
                      {place}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reward rules */}
        <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">🎯 How rewards work:</p>
          <div className="grid grid-cols-1 gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-5 text-center">🎟️</span>
              <span><b className="text-foreground">1000+ pts</b> → 2 Tickets (Dress Shop, Bakery, Movies & more)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-5 text-center">🎟️</span>
              <span><b className="text-foreground">500–999 pts</b> → 1 Ticket</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-5 text-center">🏷️</span>
              <span><b className="text-foreground">Under 500 pts</b> → Discount at Dress Shop or Bakery</span>
            </div>
          </div>
        </div>
      </div>
    </StepLayout>
  );
};

export default PricingPage;
