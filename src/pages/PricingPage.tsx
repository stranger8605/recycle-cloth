import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import StepLayout from '@/components/StepLayout';
import { IndianRupee, Wallet, Smartphone, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { sendOrderNotification } from '@/lib/twilioService';

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

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'paytm', label: 'Paytm', icon: Wallet },
  { id: 'upi', label: 'UPI', icon: Smartphone },
];

const PricingPage = () => {
  const navigate = useNavigate();
  const { state, update } = useRecycle();
  const [payment, setPayment] = useState(state.paymentMethod);

  const lineItems = state.selectedClothes.map((id) => ({
    id,
    label: clothLabels[id] || id,
    qty: state.clothQuantities[id] || 1,
    price: priceMap[id] || 50,
  }));

  const total = lineItems.reduce((sum, item) => sum + item.qty * item.price, 0);

  const handleNext = async () => {
    const orderId = 'RC' + Date.now().toString().slice(-8);
    const totalItems = lineItems.reduce((s, i) => s + i.qty, 0);

    const { error } = await supabase.from('orders').insert({
      order_id: orderId,
      phone: state.contactPhone,

      selected_clothes: state.selectedClothes,
      cloth_quantities: state.clothQuantities as any,
      district: state.district,
      category: state.category,
      selected_shop: state.selectedShop,
      address: state.address,
      contact_phone: state.contactPhone,
      pickup_date: state.pickupDate,
      pickup_time: state.pickupTime,
      payment_method: payment,
      total_items: totalItems,
      total_amount: total,
      status: 'pending',
    } as any);

    if (error) {
      console.error('Order insert error:', JSON.stringify(error, null, 2));
      toast.error(`Failed to place order: ${error.message}`);
      return;
    }

    update({ paymentMethod: payment, orderId });

    // Send WhatsApp order notification to CUSTOMER (non-blocking)
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
      paymentMethod: payment,
    }).then((result) => {
      if (result.success) {
        toast.success(`Order confirmation sent via WhatsApp! 📱`);
      }
    });

    // Send WhatsApp notification to SHOP OWNER (non-blocking)
    if (state.selectedShop) {
      supabase
        .from('shop_owners')
        .select('mobile')
        .eq('shop_name', state.selectedShop)
        .limit(1)
        .then(({ data: shopData }) => {
          if (shopData && shopData.length > 0 && shopData[0].mobile) {
            sendOrderNotification({
              phone: shopData[0].mobile,
              orderId,
              district: state.district,
              category: state.category,
              totalItems,
              totalAmount: total,
              pickupDate: state.pickupDate,
              pickupTime: state.pickupTime,
              selectedShop: state.selectedShop,
              paymentMethod: payment,
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
      title="Pricing Summary"
      subtitle="Your estimated earnings"
      onNext={handleNext}
      onBack={() => navigate('/quantity')}
      nextDisabled={!payment}
      nextLabel="Submit Order"
    >
      <div className="space-y-4">
        {/* Line items */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-3 bg-muted border-b border-border">
            <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground">
              <span className="col-span-2">Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Amount</span>
            </div>
          </div>
          {lineItems.map((item) => (
            <div key={item.id} className="p-3 border-b border-border last:border-0">
              <div className="grid grid-cols-4 text-sm items-center">
                <span className="col-span-2 font-medium text-foreground">{item.label}</span>
                <span className="text-center text-muted-foreground">{item.qty}</span>
                <span className="text-right font-medium text-foreground">₹{item.qty * item.price}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">₹{item.price}/piece</p>
            </div>
          ))}
          <div className="p-3 bg-accent/50">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">Total Earnings</span>
              <span className="text-xl font-bold text-primary flex items-center">
                <IndianRupee className="w-5 h-5" />
                {total}
              </span>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Payment Method</label>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setPayment(pm.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  payment === pm.id
                    ? 'border-primary bg-accent eco-shadow'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <pm.icon className={`w-6 h-6 mx-auto mb-1 ${payment === pm.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium text-foreground">{pm.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </StepLayout>
  );
};

export default PricingPage;
