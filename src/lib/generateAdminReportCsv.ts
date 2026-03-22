interface OrderRow {
  order_id: string;
  phone: string | null;
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

export function generateAdminReportCsv(orders: OrderRow[]) {
  const headers = ['Order ID', 'Phone', 'District', 'Category', 'Shop', 'Address', 'Contact Phone', 'Pickup Date', 'Pickup Time', 'Payment', 'Items', 'Amount', 'Status', 'Created'];

  const rows = orders.map(o => [
    o.order_id,
    o.phone || '',
    o.district || '',
    o.category === 'orphanage' ? 'Donation' : 'Sell',
    o.selected_shop || '',
    o.address || '',
    o.contact_phone || '',
    o.pickup_date || '',
    o.pickup_time || '',
    o.payment_method || '',
    String(o.total_items || 0),
    o.category === 'orphanage' ? 'Free' : String(o.total_amount || 0),
    o.status,
    new Date(o.created_at).toLocaleString(),
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `EcoThreads-Orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
