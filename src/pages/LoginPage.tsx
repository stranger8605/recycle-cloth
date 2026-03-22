import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useRecycle } from '@/context/RecycleContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { update } = useRecycle();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOtp, setIsOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const generateOtp = () => {
    if (!/^[0-9]{10}$/.test(phone)) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    // In production, send via SMS gateway
    alert(`Your OTP is: ${code}`);
  };

  const handleLogin = () => {
    // Note: In production, authenticate via server-side before setting isLoggedIn
    update({ phone, isLoggedIn: true });
    navigate('/profile');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl eco-gradient flex items-center justify-center mx-auto mb-4 eco-shadow">
            <span className="text-3xl">♻️</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground">Login to start recycling</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
              type="tel"
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {!isOtp ? (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-center text-xl tracking-[0.5em] placeholder:tracking-normal placeholder:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {!otpSent ? (
                <button
                  onClick={generateOtp}
                  disabled={!/^[0-9]{10}$/.test(phone)}
                  className="w-full py-2.5 rounded-xl font-medium text-primary border-2 border-primary hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send OTP
                </button>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">OTP sent to {phone}</p>
                  <button
                    onClick={generateOtp}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Resend
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between text-sm">
            <button
              onClick={() => setIsOtp(!isOtp)}
              className="text-primary font-medium hover:underline"
            >
              {isOtp ? 'Use Password' : 'Login via OTP'}
            </button>
            <button className="text-muted-foreground hover:underline">
              Forgot Password?
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={!/^[0-9]{10}$/.test(phone) || (!isOtp && password.length < 8) || (isOtp && (!otpSent || otp !== generatedOtp))}
            className="w-full py-3.5 rounded-xl font-semibold text-primary-foreground eco-gradient eco-shadow disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isOtp ? 'Verify OTP' : 'Login'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            New User?{' '}
            <button className="text-primary font-medium hover:underline">
              Register here
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
