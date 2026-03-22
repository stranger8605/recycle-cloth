import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import StepLayout from '@/components/StepLayout';
import { MapPin, Navigation } from 'lucide-react';

const districts = [
  'Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy',
  'Tirunelveli', 'Erode', 'Vellore', 'Thanjavur', 'Dindigul',
  'Kanchipuram', 'Cuddalore',
];

const DistrictPage = () => {
  const navigate = useNavigate();
  const { state, update } = useRecycle();
  const [district, setDistrict] = useState(state.district);
  const [search, setSearch] = useState('');

  const filtered = districts.filter((d) =>
    d.toLowerCase().includes(search.toLowerCase())
  );

  const handleNext = () => {
    update({ district });
    navigate('/categories');
  };

  return (
    <StepLayout
      step={3}
      totalSteps={8}
      title="Select District"
      subtitle="Choose your location"
      onNext={handleNext}
      onBack={() => navigate('/clothes')}
      nextDisabled={!district}
    >
      <div className="space-y-4">
        {/* Auto-detect */}
        <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-accent/50 text-foreground hover:bg-accent transition-colors">
          <Navigation className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">Auto-detect my location</span>
        </button>

        {/* Search */}
        <input
          type="text"
          placeholder="Search district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* List */}
        <div className="space-y-2">
          {filtered.map((d) => (
            <button
              key={d}
              onClick={() => setDistrict(d)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                district === d
                  ? 'border-primary bg-accent eco-shadow'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <MapPin className={`w-5 h-5 ${district === d ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium text-foreground">{d}</span>
            </button>
          ))}
        </div>
      </div>
    </StepLayout>
  );
};

export default DistrictPage;
