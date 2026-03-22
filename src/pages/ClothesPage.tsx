import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import StepLayout from '@/components/StepLayout';
import { Check } from 'lucide-react';

const clothTypes = [
  { id: 'cotton-shirt', label: 'Cotton Shirts', emoji: '👕', price: 50 },
  { id: 'jeans', label: 'Jeans', emoji: '👖', price: 100 },
  { id: 'saree', label: 'Sarees', emoji: '🥻', price: 150 },
  { id: 'kurta', label: 'Kurtas', emoji: '👘', price: 80 },
  { id: 'jacket', label: 'Jackets', emoji: '🧥', price: 120 },
  { id: 't-shirt', label: 'T-Shirts', emoji: '👕', price: 40 },
  { id: 'trousers', label: 'Trousers', emoji: '👖', price: 70 },
  { id: 'others', label: 'Others', emoji: '👗', price: 60 },
];

const ClothesPage = () => {
  const navigate = useNavigate();
  const { state, update } = useRecycle();
  const [selected, setSelected] = useState<string[]>(state.selectedClothes);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    update({ selectedClothes: selected });
    navigate('/district');
  };

  return (
    <StepLayout
      step={2}
      totalSteps={8}
      title="Select Cloth Types"
      subtitle="Choose what you want to recycle"
      onNext={handleNext}
      onBack={() => navigate('/profile')}
      nextDisabled={selected.length === 0}
      nextLabel={`Continue (${selected.length} selected)`}
    >
      <div className="grid grid-cols-2 gap-3">
        {clothTypes.map((cloth) => {
          const isSelected = selected.includes(cloth.id);
          return (
            <button
              key={cloth.id}
              onClick={() => toggle(cloth.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-accent eco-shadow'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full eco-gradient flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <span className="text-3xl block mb-2">{cloth.emoji}</span>
              <span className="text-sm font-medium text-foreground block">{cloth.label}</span>
              <span className="text-xs text-muted-foreground">₹{cloth.price}/piece</span>
            </button>
          );
        })}
      </div>
    </StepLayout>
  );
};

export default ClothesPage;
