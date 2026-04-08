import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface RecycleState {
  // Profile
  gender: string;
  ageRange: string;
  // Clothes
  selectedClothes: string[];
  clothPhotos: string[];
  // Location
  district: string;
  // Category
  category: string;
  // Shop
  selectedShop: string;
  // Contact
  address: string;
  contactPhone: string;
  pickupDate: string;
  pickupTime: string;
  // Quantities
  clothQuantities: Record<string, number>;
  // Quality (from photo scan)
  qualityMultiplier: number;
  // Payment
  paymentMethod: string;
  // Redeem
  redeemOption: string;
  // Order
  orderId: string;
}

interface RecycleContextType {
  state: RecycleState;
  update: (partial: Partial<RecycleState>) => void;
  reset: () => void;
}

const initialState: RecycleState = {
  gender: '',
  ageRange: '',
  selectedClothes: [],
  clothPhotos: [],
  district: '',
  category: '',
  selectedShop: '',
  address: '',
  contactPhone: '',
  pickupDate: '',
  pickupTime: '',
  clothQuantities: {},
  qualityMultiplier: 1.0,
  paymentMethod: '',
  redeemOption: '',
  orderId: '',
};

const RECYCLE_STORAGE_KEY = 'eco_threads_recycle';

const getStoredState = (): RecycleState => {
  try {
    const stored = sessionStorage.getItem(RECYCLE_STORAGE_KEY);
    if (stored) return { ...initialState, ...JSON.parse(stored) };
  } catch {}
  return initialState;
};

const RecycleContext = createContext<RecycleContextType | null>(null);

export const RecycleProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<RecycleState>(getStoredState);

  useEffect(() => {
    sessionStorage.setItem(RECYCLE_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const update = (partial: Partial<RecycleState>) => {
    setState(prev => ({ ...prev, ...partial }));
  };

  const reset = () => {
    setState(initialState);
    sessionStorage.removeItem(RECYCLE_STORAGE_KEY);
  };

  return (
    <RecycleContext.Provider value={{ state, update, reset }}>
      {children}
    </RecycleContext.Provider>
  );
};

export const useRecycle = () => {
  const ctx = useContext(RecycleContext);
  if (!ctx) throw new Error('useRecycle must be used within RecycleProvider');
  return ctx;
};
