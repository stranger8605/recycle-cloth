import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import StepLayout from '@/components/StepLayout';
import { Heart, Store } from 'lucide-react';

const categories = [
  {
    id: 'orphanage',
    label: 'Donate to Orphanage',
    emoji: '🏠',
    icon: Heart,
    description: 'Give your clothes a second life by donating to children in need.',
  },
  {
    id: 'store',
    label: 'Sell to Store',
    emoji: '🏪',
    icon: Store,
    description: 'Earn money by selling your recyclable clothes to nearby stores.',
  },
];

const CategoriesPage = () => {
  const navigate = useNavigate();
  const { state, update } = useRecycle();
  const [selected, setSelected] = useState(state.category);

  const handleNext = () => {
    update({ category: selected });
    navigate('/shops');
  };

  return (
    <StepLayout
      step={4}
      totalSteps={9}
      title="Choose Category"
      subtitle="How would you like to recycle?"
      onNext={handleNext}
      onBack={() => navigate('/district')}
      nextDisabled={!selected}
    >
      <div className="space-y-4">
        {categories.map((cat) => {
          const isSelected = selected === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-accent eco-shadow'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                  isSelected ? 'eco-gradient' : 'bg-muted'
                }`}>
                  {cat.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-semibold text-foreground">{cat.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </StepLayout>
  );
};

export default CategoriesPage;
