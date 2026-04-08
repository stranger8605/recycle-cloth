import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRecycle } from '@/context/RecycleContext';
import { CheckCircle2, Share2, Home, Download, Gift, Ticket, Tag, Sparkles, Store, CakeSlice } from 'lucide-react';
import { generateReceiptPdf } from '@/lib/generateReceiptPdf';
import { getAllTickets, RewardTicket, getRewardForAmount } from '@/lib/rewardTickets';
import { useState, useEffect } from 'react';

const priceMap: Record<string, number> = {
  'cotton-shirt': 50, 'jeans': 100, 'saree': 150, 'kurta': 80,
  'jacket': 120, 't-shirt': 40, 'trousers': 70, 'others': 60,
};

const ThankYouPage = () => {
  const navigate = useNavigate();
  const { state, reset } = useRecycle();
  const [earnedReward, setEarnedReward] = useState<RewardTicket | null>(null);

  const totalItems = Object.values(state.clothQuantities).reduce((s, q) => s + q, 0);
  const isDonation = state.category === 'orphanage';
  const isRedeem = state.paymentMethod?.startsWith('redeem');

  const totalAmount = Object.entries(state.clothQuantities).reduce((sum, [id, qty]) => {
    return sum + qty * (priceMap[id] || 50);
  }, 0);

  const redeemLabels: Record<string, string> = {
    'shopping-voucher': '🛒 Shopping Voucher',
    'gift-card': '🎁 Gift Card',
    'eco-points': '🌿 Eco Points',
    'movie-tickets': '🎬 Movie Tickets',
  };

  useEffect(() => {
    if (state.orderId && !isDonation) {
      const tickets = getAllTickets();
      const latest = tickets.find(t => t.orderId === state.orderId);
      if (latest) setEarnedReward(latest);
    }
  }, [state.orderId]);

  const reward = getRewardForAmount(totalAmount);

  const handleGoHome = () => {
    reset();
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
    >
      <div className="w-full max-w-sm text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <CheckCircle2 className="w-24 h-24 text-primary mx-auto mb-6" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isDonation ? 'Thank You for Donating! 🙏' : 'Thank You!'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isDonation
              ? 'Your clothes will bring joy to children in need. Pickup will be arranged within 24 hours.'
              : 'Your pickup will be arranged within 24 hours.'}
          </p>
        </motion.div>

        {/* Order Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-xl border border-border p-5 mb-4 text-left space-y-3"
        >
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Order ID</span>
            <span className="text-sm font-bold text-foreground">{state.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Items</span>
            <span className="text-sm font-medium text-foreground">{totalItems}</span>
          </div>
          {!isDonation && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment</span>
              <span className="text-sm font-medium text-foreground capitalize">
                {isRedeem ? redeemLabels[state.redeemOption] || 'Redeem' : state.paymentMethod}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">District</span>
            <span className="text-sm font-medium text-foreground">{state.district}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Category</span>
            <span className="text-sm font-medium text-foreground capitalize">{isDonation ? '🏠 Donation' : '🏪 Sell to Store'}</span>
          </div>
          {isDonation ? (
            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="text-lg font-bold text-primary">Free Donation 💚</span>
            </div>
          ) : isRedeem ? (
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reward</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Gift className="w-5 h-5" />
                  {redeemLabels[state.redeemOption] || 'Redeem'}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Value</span>
                <span className="text-lg font-bold text-primary">₹{totalAmount}</span>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Estimated Earnings</span>
              <span className="text-lg font-bold text-primary">₹{totalAmount}</span>
            </div>
          )}
        </motion.div>

        {/* 🎟️ Reward Ticket Card */}
        {!isDonation && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 150 }}
            className="mb-6"
          >
            {reward.type === 'ticket' ? (
              /* Ticket reward card */
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-5 text-white shadow-lg shadow-orange-500/25">
                {/* Decorative circles for ticket punch look */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />

                {/* Dashed divider */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/20" />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-yellow-200" />
                    <span className="text-sm font-semibold text-white/90">Reward Earned!</span>
                  </div>

                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-4xl font-extrabold tracking-tight">{reward.count}</p>
                      <p className="text-sm text-white/80 font-medium">
                        {reward.count === 1 ? 'Ticket' : 'Tickets'} Earned
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {Array.from({ length: reward.count }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ rotateY: 180, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          transition={{ delay: 1 + i * 0.2 }}
                          className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner"
                        >
                          <Ticket className="w-8 h-8 text-yellow-200" />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] text-white/70 font-medium uppercase tracking-wider">Redeemable at</p>
                    <div className="flex flex-wrap gap-1.5">
                      {reward.redeemableAt.map((place) => (
                        <span key={place} className="bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1">
                          {place === 'Dress Shop' && <Store className="w-3 h-3" />}
                          {place === 'Bakery' && <CakeSlice className="w-3 h-3" />}
                          {place === 'Movie Theater' && '🎬'}
                          {place === 'Restaurant' && '🍽️'}
                          {place}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Discount reward card */
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-5 text-white shadow-lg shadow-emerald-500/25">
                {/* Decorative circles */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/20" />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-5 h-5 text-emerald-200" />
                    <span className="text-sm font-semibold text-white/90">Discount Earned!</span>
                  </div>

                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-4xl font-extrabold tracking-tight">{reward.discountPercent}%</p>
                      <p className="text-sm text-white/80 font-medium">Discount Coupon</p>
                    </div>
                    <motion.div
                      initial={{ rotate: -20, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: 1, type: 'spring' }}
                      className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner"
                    >
                      <Tag className="w-9 h-9 text-emerald-200" />
                    </motion.div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] text-white/70 font-medium uppercase tracking-wider">Valid at</p>
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
              </div>
            )}

            {/* Ticket ID */}
            {earnedReward && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-xs text-muted-foreground mt-2"
              >
                Ticket ID: <span className="font-mono font-medium">{earnedReward.id}</span>
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isDonation ? 0.8 : 1.4 }}
          className="space-y-3"
        >
          <div className="flex gap-3">
            <button
              onClick={() => generateReceiptPdf({
                orderId: state.orderId,
                district: state.district,
                category: state.category,
                selectedShop: state.selectedShop,
                address: state.address,
                contactPhone: state.contactPhone,
                pickupDate: state.pickupDate,
                pickupTime: state.pickupTime,
                paymentMethod: state.paymentMethod,
                clothQuantities: state.clothQuantities,
              })}
              className="flex-1 py-3 rounded-xl border border-border bg-card text-foreground font-medium flex items-center justify-center gap-2 hover:bg-accent transition-colors"
            >
              <Download className="w-4 h-4" /> Receipt
            </button>
            <button className="flex-1 py-3 rounded-xl border border-border bg-card text-foreground font-medium flex items-center justify-center gap-2 hover:bg-accent transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
          <button
            onClick={handleGoHome}
            className="w-full py-3.5 rounded-xl font-semibold text-primary-foreground eco-gradient eco-shadow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" /> Back to Home
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ThankYouPage;
