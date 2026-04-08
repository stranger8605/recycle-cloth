import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, CheckCircle2, XCircle, ChevronRight, ArrowLeft, Ticket, Tag, Recycle, Sparkles, Calendar, MapPin, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, CustomerUser } from '@/context/AuthContext';
import { getActiveTickets, RewardTicket } from '@/lib/rewardTickets';

interface Order {
  order_id: string;
  selected_clothes: string[] | null;
  cloth_quantities: Record<string, number> | null;
  district: string | null;
  category: string | null;
  selected_shop: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  payment_method: string | null;
  total_items: number | null;
  total_amount: number | null;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 },
  picked_up: { label: 'Picked Up', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Package },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

const clothLabels: Record<string, string> = {
  'cotton-shirt': 'Cotton Shirts', 'jeans': 'Jeans', 'saree': 'Sarees',
  'kurta': 'Kurtas', 'jacket': 'Jackets', 't-shirt': 'T-Shirts',
  'trousers': 'Trousers', 'others': 'Others',
};

const CustomerOrdersPage = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const customer = auth.user as CustomerUser;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tickets, setTickets] = useState<RewardTicket[]>([]);

  useEffect(() => {
    if (!auth.isLoggedIn || auth.role !== 'customer') {
      navigate('/customer/login');
      return;
    }
    fetchOrders();
    setTickets(getActiveTickets());
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const phone = customer?.mobile || '';

    let allOrders: Order[] = [];

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('contact_phone', phone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      allOrders = (data as unknown as Order[]) || [];
    } catch {
      // Supabase unreachable — use local only
    }

    // Merge with local orders
    const localOrders: Order[] = JSON.parse(localStorage.getItem('eco_local_orders') || '[]')
      .filter((o: any) => o.contact_phone === phone || o.phone === phone)
      .map((o: any) => ({
        order_id: o.order_id,
        selected_clothes: o.selected_clothes || null,
        cloth_quantities: o.cloth_quantities || null,
        district: o.district || null,
        category: o.category || null,
        selected_shop: o.selected_shop || null,
        pickup_date: o.pickup_date || null,
        pickup_time: o.pickup_time || null,
        payment_method: o.payment_method || null,
        total_items: o.total_items || null,
        total_amount: o.total_amount || null,
        status: o.status || 'pending',
        created_at: o.created_at || new Date().toISOString(),
      }));

    const supabaseIds = new Set(allOrders.map(o => o.order_id));
    const uniqueLocal = localOrders.filter(o => !supabaseIds.has(o.order_id));
    const combined = [...allOrders, ...uniqueLocal].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setOrders(combined);
    setLoading(false);
  };

  const totalTickets = tickets.filter(t => t.type === 'ticket').reduce((s, t) => s + t.count, 0);
  const totalDiscounts = tickets.filter(t => t.type === 'discount').length;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  const getRewardLabel = (method: string | null) => {
    if (!method) return '—';
    if (method.startsWith('ticket:')) return `🎟️ ${method.replace('ticket:', '')} Ticket(s)`;
    if (method.startsWith('discount:')) return `🏷️ ${method.replace('discount:', '')} Discount`;
    if (method.startsWith('redeem:')) return `🎁 Redeem`;
    return method;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/clothes')}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">My Orders</h1>
              <p className="text-white/80 text-sm">Hi, {customer?.name || 'Customer'} 👋</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm text-center">
              <Package className="w-4 h-4 mx-auto mb-1 text-white/70" />
              <p className="text-lg font-bold">{orders.length}</p>
              <p className="text-[10px] text-white/70">Orders</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm text-center">
              <Ticket className="w-4 h-4 mx-auto mb-1 text-yellow-300" />
              <p className="text-lg font-bold">{totalTickets}</p>
              <p className="text-[10px] text-white/70">Tickets</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm text-center">
              <Tag className="w-4 h-4 mx-auto mb-1 text-emerald-200" />
              <p className="text-lg font-bold">{totalDiscounts}</p>
              <p className="text-[10px] text-white/70">Discounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Rewards */}
      {tickets.length > 0 && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">🎟️ Active Rewards</p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {tickets.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium border ${
                  ticket.type === 'ticket'
                    ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                }`}
              >
                {ticket.type === 'ticket' ? `🎟️ ${ticket.count} Ticket` : `🏷️ ${ticket.discountPercent}% Off`}
                <span className="text-[10px] ml-1 opacity-70">
                  ({ticket.redeemableAt.slice(0, 2).join(', ')})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Order History</h2>
          <button
            onClick={fetchOrders}
            className="text-xs text-primary font-medium hover:underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <Recycle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-semibold text-foreground mb-1">No orders yet</p>
            <p className="text-sm text-muted-foreground mb-4">Start recycling to earn tickets & discounts!</p>
            <button
              onClick={() => navigate('/clothes')}
              className="px-6 py-2.5 rounded-xl font-medium text-primary-foreground eco-gradient eco-shadow hover:opacity-90 transition-opacity"
            >
              Start Recycling →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order, i) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <motion.button
                  key={order.order_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full bg-card rounded-xl border border-border p-4 text-left hover:shadow-md hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-foreground">{order.order_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" /> {order.total_items || 0} items
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {order.total_amount || 0} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{formatDate(order.created_at)}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Start Recycling Button */}
        {orders.length > 0 && (
          <button
            onClick={() => navigate('/clothes')}
            className="w-full py-3 rounded-xl font-semibold text-primary-foreground eco-gradient eco-shadow hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-4"
          >
            <Recycle className="w-5 h-5" /> Recycle More Clothes
          </button>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-card rounded-t-2xl sm:rounded-2xl border border-border p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-foreground">Order {selectedOrder.order_id}</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-lg hover:bg-accent">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Status Badge */}
              {(() => {
                const config = statusConfig[selectedOrder.status] || statusConfig.pending;
                return (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${config.color}`}>
                    <config.icon className="w-4 h-4" />
                    {config.label}
                  </div>
                );
              })()}

              <div className="space-y-3 text-sm">
                {[
                  ['📅 Date', formatDate(selectedOrder.created_at)],
                  ['📍 District', selectedOrder.district],
                  ['🏪 Shop', selectedOrder.selected_shop],
                  ['📦 Total Items', selectedOrder.total_items],
                  ['⭐ Points', `${selectedOrder.total_amount || 0} pts`],
                  ['🎟️ Reward', getRewardLabel(selectedOrder.payment_method)],
                  ['📋 Category', selectedOrder.category === 'orphanage' ? '🏠 Donation' : '♻️ Recycle'],
                  ['🗓️ Pickup', `${selectedOrder.pickup_date || ''} ${selectedOrder.pickup_time || ''}`.trim() || '—'],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{String(label)}</span>
                    <span className="font-medium text-foreground">{String(value || '—')}</span>
                  </div>
                ))}

                {/* Clothes breakdown */}
                {selectedOrder.cloth_quantities && Object.keys(selectedOrder.cloth_quantities).length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                    <div className="space-y-1.5">
                      {Object.entries(selectedOrder.cloth_quantities as Record<string, number>).map(([cloth, qty]) => (
                        <div key={cloth} className="flex justify-between items-center bg-accent/40 rounded-lg px-3 py-2">
                          <span className="text-foreground font-medium">{clothLabels[cloth] || cloth}</span>
                          <span className="text-muted-foreground">×{qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CustomerOrdersPage;
