import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'customer' | 'shop_owner' | 'admin';

export interface CustomerUser {
  id: string;
  username: string;
  name: string;
  mobile: string;
}

export interface ShopOwnerUser {
  id: string;
  username: string;
  name: string;
  shop_name: string;
  shop_location: string;
  mobile: string;
}

export interface AdminUser {
  username: string;
}

export type AuthUser = CustomerUser | ShopOwnerUser | AdminUser;

interface AuthState {
  isLoggedIn: boolean;
  role: UserRole | null;
  user: AuthUser | null;
}

interface AuthContextType {
  auth: AuthState;
  loginAsCustomer: (user: CustomerUser) => void;
  loginAsShopOwner: (user: ShopOwnerUser) => void;
  loginAsAdmin: () => void;
  logout: () => void;
}

const initialAuth: AuthState = {
  isLoggedIn: false,
  role: null,
  user: null,
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(initialAuth);

  const loginAsCustomer = (user: CustomerUser) => {
    setAuth({ isLoggedIn: true, role: 'customer', user });
  };

  const loginAsShopOwner = (user: ShopOwnerUser) => {
    setAuth({ isLoggedIn: true, role: 'shop_owner', user });
  };

  const loginAsAdmin = () => {
    setAuth({ isLoggedIn: true, role: 'admin', user: { username: 'vicky' } });
  };

  const logout = () => {
    setAuth(initialAuth);
  };

  return (
    <AuthContext.Provider value={{ auth, loginAsCustomer, loginAsShopOwner, loginAsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
