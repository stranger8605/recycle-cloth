import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const CustomerLoginPage = () => {
  const navigate = useNavigate();
  const { loginAsCustomer } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.trim().length >= 3 && password.length >= 8 && !submitting;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        // Also check local storage before showing error
        const localUser = checkLocalStorage();
        if (localUser) return;

        toast.error('Invalid username or password.');
        setSubmitting(false);
        return;
      }

      const user = data[0];
      loginAsCustomer({
        id: user.id,
        username: user.username,
        name: user.name,
        mobile: user.mobile,
        district: user.district || '',
        address: user.address || '',
      });

      toast.success(`Welcome back, ${user.name}!`);
      navigate('/clothes');
    } catch (err: any) {
      console.warn('Supabase unreachable, trying local storage:', err.message);

      // ── Fallback: check localStorage ──
      const localUser = checkLocalStorage();
      if (!localUser) {
        toast.error('Invalid username or password.');
      }
      setSubmitting(false);
    }
  };

  const checkLocalStorage = (): boolean => {
    const localCustomers = JSON.parse(localStorage.getItem('eco_local_customers') || '[]');
    const user = localCustomers.find(
      (c: any) => c.username === username.trim() && c.password === password
    );

    if (user) {
      loginAsCustomer({
        id: user.id,
        username: user.username,
        name: user.name,
        mobile: user.mobile,
        district: user.district || '',
        address: user.address || '',
      });

      toast.success(`Welcome back, ${user.name}!`);
      navigate('/clothes');
      return true;
    }
    return false;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Customer Login</h1>
          <p className="text-muted-foreground text-sm">Login to start recycling</p>
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
            New Customer?{' '}
            <button
              onClick={() => navigate('/customer/register')}
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

export default CustomerLoginPage;
