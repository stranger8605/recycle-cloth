import jsPDF from 'jspdf';

interface ReceiptData {
  orderId: string;
  district: string;
  category: string;
  selectedShop?: string;
  address?: string;
  contactPhone?: string;
  pickupDate?: string;
  pickupTime?: string;
  paymentMethod?: string;
  clothQuantities: Record<string, number>;
}

const clothPrices: Record<string, number> = {
  'cotton-shirt': 50, 'jeans': 100, 'saree': 150, 'kurta': 80,
  'jacket': 120, 't-shirt': 40, 'trousers': 70, 'others': 60,
};

export function generateReceiptPdf(data: ReceiptData) {
  const doc = new jsPDF();
  const isDonation = data.category === 'orphanage';
  const entries = Object.entries(data.clothQuantities);
  const totalItems = entries.reduce((s, [, q]) => s + q, 0);
  const totalAmount = entries.reduce((s, [id, q]) => s + q * (clothPrices[id] || 50), 0);

  // Header
  doc.setFillColor(34, 139, 34);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('EcoThreads', 15, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(isDonation ? 'Donation Receipt' : 'Order Receipt', 15, 30);
  doc.text(`Order: ${data.orderId}`, 195, 20, { align: 'right' });
  doc.text(new Date().toLocaleDateString(), 195, 30, { align: 'right' });

  // Body
  let y = 55;
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Details', 15, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const details = [
    ['District', data.district],
    ['Category', isDonation ? 'Donation (Orphanage)' : 'Sell to Store'],
    ...(data.selectedShop ? [['Shop', data.selectedShop]] : []),
    ...(data.address ? [['Address', data.address]] : []),
    ...(data.contactPhone ? [['Phone', data.contactPhone]] : []),
    ...(data.pickupDate ? [['Pickup Date', data.pickupDate]] : []),
    ...(data.pickupTime ? [['Pickup Time', data.pickupTime]] : []),
    ...(!isDonation && data.paymentMethod ? [['Payment', data.paymentMethod]] : []),
  ];

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 70, y);
    y += 7;
  });

  // Items table
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Items', 15, y);
  y += 8;

  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 5, 180, 8, 'F');
  doc.setFontSize(10);
  doc.text('Cloth Type', 20, y);
  doc.text('Qty', 120, y, { align: 'center' });
  if (!isDonation) doc.text('Price', 155, y, { align: 'center' });
  if (!isDonation) doc.text('Total', 185, y, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  entries.forEach(([cloth, qty]) => {
    const price = clothPrices[cloth] || 50;
    const name = cloth.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    doc.text(name, 20, y);
    doc.text(String(qty), 120, y, { align: 'center' });
    if (!isDonation) {
      doc.text(`₹${price}`, 155, y, { align: 'center' });
      doc.text(`₹${price * qty}`, 185, y, { align: 'right' });
    }
    y += 7;
  });

  // Totals
  y += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, 195, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Total Items: ${totalItems}`, 15, y);
  if (!isDonation) {
    doc.text(`Total Amount: ₹${totalAmount}`, 195, y, { align: 'right' });
  } else {
    doc.text('Free Donation 💚', 195, y, { align: 'right' });
  }

  // Footer
  y += 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for choosing EcoThreads! Your pickup will be arranged within 24 hours.', 105, y, { align: 'center' });

  doc.save(`EcoThreads-Receipt-${data.orderId}.pdf`);
}
