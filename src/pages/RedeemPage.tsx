import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import { supabase } from '@/integrations/supabase/client';
import StepLayout from '@/components/StepLayout';
import { Gift, ShoppingBag, Ticket, Leaf, Sparkles, Star, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { sendOrderNotification } from '@/lib/twilioService';
import { saveRewardTicket } from '@/lib/rewardTickets';
import { motion } from 'framer-motion';

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

const redeemOptions = [
  {
    id: 'shopping-voucher',
    label: 'Shopping Voucher',
    description: 'Redeem for Amazon, Flipkart, or Myntra gift vouchers',
    icon: ShoppingBag,
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/20',
    bonus: '+10% bonus',
    bonusColor: 'text-violet-400',
  },
  {
    id: 'gift-card',
    label: 'Gift Card',
    description: 'Swiggy, Zomato, or BigBasket gift cards for daily needs',
    icon: Gift,
    gradient: 'from-pink-500 to-rose-600',
    glow: 'shadow-pink-500/20',
    bonus: '+5% bonus',
    bonusColor: 'text-pink-400',
  },
  {
    id: 'eco-points',
    label: 'Eco Points',
    description: 'Earn green points redeemable at partner eco-stores',
    icon: Leaf,
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
    bonus: '+15% bonus',
    bonusColor: 'text-emerald-400',
  },
  {
    id: 'movie-tickets',
    label: 'Movie Tickets',
    description: 'BookMyShow vouchers for movies, events & more',
    icon: Ticket,
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/20',
    bonus: '+8% bonus',
    bonusColor: 'text-amber-400',
  },
];

const RedeemPage = () => {
  const navigate = useNavigate();
  const { state, update } = useRecycle();
  const [selectedRedeem, setSelectedRedeem] = useState(state.redeemOption || '');

  const lineItems = state.selectedClothes.map((id) => ({
    id,
    label: clothLabels[id] || id,
    qty: state.clothQuantities[id] || 1,
    price: priceMap[id] || 50,
  }));

  const total = lineItems.reduce((sum, item) => sum + item.qty * item.price, 0);

  // Calculate bonus based on redeem option
  const bonusPercent = selectedRedeem === 'shopping-voucher' ? 10
    : selectedRedeem === 'gift-card' ? 5
    : selectedRedeem === 'eco-points' ? 15
    : selectedRedeem === 'movie-tickets' ? 8
    : 0;
  const bonusAmount = Math.round(total * bonusPercent / 100);
  const redeemTotal = total + bonusAmount;

  const handleSubmit = async () => {
    const orderId = 'RC' + Date.now().toString().slice(-8);
    const totalItems = lineItems.reduce((s, i) => s + i.qty, 0);

    const orderData = {
      order_id: orderId,
      phone: state.contactPhone,
      gender: state.gender || null,
      age_range: state.ageRange || null,
      selected_clothes: state.selectedClothes,
      cloth_photos: state.clothPhotos || [],
      cloth_quantities: state.clothQuantities as any,
      district: state.district,
      category: state.category,
      selected_shop: state.selectedShop,
      address: state.address,
      contact_phone: state.contactPhone,
      pickup_date: state.pickupDate,
      pickup_time: state.pickupTime,
      payment_method: `redeem:${selectedRedeem}`,
      total_items: totalItems,
      total_amount: redeemTotal,
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

    update({
      paymentMethod: `redeem:${selectedRedeem}`,
      redeemOption: selectedRedeem,
      orderId,
    });

    // Save reward ticket based on redeem total
    saveRewardTicket(orderId, redeemTotal);

    // Send notification (non-blocking)
    sendOrderNotification({
      phone: state.contactPhone,
      orderId,
      district: state.district,
      category: state.category,
      totalItems,
      totalAmount: redeemTotal,
      pickupDate: state.pickupDate,
      pickupTime: state.pickupTime,
      selectedShop: state.selectedShop,
      paymentMethod: `redeem:${selectedRedeem}`,
    }).then((result) => {
      if (result.success) {
        toast.success(`Order confirmation sent via WhatsApp! 📱`);
      }
    });

    // Notify shop owner
    if (state.selectedShop) {
      try {
        const { data: shopData } = await supabase
          .from('shop_owners')
          .select('mobile')
          .eq('shop_name', state.selectedShop)
          .limit(1);

        const shopMobile = shopData?.[0]?.mobile;
        if (!shopMobile) throw new Error('Shop not found in Supabase');

        sendOrderNotification({
          phone: shopMobile,
          orderId,
          district: state.district,
          category: state.category,
          totalItems,
          totalAmount: redeemTotal,
          pickupDate: state.pickupDate,
          pickupTime: state.pickupTime,
          selectedShop: state.selectedShop,
          paymentMethod: `redeem:${selectedRedeem}`,
        });
      } catch {
        // Fallback: check localStorage for shop owner mobile
        const localShops = JSON.parse(localStorage.getItem('eco_local_shop_owners') || '[]');
        const localShop = localShops.find((s: any) => s.shop_name === state.selectedShop);
        if (localShop?.mobile) {
          sendOrderNotification({
            phone: localShop.mobile,
            orderId,
            district: state.district,
            category: state.category,
            totalItems,
            totalAmount: redeemTotal,
            pickupDate: state.pickupDate,
            pickupTime: state.pickupTime,
            selectedShop: state.selectedShop,
            paymentMethod: `redeem:${selectedRedeem}`,
          });
        }
      }
    }

    toast.success('Order placed successfully! 🎉');
    navigate('/thankyou');
  };

  const selectedOption = redeemOptions.find(o => o.id === selectedRedeem);

  return (
    <StepLayout
      step={5}
      totalSteps={6}
      title="Redeem Rewards"
      subtitle="Choose how to redeem your earnings"
      onNext={handleSubmit}
      onBack={() => navigate('/pricing')}
      nextDisabled={!selectedRedeem}
      nextLabel="Redeem & Submit"
    >
      <div className="space-y-5">
        {/* Points Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-5 text-white"
        >
          <div className="absolute top-0 right-0 opacity-10">
            <Crown className="w-32 h-32 -mt-4 -mr-4" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium text-white/80">Your Reward Points</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">{total}</span>
              <span className="text-lg text-white/70">pts</span>
            </div>
            {bonusAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-2 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-sm font-semibold">+{bonusAmount} bonus pts = {redeemTotal} total</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Items Breakdown (Compact) */}
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
            </div>
          ))}
        </div>

        {/* Redeem Options */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Choose Reward Type
          </label>
          <div className="grid grid-cols-1 gap-3">
            {redeemOptions.map((option, i) => {
              const isSelected = selectedRedeem === option.id;
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => setSelectedRedeem(option.id)}
                  className={`relative w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                    isSelected
                      ? `border-transparent bg-gradient-to-r ${option.gradient} text-white shadow-lg ${option.glow}`
                      : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/20 backdrop-blur-sm'
                        : `bg-gradient-to-br ${option.gradient} shadow-md`
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-white'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-foreground'}`}>
                          {option.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : `bg-accent ${option.bonusColor}`
                        }`}>
                          {option.bonus}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected Summary */}
        {selectedOption && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-accent/50 rounded-xl p-4 border border-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">You'll receive</p>
                <p className="text-lg font-bold text-foreground flex items-center gap-2">
                  {selectedOption.label}
                  <span className="text-sm font-medium text-primary">worth ₹{redeemTotal}</span>
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedOption.gradient} flex items-center justify-center shadow-md`}>
                <selectedOption.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </StepLayout>
  );
};

export default RedeemPage;
