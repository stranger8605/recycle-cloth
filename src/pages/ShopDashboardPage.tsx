import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Package, Clock, CheckCircle2, IndianRupee, LogOut, RefreshCw, Phone, MapPin, Calendar, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, ShopOwnerUser } from '@/context/AuthContext';
import { toast } from 'sonner';

const ShopDashboardPage = () => {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const shopOwner = auth.user as ShopOwnerUser;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  // Guard: redirect to auth if not logged in as shop owner
  useEffect(() => {
    if (!auth.isLoggedIn || auth.role !== 'shop_owner' || !shopOwner) {
      navigate('/auth');
    }
  }, [auth, navigate]);

  const shopName = shopOwner?.shop_name || '';

  const fetchOrders = async () => {
    if (!shopName) return;
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('selected_shop', shopName)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Merge with local orders
      const localOrders = JSON.parse(localStorage.getItem('eco_local_orders') || '[]');
      const localShopOrders = localOrders.filter(
        (o: any) => o.selected_shop === shopName
      );
      const supabaseIds = new Set((data || []).map((o: any) => o.order_id));
      const uniqueLocalOrders = localShopOrders.filter(
        (o: any) => !supabaseIds.has(o.order_id)
      );
      const allOrders = [...(data || []), ...uniqueLocalOrders].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(allOrders);
      setOfflineMode(false);
    } catch (err: any) {
      console.warn('Supabase unreachable, loading from localStorage:', err.message);
      setOfflineMode(true);
      const localOrders = JSON.parse(localStorage.getItem('eco_local_orders') || '[]');
      const localShopOrders = localOrders
        .filter((o: any) => o.selected_shop === shopName)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(localShopOrders);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [shopName]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
        .eq('order_id', orderId);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Supabase update failed, updating locally:', err.message);
      const localOrders = JSON.parse(localStorage.getItem('eco_local_orders') || '[]');
      const idx = localOrders.findIndex((o: any) => o.order_id === orderId);
      if (idx !== -1) {
        localOrders[idx].status = newStatus;
        localOrders[idx].updated_at = new Date().toISOString();
        localStorage.setItem('eco_local_orders', JSON.stringify(localOrders));
      }
    }
    setOrders(prev =>
      prev.map(o =>
        o.order_id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o
      )
    );
    toast.success(`Order ${orderId} marked as ${newStatus}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // Stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const pickedUpOrders = orders.filter(o => o.status === 'picked_up').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalEarnings = orders
    .filter(o => o.category !== 'orphanage')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'picked_up': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'picked_up': return 'Picked Up';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{shopOwner?.shop_name}</h1>
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {shopOwner?.shop_location}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {offlineMode && (
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium">
                  <WifiOff className="w-3 h-3" /> Offline
                </div>
              )}
              <button onClick={handleLogout} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70">Total Orders</span>
              </div>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70">Pending</span>
              </div>
              <p className="text-2xl font-bold">{pendingOrders}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70">Completed</span>
              </div>
              <p className="text-2xl font-bold">{completedOrders}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70">Earnings</span>
              </div>
              <p className="text-2xl font-bold">₹{totalEarnings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground">Orders ({totalOrders})</h2>
          <button
            onClick={fetchOrders}
            disabled={refreshing}
            className="flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground">Orders from customers will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-4 space-y-3"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-foreground text-sm">{order.order_id}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Items</span>
                    <p className="font-medium text-foreground">{order.total_items} pieces</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Amount</span>
                    <p className="font-medium text-foreground">
                      {order.category === 'orphanage' ? '💚 Donation' : `₹${order.total_amount}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Pickup</span>
                    <p className="font-medium text-foreground text-xs">{order.pickup_date || 'TBD'} {order.pickup_time || ''}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Contact</span>
                    <p className="font-medium text-foreground flex items-center gap-1 text-xs">
                      <Phone className="w-3 h-3" /> {order.contact_phone || order.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex gap-2 pt-1">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.order_id, 'picked_up')}
                      className="flex-1 py-2 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      Mark Picked Up
                    </button>
                  )}
                  {order.status === 'picked_up' && (
                    <button
                      onClick={() => updateOrderStatus(order.order_id, 'completed')}
                      className="flex-1 py-2 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      Mark Completed
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <span className="flex-1 py-2 rounded-lg text-xs font-medium text-center text-green-600">
                      ✅ Order Completed
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ShopDashboardPage;
