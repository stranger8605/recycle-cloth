import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const ShopOwnerLoginPage = () => {
  const navigate = useNavigate();
  const { loginAsShopOwner } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.trim().length >= 3 && password.length >= 8 && !submitting;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('shop_owners')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        // Check localStorage fallback
        const localShops = JSON.parse(localStorage.getItem('eco_local_shop_owners') || '[]');
        const localUser = localShops.find(
          (s: any) => s.username === username.trim() && s.password === password
        );

        if (!localUser) {
          toast.error('Invalid username or password.');
          setSubmitting(false);
          return;
        }

        loginAsShopOwner({
          id: localUser.id,
          username: localUser.username,
          name: localUser.name,
          shop_name: localUser.shop_name,
          shop_location: localUser.shop_location,
          mobile: localUser.mobile,
        });

        toast.success(`Welcome back, ${localUser.name}!`);
        navigate('/shop/dashboard');
        return;
      }

      const user = data[0];
      loginAsShopOwner({
        id: user.id,
        username: user.username,
        name: user.name,
        shop_name: user.shop_name,
        shop_location: user.shop_location,
        mobile: user.mobile,
      });

      toast.success(`Welcome back, ${user.name}!`);
      navigate('/shop/dashboard');
    } catch (err: any) {
      console.warn('Supabase unreachable, trying local storage:', err.message);

      // Fallback: check localStorage
      const localShops = JSON.parse(localStorage.getItem('eco_local_shop_owners') || '[]');
      const localUser = localShops.find(
        (s: any) => s.username === username.trim() && s.password === password
      );

      if (!localUser) {
        toast.error('Invalid username or password.');
        setSubmitting(false);
        return;
      }

      loginAsShopOwner({
        id: localUser.id,
        username: localUser.username,
        name: localUser.name,
        shop_name: localUser.shop_name,
        shop_location: localUser.shop_location,
        mobile: localUser.mobile,
      });

      toast.success(`Welcome back, ${localUser.name}!`);
      navigate('/shop/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Shop Owner Login</h1>
          <p className="text-muted-foreground text-sm">Manage your recycling shop</p>
        </div>

        <div className="space-y-4">
          {/* Username */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full pl-11 pr-11 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl font-semibold text-primary-foreground eco-gradient eco-shadow disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {submitting ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            New Shop Owner?{' '}
            <button
              onClick={() => navigate('/shop/register')}
              className="text-primary font-medium hover:underline"
            >
              Register here
            </button>
          </p>

          <button
            onClick={() => navigate('/auth')}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to Role Selection
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ShopOwnerLoginPage;
