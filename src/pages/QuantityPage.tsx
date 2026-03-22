import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import StepLayout from '@/components/StepLayout';
import { Minus, Plus, Camera } from 'lucide-react';
import { sendOrderNotification } from '@/lib/twilioService';
import { toast } from 'sonner';

const clothData: Record<string, { label: string; emoji: string }> = {
  'cotton-shirt': { label: 'Cotton Shirts', emoji: '👕' },
  'jeans': { label: 'Jeans', emoji: '👖' },
  'saree': { label: 'Sarees', emoji: '🥻' },
  'kurta': { label: 'Kurtas', emoji: '👘' },
  'jacket': { label: 'Jackets', emoji: '🧥' },
  't-shirt': { label: 'T-Shirts', emoji: '👕' },
  'trousers': { label: 'Trousers', emoji: '👖' },
  'others': { label: 'Others', emoji: '👗' },
};

const QuantityPage = () => {
  const navigate = useNavigate();
  const { state, update } = useRecycle();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    state.clothQuantities || {}
  );

  useEffect(() => {
    const init: Record<string, number> = {};
    state.selectedClothes.forEach((id) => {
      init[id] = quantities[id] || 1;
    });
    setQuantities(init);
  }, []);

  const adjust = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min(100, Math.max(1, (prev[id] || 1) + delta)),
    }));
  };

  const totalItems = Object.values(quantities).reduce((sum, q) => sum + q, 0);

  const handleNext = () => {
    update({ clothQuantities: quantities });
    if (state.category === 'orphanage') {
      const orderId = 'RC' + Date.now().toString().slice(-8);
      update({ clothQuantities: quantities, orderId });

      // Send WhatsApp/SMS donation notification (non-blocking)
      if (state.contactPhone) {
        sendOrderNotification({
          phone: state.contactPhone,
          orderId,
          district: state.district,
          category: state.category,
          totalItems: Object.values(quantities).reduce((s, q) => s + q, 0),
          pickupDate: state.pickupDate,
          pickupTime: state.pickupTime,
        }).then((result) => {
          if (result.success) {
            toast.success(`Donation confirmation sent via ${result.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}! 📱`);
          }
        });
      }

      navigate('/thankyou');
    } else {
      navigate('/pricing');
    }
  };

  return (
    <StepLayout
      step={6}
      totalSteps={8}
      title="Cloth Quantity"
      subtitle="How many of each type?"
      onNext={handleNext}
      onBack={() => navigate('/contact')}
      nextLabel={`Continue (${totalItems} items)`}
    >
      <div className="space-y-3">
        {state.selectedClothes.map((id) => {
          const cloth = clothData[id];
          if (!cloth) return null;
          return (
            <div
              key={id}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cloth.emoji}</span>
                <span className="font-medium text-foreground">{cloth.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjust(id, -1)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-accent transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-foreground">
                  {quantities[id] || 1}
                </span>
                <button
                  onClick={() => adjust(id, 1)}
                  className="w-8 h-8 rounded-full eco-gradient flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Photo upload */}
      <div className="mt-6">
        <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground hover:border-primary/30 transition-colors">
          <Camera className="w-5 h-5" />
          <span className="text-sm font-medium">Upload photos of clothes (optional)</span>
        </button>
      </div>

      {/* Summary */}
      <div className="mt-4 bg-accent/50 rounded-xl p-4">
        <p className="text-sm text-muted-foreground">Total Items</p>
        <p className="text-2xl font-bold text-foreground">{totalItems}</p>
      </div>
    </StepLayout>
  );
};

export default QuantityPage;
