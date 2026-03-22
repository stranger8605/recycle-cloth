import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StepLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideProgress?: boolean;
}

const StepLayout = ({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'Continue',
  nextDisabled = false,
  hideProgress = false,
}: StepLayoutProps) => {
  const progress = (step / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-accent transition-colors"
              >
                ←
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {!hideProgress && (
              <span className="text-sm font-medium text-primary">
                {step}/{totalSteps}
              </span>
            )}
          </div>
          {!hideProgress && (
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full eco-gradient rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container max-w-lg mx-auto px-4 py-6">
        {children}
      </div>

      {/* Footer */}
      {onNext && (
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border p-4">
          <div className="container max-w-lg mx-auto">
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className="w-full py-3.5 rounded-xl font-semibold text-primary-foreground eco-gradient eco-shadow disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {nextLabel}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StepLayout;
