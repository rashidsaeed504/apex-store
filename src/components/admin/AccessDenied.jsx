import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, LogOut, User, Home } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import logo from '../../assets/logo.png';

export default function AccessDenied({ user }) {
  const navigate = useNavigate();
  const { info } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      if (info) info('Signed out successfully. Please sign in with an authorized administrator account.');
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    navigate('/login', { replace: true, state: { from: '/admin' } });
  };

  const userEmail = user?.email || user?.user_metadata?.email || 'Current Account';

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 selection:bg-apex-red/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-10 text-center shadow-2xl relative overflow-hidden"
      >
        {/* Ambient glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-apex-red/15 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-apex-red/10 blur-[80px] rounded-full pointer-events-none" />

        <img src={logo} alt="APEX STORE" className="h-9 mx-auto mb-6 relative z-10" />

        {/* Shield Alert Icon */}
        <div className="w-16 h-16 rounded-2xl bg-apex-red/10 border border-apex-red/30 flex items-center justify-center mx-auto mb-5 text-apex-red shadow-[0_0_30px_rgba(220,38,38,0.25)] relative z-10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-widest text-apex-red bg-apex-red/10 border border-apex-red/20 px-3.5 py-1 rounded-full mb-3 relative z-10">
          403 FORBIDDEN
        </span>

        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-2 relative z-10">
          Access <span className="text-apex-red">Restricted</span>
        </h1>

        <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed max-w-md mx-auto relative z-10">
          You don't have permission to access the APEX Store Admin Portal. This area is reserved exclusively for authorized administrators.
        </p>

        {/* Current Authenticated User Tag */}
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 mb-6 text-left flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
            <User size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-mono uppercase text-gray-500 font-bold">Currently Signed In</p>
            <p className="text-xs sm:text-sm font-bold text-white truncate">{userEmail}</p>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
            Customer
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => navigate('/')}
            className="btn-primary w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(220,38,38,0.3)] cursor-pointer"
          >
            <Home size={16} />
            <span>Return to Store</span>
          </motion.button>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => navigate('/account')}
              className="py-3 px-4 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <User size={14} />
              <span>My Account</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={handleSignOut}
              className="py-3 px-4 rounded-xl border border-white/10 text-gray-300 hover:text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span>Switch Account</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
