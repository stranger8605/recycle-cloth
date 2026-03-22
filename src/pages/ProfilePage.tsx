import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import StepLayout from '@/components/StepLayout';
import { User } from 'lucide-react';

const genders = [
  { value: 'male', label: 'Male', emoji: '👨' },
  { value: 'female', label: 'Female', emoji: '👩' },
  { value: 'other', label: 'Other', emoji: '🧑' },
];

const ageRanges = ['18-25', '26-35', '36-45', '46-55', '55+'];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { state, update } = useRecycle();
  const [gender, setGender] = useState(state.gender);
  const [ageRange, setAgeRange] = useState(state.ageRange);

  const handleNext = () => {
    update({ gender, ageRange });
    navigate('/clothes');
  };

  return (
    <StepLayout
      step={1}
      totalSteps={8}
      title="Your Profile"
      subtitle="Tell us about yourself"
      onNext={handleNext}
      onBack={() => navigate('/login')}
      nextDisabled={!gender || !ageRange}
    >
      <div className="space-y-6">
        {/* Gender */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Gender</label>
          <div className="grid grid-cols-3 gap-3">
            {genders.map((g) => (
              <button
                key={g.value}
                onClick={() => setGender(g.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  gender === g.value
                    ? 'border-primary bg-accent eco-shadow'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <span className="text-2xl block mb-1">{g.emoji}</span>
                <span className="text-sm font-medium text-foreground">{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Age Range</label>
          <div className="grid grid-cols-3 gap-3">
            {ageRanges.map((a) => (
              <button
                key={a}
                onClick={() => setAgeRange(a)}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  ageRange === a
                    ? 'border-primary bg-accent text-accent-foreground eco-shadow'
                    : 'border-border bg-card text-foreground hover:border-primary/30'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {gender && ageRange && (
          <div className="bg-accent/50 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full eco-gradient flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground capitalize">{gender}</p>
              <p className="text-sm text-muted-foreground">Age: {ageRange}</p>
            </div>
          </div>
        )}
      </div>
    </StepLayout>
  );
};

export default ProfilePage;
