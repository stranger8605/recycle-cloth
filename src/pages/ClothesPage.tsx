import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import StepLayout from '@/components/StepLayout';
import { Check, Camera, X, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

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
  const [photos, setPhotos] = useState<string[]>(state.clothPhotos || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select image files only.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => {
          if (prev.length >= 5) {
            toast.error('Maximum 5 photos allowed.');
            return prev;
          }
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    update({ selectedClothes: selected, clothPhotos: photos });
    navigate('/district');
  };

  return (
    <StepLayout
      step={2}
      totalSteps={8}
      title="Select Cloth Types"
      subtitle="Choose what you want to recycle"
      onNext={handleNext}
      onBack={() => navigate('/login')}
      nextDisabled={selected.length === 0}
      nextLabel={`Continue (${selected.length} selected)`}
    >
      <div className="space-y-5">
        {/* Cloth Type Grid */}
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

        {/* Photo Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Upload Cloth Photos <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <span className="text-xs text-muted-foreground">{photos.length}/5</span>
          </div>

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
                  <img src={photo} alt={`Cloth ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {photos.length < 5 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 rounded-xl border-2 border-dashed border-primary/40 bg-accent/30 hover:bg-accent/60 hover:border-primary/60 transition-all flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-full eco-gradient flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">Upload Photos</span>
              <span className="text-xs text-muted-foreground">Tap to add cloth images (max 5MB each)</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      </div>
    </StepLayout>
  );
};

export default ClothesPage;
