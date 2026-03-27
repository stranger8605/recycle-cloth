import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, CheckCircle2, XCircle, Sparkles, Ruler, Shirt, Palette, Shield } from 'lucide-react';
import { ClothAnalysisResult } from '@/lib/clothAnalyzer';

interface ClothScannerProps {
  photo: string;
  result: ClothAnalysisResult | null;
  isScanning: boolean;
  onClose: () => void;
}

const qualityColors: Record<string, { bg: string; text: string; bar: string }> = {
  Excellent: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', bar: 'bg-green-500' },
  Good: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', bar: 'bg-blue-500' },
  Fair: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', bar: 'bg-yellow-500' },
  Poor: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', bar: 'bg-red-500' },
};

const ClothScanner = ({ photo, result, isScanning, onClose }: ClothScannerProps) => {
  const [scanPhase, setScanPhase] = useState(0);
  const scanPhases = ['Detecting fabric...', 'Analyzing quality...', 'Estimating size...', 'Checking condition...'];

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setScanPhase((prev) => (prev + 1) % scanPhases.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isScanning]);

  const colors = result ? qualityColors[result.quality] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-card rounded-2xl border border-border w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image with scan overlay */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
          <img src={photo} alt="Scanning cloth" className="w-full h-full object-cover" />

          {/* Scanning overlay */}
          {isScanning && (
            <>
              <div className="absolute inset-0 bg-black/30" />
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                initial={{ top: '0%' }}
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />

              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="bg-black/70 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
                  <Scan className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-300">{scanPhases[scanPhase]}</span>
                </div>
              </div>
            </>
          )}

          {/* Quality badge when done */}
          {result && colors && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3"
            >
              <div className={`${colors.bg} ${colors.text} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm`}>
                <Sparkles className="w-3.5 h-3.5" />
                {result.quality}
              </div>
            </motion.div>
          )}
        </div>

        {/* Results */}
        <div className="p-5">
          {isScanning ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full eco-gradient flex items-center justify-center mx-auto mb-3 animate-pulse">
                <Scan className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-foreground">Scanning Cloth...</p>
              <p className="text-sm text-muted-foreground mt-1">AI is analyzing your garment</p>
            </div>
          ) : result ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Quality Score Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">Quality Score</span>
                  <span className={`text-sm font-bold ${colors!.text}`}>{result.qualityScore}/100</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${colors!.bar} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.qualityScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-accent/50 rounded-xl p-3 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shirt className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fabric</p>
                    <p className="text-sm font-semibold text-foreground">{result.fabricType}</p>
                  </div>
                </div>

                <div className="bg-accent/50 rounded-xl p-3 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Ruler className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Size</p>
                    <p className="text-sm font-semibold text-foreground">{result.estimatedSize}</p>
                  </div>
                </div>

                <div className="bg-accent/50 rounded-xl p-3 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Palette className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Color</p>
                    <p className="text-sm font-semibold text-foreground">{result.color}</p>
                  </div>
                </div>

                <div className="bg-accent/50 rounded-xl p-3 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Condition</p>
                    <p className="text-sm font-semibold text-foreground">{result.condition}</p>
                  </div>
                </div>
              </div>

              {/* Wear Level */}
              <div className="bg-accent/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Wear Assessment</p>
                <p className="text-sm font-medium text-foreground">{result.wearLevel}</p>
              </div>

              {/* Recyclable Badge */}
              <div className={`flex items-center gap-2 p-3 rounded-xl ${result.recyclable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                {result.recyclable ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-medium ${result.recyclable ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {result.recyclable ? '✅ Suitable for Recycling' : '❌ Not Recyclable'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Value estimate: {result.priceMultiplier >= 1.2 ? 'Premium' : result.priceMultiplier >= 0.8 ? 'Standard' : 'Reduced'} pricing
                  </p>
                </div>
              </div>

              {/* Details */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Analysis Details</p>
                <div className="space-y-1.5">
                  {result.details.map((detail, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="text-foreground">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold text-primary-foreground eco-gradient hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </motion.div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClothScanner;
