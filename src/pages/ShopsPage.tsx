import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import { supabase } from '@/integrations/supabase/client';
import StepLayout from '@/components/StepLayout';
import { Star, Truck, Shield, MapPin, RefreshCw } from 'lucide-react';

interface ShopData {
  id: string;
  shop_name: string;
  shop_location: string;
  name: string;
  mobile_verified: boolean;
}

const ShopsPage = () => {
  const navigate = useNavigate();
  const { state, update } = useRecycle();
  const [selected, setSelected] = useState(state.selectedShop);
  const [shops, setShops] = useState<ShopData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('shop_owners')
        .select('id, shop_name, shop_location, name, mobile_verified');

      if (error) {
        console.error('Fetch shops error:', error);
      } else {
        setShops(data || []);
      }
      setLoading(false);
    };

    fetchShops();
  }, []);

  const handleNext = () => {
    update({ selectedShop: selected });
    navigate('/quantity');
  };

  return (
    <StepLayout
      step={3}
      totalSteps={6}
      title="Select a Shop"
      subtitle={`Verified shops in ${state.district || 'your area'}`}
      onNext={handleNext}
      onBack={() => navigate('/categories')}
      nextDisabled={!selected}
    >
      <div className="mb-4 flex items-center gap-2 bg-accent/50 rounded-lg p-3">
        <Shield className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-accent-foreground">
          Registered & verified shops
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No shops registered yet in this area.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map((shop) => (
            <button
              key={shop.id}
              onClick={() => setSelected(shop.shop_name)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selected === shop.shop_name
                  ? 'border-primary bg-accent eco-shadow'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-foreground">{shop.shop_name}</h3>
                {shop.mobile_verified && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {shop.shop_location}
                </span>
                <span>•</span>
                <span>Owner: {shop.name}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-primary">
                  <Truck className="w-3.5 h-3.5" /> Pickup
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </StepLayout>
  );
};

export default ShopsPage;
