import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RecycleState {
  // Profile
  gender: string;
  ageRange: string;
  // Clothes
  selectedClothes: string[];
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
  // Payment
  paymentMethod: string;
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
  district: '',
  category: '',
  selectedShop: '',
  address: '',
  contactPhone: '',
  pickupDate: '',
  pickupTime: '',
  clothQuantities: {},
  paymentMethod: '',
  orderId: '',
};

const RecycleContext = createContext<RecycleContextType | null>(null);

export const RecycleProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<RecycleState>(initialState);

  const update = (partial: Partial<RecycleState>) => {
    setState(prev => ({ ...prev, ...partial }));
  };

  const reset = () => setState(initialState);

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
