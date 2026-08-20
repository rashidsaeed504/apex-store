import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Lock, Save, Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AccountProfile() {
  const { user, profile, updateProfile, updatePassword } = useAuth();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    shippingAddress: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    document.title = "Profile Settings | APEX Store";
    if (profile || user) {
      setFormData({
        fullName: profile?.full_name || user?.user_metadata?.full_name || '',
        phone: profile?.phone || user?.user_metadata?.phone || '',
        city: profile?.city || 'Lahore',
        shippingAddress: profile?.shipping_address || '',
      });
    }
  }, [profile, user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        shipping_address: formData.shippingAddress.trim(),
      });
      success('Profile details updated successfully!');
    } catch (err) {
      console.warn('Profile update error:', err);
      toastError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      toastError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toastError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(passwordData.newPassword);
      success('Password changed successfully!');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.warn('Password change error:', err);
      toastError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Personal Information Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8"
      >
        <div className="flex items-center gap-3 mb-5 pb-3.5 border-b border-white/10">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-apex-red/10 border border-apex-red/20 text-apex-red flex items-center justify-center shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-white leading-tight">
              PERSONAL <span className="text-apex-red">INFORMATION</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
              Update your contact details for smooth delivery and communication.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3.5 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleProfileChange}
                  placeholder="Your Full Name"
                  className="w-full h-11 sm:h-12 bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3.5 text-sm text-white placeholder-gray-500 focus:border-apex-red focus:shadow-[0_0_12px_rgba(220,38,38,0.25)] outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Address (Read Only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
                  Email Address
                </label>
                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-400 font-bold">
                  <ShieldCheck size={11} /> Verified
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full h-11 sm:h-12 bg-[#161616] border border-white/5 rounded-xl pl-10 pr-3.5 text-sm text-gray-400 cursor-not-allowed opacity-80"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Phone Number */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleProfileChange}
                  placeholder="0300 1234567"
                  className="w-full h-11 sm:h-12 bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3.5 text-sm text-white placeholder-gray-500 focus:border-apex-red focus:shadow-[0_0_12px_rgba(220,38,38,0.25)] outline-none transition-all"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                City / Region
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleProfileChange}
                  placeholder="e.g. Lahore"
                  className="w-full h-11 sm:h-12 bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3.5 text-sm text-white placeholder-gray-500 focus:border-apex-red focus:shadow-[0_0_12px_rgba(220,38,38,0.25)] outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Primary Shipping Address */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Default Shipping Address
            </label>
            <textarea
              rows={2}
              name="shippingAddress"
              value={formData.shippingAddress}
              onChange={handleProfileChange}
              placeholder="Street address, house/apartment number, nearest landmark"
              className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:border-apex-red focus:shadow-[0_0_12px_rgba(220,38,38,0.25)] outline-none transition-all resize-none"
            />
          </div>

          {/* Save Button Action */}
          <div className="pt-2 flex justify-start sm:justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_18px_rgba(220,38,38,0.35)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes →
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* 2. Security & Password Change Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8"
      >
        <div className="flex items-center gap-3 mb-5 pb-3.5 border-b border-white/10">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-white leading-tight">
              CHANGE <span className="text-apex-red">PASSWORD</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
              Ensure your account is protected with a strong, unique password.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-3.5 sm:space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {/* New Password */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  placeholder="Min. 6 characters"
                  className="w-full h-11 sm:h-12 bg-[#121212] border border-white/10 rounded-xl pl-10 pr-10 text-sm text-white placeholder-gray-500 focus:border-apex-red focus:shadow-[0_0_12px_rgba(220,38,38,0.25)] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  placeholder="Confirm new password"
                  className="w-full h-11 sm:h-12 bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-apex-red focus:shadow-[0_0_12px_rgba(220,38,38,0.25)] outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-start sm:justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-apex-red text-white transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
