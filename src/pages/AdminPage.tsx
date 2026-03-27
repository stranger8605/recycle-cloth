import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, RefreshCw, Package, Clock, CheckCircle2, XCircle, Trash2, Eye, FileDown } from 'lucide-react';
import { generateAdminReportPdf } from '@/lib/generateAdminReportPdf';
import { generateAdminReportCsv } from '@/lib/generateAdminReportCsv';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_id: string;
  phone: string | null;

  selected_clothes: string[] | null;
  cloth_quantities: Record<string, number> | null;
  district: string | null;
  category: string | null;
  selected_shop: string | null;
  address: string | null;
  contact_phone: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  payment_method: string | null;
  total_items: number | null;
  total_amount: number | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  picked_up: 'bg-primary/10 text-primary',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusOptions = ['pending', 'confirmed', 'picked_up', 'completed', 'cancelled'];

const AdminPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch orders');
    } else {
      setOrders((data as unknown as Order[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Status updated to ${newStatus}`);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete order');
    } else {
      toast.success('Order deleted');
      setOrders(prev => prev.filter(o => o.id !== id));
      if (selectedOrder?.id === id) setSelectedOrder(null);
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch = !search ||
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.district?.toLowerCase().includes(search.toLowerCase()) ||
      o.contact_phone?.includes(search) ||
      o.phone?.includes(search);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.reduce((s, o) => s + (o.total_amount || 0), 0),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">🤖 Super Bot Admin</h1>
            <p className="text-sm text-muted-foreground">Database Manager</p>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Orders', value: stats.total, icon: Package, color: 'text-foreground' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-500' },
            { label: 'Revenue', value: `₹${stats.revenue}`, icon: Package, color: 'text-primary' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, district, phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => generateAdminReportPdf(filtered, statusFilter)}
            className="px-4 py-2.5 rounded-xl border border-input bg-card text-foreground hover:bg-accent transition-colors flex items-center gap-2 font-medium"
          >
            <FileDown className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={() => generateAdminReportCsv(filtered)}
            className="px-4 py-2.5 rounded-xl border border-input bg-card text-foreground hover:bg-accent transition-colors flex items-center gap-2 font-medium"
          >
            <FileDown className="w-4 h-4" /> CSV
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order ID</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">District</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Items</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-foreground">{order.order_id}</td>
                      <td className="px-4 py-3 text-foreground">{order.district || '—'}</td>
                      <td className="px-4 py-3 text-foreground capitalize">{order.category === 'orphanage' ? '🏠 Donation' : '🏪 Sell'}</td>
                      <td className="px-4 py-3 text-center text-foreground">{order.total_items || 0}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {order.category === 'orphanage' ? 'Free' : `₹${order.total_amount || 0}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusColors[order.status] || ''}`}
                        >
                          {statusOptions.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this order?')) deleteOrder(order.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl border border-border p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-foreground">Order {selectedOrder.order_id}</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ['Status', selectedOrder.status],
                  ['Phone', selectedOrder.phone || selectedOrder.contact_phone],
                  ['District', selectedOrder.district],
                  ['Category', selectedOrder.category === 'orphanage' ? 'Donation' : 'Sell to Store'],
                  ['Shop', selectedOrder.selected_shop],
                  ['Address', selectedOrder.address],
                  ['Pickup', `${selectedOrder.pickup_date || ''} ${selectedOrder.pickup_time || ''}`],
                  ['Payment', selectedOrder.payment_method],
                  ['Items', selectedOrder.total_items],
                  ['Amount', selectedOrder.category === 'orphanage' ? 'Free' : `₹${selectedOrder.total_amount || 0}`],
                  ['Created', new Date(selectedOrder.created_at).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between">
                    <span className="text-muted-foreground">{String(label)}</span>
                    <span className="font-medium text-foreground capitalize">{String(value || '—')}</span>
                  </div>
                ))}
                {selectedOrder.cloth_quantities && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-muted-foreground mb-2">Clothes:</p>
                    {Object.entries(selectedOrder.cloth_quantities as Record<string, number>).map(([cloth, qty]) => (
                      <div key={cloth} className="flex justify-between">
                        <span className="text-foreground capitalize">{cloth.replace('-', ' ')}</span>
                        <span className="text-foreground">×{qty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
