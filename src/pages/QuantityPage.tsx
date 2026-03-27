import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecycle } from '@/context/RecycleContext';
import StepLayout from '@/components/StepLayout';
import { Minus, Plus, Camera, ImagePlus, X, Scan, Sparkles } from 'lucide-react';
import { sendOrderNotification } from '@/lib/twilioService';
import { toast } from 'sonner';
import { analyzeClothImage, ClothAnalysisResult } from '@/lib/clothAnalyzer';
import ClothScanner from '@/components/ClothScanner';
import { AnimatePresence, motion } from 'framer-motion';

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

const qualityBadgeColors: Record<string, string> = {
  Excellent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Fair: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Poor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

interface PhotoWithAnalysis {
  dataUrl: string;
  result?: ClothAnalysisResult;
}

const QuantityPage = () => {
  const navigate = useNavigate();
  const { state, update } = useRecycle();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    state.clothQuantities || {}
  );
  const [photos, setPhotos] = useState<PhotoWithAnalysis[]>(
    (state.clothPhotos || []).map((url: string) => ({ dataUrl: url }))
  );
  const [scanningPhoto, setScanningPhoto] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ClothAnalysisResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
        const dataUrl = reader.result as string;
        setPhotos((prev) => {
          if (prev.length >= 5) {
            toast.error('Maximum 5 photos allowed.');
            return prev;
          }
          return [...prev, { dataUrl }];
        });

        // Auto-scan the uploaded photo
        startScan(dataUrl);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const startScan = async (photoUrl: string) => {
    setScanningPhoto(photoUrl);
    setIsScanning(true);
    setScanResult(null);

    try {
      const result = await analyzeClothImage(photoUrl);
      setScanResult(result);
      setIsScanning(false);

      // Store result with the photo
      setPhotos((prev) =>
        prev.map((p) =>
          p.dataUrl === photoUrl ? { ...p, result } : p
        )
      );

      toast.success(`Analysis complete: ${result.quality} quality (${result.qualityScore}/100)`);
    } catch {
      setIsScanning(false);
      toast.error('Failed to analyze image.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const viewScanResult = (photo: PhotoWithAnalysis) => {
    setScanningPhoto(photo.dataUrl);
    if (photo.result) {
      setScanResult(photo.result);
      setIsScanning(false);
    } else {
      startScan(photo.dataUrl);
    }
  };

  const closeScan = () => {
    setScanningPhoto(null);
    setScanResult(null);
    setIsScanning(false);
  };

  const totalItems = Object.values(quantities).reduce((sum, q) => sum + q, 0);

  const handleNext = () => {
    const photoUrls = photos.map((p) => p.dataUrl);
    update({ clothQuantities: quantities, clothPhotos: photoUrls });
    if (state.category === 'orphanage') {
      const orderId = 'RC' + Date.now().toString().slice(-8);
      update({ clothQuantities: quantities, clothPhotos: photoUrls, orderId });

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
      step={4}
      totalSteps={6}
      title="Cloth Quantity"
      subtitle="How many of each type?"
      onNext={handleNext}
      onBack={() => navigate('/shops')}
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

      {/* Photo Upload + Scan Section */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Scan className="w-4 h-4 text-primary" />
            Scan & Upload Clothes
          </label>
          <span className="text-xs text-muted-foreground">{photos.length}/5</span>
        </div>

        <p className="text-xs text-muted-foreground -mt-1">
          Upload or capture photos — AI will scan quality, fabric & size
        </p>

        {/* Photo Previews with scan results */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group aspect-square rounded-xl overflow-hidden border border-border shadow-sm cursor-pointer"
                onClick={() => viewScanResult(photo)}
              >
                <img src={photo.dataUrl} alt={`Cloth ${index + 1}`} className="w-full h-full object-cover" />

                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>

                {/* Quality badge overlay */}
                {photo.result && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${qualityBadgeColors[photo.result.quality]}`}>
                        {photo.result.quality}
                      </span>
                      <span className="text-[10px] text-white font-medium">{photo.result.qualityScore}%</span>
                    </div>
                  </div>
                )}

                {/* Scan prompt if no result */}
                {!photo.result && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white/90 dark:bg-black/70 rounded-full p-2">
                      <Scan className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Camera & Upload Buttons */}
        {photos.length < 5 && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-primary/40 bg-accent/30 hover:bg-accent/60 hover:border-primary/60 transition-all"
            >
              <div className="w-10 h-10 rounded-full eco-gradient flex items-center justify-center shadow-md">
                <Camera className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">Take Photo</span>
              <span className="text-[10px] text-muted-foreground">Auto-scan</span>
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-primary/40 bg-accent/30 hover:bg-accent/60 hover:border-primary/60 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <ImagePlus className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-foreground">Upload Photo</span>
              <span className="text-[10px] text-muted-foreground">Auto-scan</span>
            </button>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoUpload}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>

      {/* Analysis Summary */}
      {photos.some((p) => p.result) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Scan Summary</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {photos.filter((p) => p.result).length}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500">Scanned</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {Math.round(
                  photos.filter((p) => p.result).reduce((s, p) => s + (p.result?.qualityScore || 0), 0) /
                  Math.max(1, photos.filter((p) => p.result).length)
                )}%
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500">Avg Quality</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {photos.filter((p) => p.result?.recyclable).length}/{photos.filter((p) => p.result).length}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500">Recyclable</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <div className="mt-4 bg-accent/50 rounded-xl p-4">
        <p className="text-sm text-muted-foreground">Total Items</p>
        <p className="text-2xl font-bold text-foreground">{totalItems}</p>
      </div>

      {/* Scanner Modal */}
      <AnimatePresence>
        {scanningPhoto && (
          <ClothScanner
            photo={scanningPhoto}
            result={scanResult}
            isScanning={isScanning}
            onClose={closeScan}
          />
        )}
      </AnimatePresence>
    </StepLayout>
  );
};

export default QuantityPage;
