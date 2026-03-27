import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Lock, Eye, EyeOff, CheckCircle, XCircle, ShieldCheck, Loader2, Camera, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendOtp as twilioSendOtp, verifyOtp as twilioVerifyOtp } from '@/lib/twilioService';

const getPasswordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
  if (score <= 3) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
  return { label: 'Strong', color: 'bg-green-500', width: '100%' };
};

const passwordRules = [
  { test: (pw: string) => pw.length >= 8, label: 'At least 8 characters' },
  { test: (pw: string) => /[A-Z]/.test(pw), label: 'One uppercase letter' },
  { test: (pw: string) => /[a-z]/.test(pw), label: 'One lowercase letter' },
  { test: (pw: string) => /[0-9]/.test(pw), label: 'One number' },
  { test: (pw: string) => /[^A-Za-z0-9]/.test(pw), label: 'One special character' },
];



const inputClass = 'w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const CustomerRegisterPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');

  const [mobile, setMobile] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB.');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generateOtp = async () => {
    if (!/^[0-9]{10}$/.test(mobile)) return;
    setSendingOtp(true);
    const result = await twilioSendOtp(mobile);
    setSendingOtp(false);
    if (result.success) {
      setOtpSent(true);
      setOtpVerified(false);
      toast.success(`Your OTP code is: ${result.code}`, { duration: 15000 });
    } else {
      toast.error(result.error || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setVerifyingOtp(true);
    const result = await twilioVerifyOtp(mobile, otp);
    setVerifyingOtp(false);
    if (result.verified) {
      setOtpVerified(true);
      toast.success('Mobile number verified!');
    } else {
      toast.error(result.error || 'Invalid OTP. Please try again.');
    }
  };

  const strength = getPasswordStrength(password);
  const allRulesPass = passwordRules.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const canSubmit =
    username.trim().length >= 3 &&
    name.trim().length >= 2 &&
    otpVerified &&
    allRulesPass &&
    passwordsMatch &&
    !submitting;

  const handleRegister = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      // Check if username or mobile already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .or(`username.eq."${username.trim()}",mobile.eq."${mobile}"`)
        .limit(1);

      if (checkError) {
        console.error('Supabase check error:', checkError);
        toast.error(`Registration failed: ${checkError.message}`);
        setSubmitting(false);
        return;
      }

      if (existingUser && existingUser.length > 0) {
        toast.error('Username or mobile number already registered.');
        setSubmitting(false);
        return;
      }

      // Upload photo if selected
      let photoUrl: string | null = null;
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${username.trim()}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('customer-photos')
          .upload(fileName, photoFile);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          toast.error('Failed to upload photo. Registering without photo.');
        } else {
          const { data: urlData } = supabase.storage
            .from('customer-photos')
            .getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('customers').insert({
        username: username.trim(),
        name: name.trim(),
        mobile,
        password,
        mobile_verified: true,

        phone: phone || null,
        address: address.trim() || null,
        photo_url: photoUrl,
      });

      if (error) {
        console.error('Supabase insert error:', error);
        toast.error(`Registration failed: ${error.message}`);
        setSubmitting(false);
        return;
      }

      toast.success('Registration successful! Please login.');
      navigate('/customer/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(`Registration failed: ${err.message || 'Unknown error'}`);
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <User className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground text-sm">Register as a Customer</p>
        </div>

        <div className="space-y-3">
          {/* Profile Photo Upload */}
          <div className="flex justify-center mb-2">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-input bg-card flex items-center justify-center overflow-hidden transition-all group-hover:border-primary group-hover:shadow-md">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground -mt-1">Tap to upload photo</p>

          {/* Username */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Username (min 3 chars)"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
              className={inputClass}
            />
          </div>

          {/* Full Name */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>



          {/* Mobile + OTP */}
          <div className="space-y-2">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                placeholder="Mobile Number (10 digits)"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, ''));
                  setOtpSent(false);
                  setOtpVerified(false);
                }}
                maxLength={10}
                disabled={otpVerified}
                className={`${inputClass} disabled:opacity-60`}
              />
            </div>

            {otpVerified ? (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium px-1">
                <CheckCircle className="w-4 h-4" /> Mobile verified
              </div>
            ) : (
              <>
                {otpSent && (
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-center text-lg tracking-[0.4em] placeholder:tracking-normal placeholder:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
                <div className="flex gap-2">
                  {!otpSent ? (
                    <button
                      onClick={generateOtp}
                      disabled={!/^[0-9]{10}$/.test(mobile) || sendingOtp}
                      className="flex-1 py-2.5 rounded-xl font-medium text-primary border-2 border-primary hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                      {sendingOtp ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send OTP'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleVerifyOtp}
                        disabled={otp.length !== 6 || verifyingOtp}
                        className="flex-1 py-2.5 rounded-xl font-medium text-primary-foreground eco-gradient disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                      >
                        {verifyingOtp ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify OTP'}
                      </button>
                      <button
                        onClick={generateOtp}
                        disabled={sendingOtp}
                        className="py-2.5 px-4 rounded-xl font-medium text-primary border-2 border-primary hover:bg-accent transition-colors text-sm disabled:opacity-50"
                      >
                        {sendingOtp ? '...' : 'Resend'}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Phone Number (alternative) */}
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              placeholder="Phone Number (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              className={inputClass}
            />
          </div>

          {/* Address */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength meter */}
          {password.length > 0 && (
            <div className="space-y-2 px-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Password Strength</span>
                <span className={`font-semibold ${strength.color === 'bg-red-500' ? 'text-red-500' : strength.color === 'bg-yellow-500' ? 'text-yellow-500' : 'text-green-500'}`}>
                  {strength.label}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${strength.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: strength.width }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="space-y-1">
                {passwordRules.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2 text-xs">
                    {rule.test(password) ? (
                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                    <span className={rule.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-red-500 px-1">Passwords do not match</p>
          )}

          {/* Submit */}
          <button
            onClick={handleRegister}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl font-semibold text-primary-foreground eco-gradient eco-shadow disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/customer/login')}
              className="text-primary font-medium hover:underline"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerRegisterPage;
