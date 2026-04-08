import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RecycleProvider } from "./context/RecycleContext";
import HomePage from "./pages/HomePage";
import AuthPortalPage from "./pages/AuthPortalPage";
import CustomerLoginPage from "./pages/CustomerLoginPage";
import CustomerRegisterPage from "./pages/CustomerRegisterPage";
import CustomerOrdersPage from "./pages/CustomerOrdersPage";
import ShopOwnerLoginPage from "./pages/ShopOwnerLoginPage";
import ShopOwnerRegisterPage from "./pages/ShopOwnerRegisterPage";
import AdminLoginPage from "./pages/AdminLoginPage";

import ClothesPage from "./pages/ClothesPage";

import CategoriesPage from "./pages/CategoriesPage";
import ShopsPage from "./pages/ShopsPage";

import QuantityPage from "./pages/QuantityPage";
import PricingPage from "./pages/PricingPage";
import RedeemPage from "./pages/RedeemPage";
import ThankYouPage from "./pages/ThankYouPage";
import AdminPage from "./pages/AdminPage";
import ShopDashboardPage from "./pages/ShopDashboardPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RecycleProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPortalPage />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />

              {/* Customer Auth */}
              <Route path="/customer/login" element={<CustomerLoginPage />} />
              <Route path="/customer/register" element={<CustomerRegisterPage />} />

              {/* Shop Owner Auth */}
              <Route path="/shop/login" element={<ShopOwnerLoginPage />} />
              <Route path="/shop/register" element={<ShopOwnerRegisterPage />} />

              {/* Admin Auth */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Protected Recycling Flow */}
              <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['customer']}><CustomerOrdersPage /></ProtectedRoute>} />

              <Route path="/clothes" element={<ProtectedRoute><ClothesPage /></ProtectedRoute>} />

              <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
              <Route path="/shops" element={<ProtectedRoute><ShopsPage /></ProtectedRoute>} />

              <Route path="/quantity" element={<ProtectedRoute><QuantityPage /></ProtectedRoute>} />
              <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
              <Route path="/redeem" element={<ProtectedRoute><RedeemPage /></ProtectedRoute>} />
              <Route path="/thankyou" element={<ProtectedRoute><ThankYouPage /></ProtectedRoute>} />

              {/* Shop Owner Dashboard */}
              <Route path="/shop/dashboard" element={<ProtectedRoute allowedRoles={['shop_owner']}><ShopDashboardPage /></ProtectedRoute>} />

              {/* Admin Panel (protected by admin role) */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </RecycleProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
