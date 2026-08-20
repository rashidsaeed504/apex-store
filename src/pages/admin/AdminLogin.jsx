import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import logo from '../../assets/logo.png';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Apexstore15024M');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: toastError } = useToast();

  // Redirect if already logged in with a valid Supabase session
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const from = location.state?.from?.pathname || '/admin';
          navigate(from, { replace: true });
        }
      } catch (err) {
        console.warn('Session check error:', err);
      }
    }
    checkExistingSession();
  }, [navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both admin email and password.');
      toastError('Please enter both admin email and password.');
      return;
    }

    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase client is not configured. Please check environment configuration.');
      }

      // Authenticate directly against Supabase Auth server
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        // Specific user-friendly error messages
        const msg = error.message.includes('Invalid login credentials')
          ? 'Invalid email or password. Please verify your credentials.'
          : error.message || 'Authentication failed. Please try again.';
        
        setErrorMessage(msg);
        toastError(msg);
        setLoading(false);
        return;
      }

      if (data?.session && data?.user) {
        success(`Welcome back, ${data.user.email}!`);
        const from = location.state?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      } else {
        setErrorMessage('Authentication failed: No active session created.');
        toastError('Authentication failed: No active session created.');
      }
    } catch (err) {
      const msg = err.message || 'An unexpected error occurred during login.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden"
      >
        {/* Ambient glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-apex-red/15 blur-[80px] rounded-full pointer-events-none" />

        <img src={logo} alt="APEX STORE" className="h-10 mx-auto mb-6 relative z-10" />

        <div className="w-12 h-12 rounded-full bg-apex-red/10 border border-apex-red/30 flex items-center justify-center mx-auto mb-4 text-apex-red relative z-10">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-2 relative z-10">
          Admin Portal
        </h1>
        <p className="text-xs text-gray-400 mb-6 relative z-10">
          Sign in with authorized Supabase credentials to manage products, orders & database.
        </p>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-left text-xs text-red-400"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left relative z-10">
          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@apexstore.com"
                className="w-full bg-[#111] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#111] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-6 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Access Dashboard <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
