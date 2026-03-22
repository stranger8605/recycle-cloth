import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface OrderRow {
  order_id: string;
  district: string | null;
  category: string | null;
  total_items: number | null;
  total_amount: number | null;
  status: string;
  created_at: string;
  contact_phone: string | null;
}

export function generateAdminReportPdf(orders: OrderRow[], statusFilter: string) {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Header
  doc.setFillColor(34, 139, 34);
  doc.rect(0, 0, 297, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EcoThreads — Orders Report', 15, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 282, 18, { align: 'right' });
  if (statusFilter !== 'all') {
    doc.text(`Filter: ${statusFilter}`, 282, 24, { align: 'right' });
  }

  // Summary
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalItems = orders.reduce((s, o) => s + (o.total_items || 0), 0);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  let y = 40;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Orders: ${totalOrders}`, 15, y);
  doc.text(`Total Items: ${totalItems}`, 80, y);
  doc.text(`Total Revenue: ₹${totalRevenue}`, 145, y);

  // Table
  const tableData = orders.map(o => [
    o.order_id,
    o.district || '—',
    o.category === 'orphanage' ? 'Donation' : 'Sell',
    o.contact_phone || '—',
    String(o.total_items || 0),
    o.category === 'orphanage' ? 'Free' : `₹${o.total_amount || 0}`,
    o.status.charAt(0).toUpperCase() + o.status.slice(1).replace('_', ' '),
    new Date(o.created_at).toLocaleDateString(),
  ]);

  (doc as any).autoTable({
    startY: y + 8,
    head: [['Order ID', 'District', 'Category', 'Phone', 'Items', 'Amount', 'Status', 'Date']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`EcoThreads-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
