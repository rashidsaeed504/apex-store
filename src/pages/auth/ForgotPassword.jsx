import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Logo from '../../components/ui/Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { resetPassword } = useAuth();
  const { success, error: toastError } = useToast();

  useEffect(() => {
    document.title = "Reset Password | APEX Store";
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your account email address.');
      toastError('Please enter your account email address.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(cleanEmail);
      setSubmitted(true);
      success('Password reset link sent to your email.');
    } catch (err) {
      console.warn('Password reset error:', err);
      const msg = err.message || 'Failed to send password reset email. Please try again.';
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 pt-24 pb-16 mt-16 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-apex-red/15 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 text-center"
      >
        <div className="flex justify-center mb-6">
          <Logo variant="navbar" />
        </div>

        <div className="w-12 h-12 rounded-2xl bg-apex-red/10 border border-apex-red/30 text-apex-red flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
          <KeyRound className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
          Reset <span className="text-apex-red">Password</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mb-6">
          Enter your registered email address to receive a secure recovery link.
        </p>

        {submitted ? (
          <div className="py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Check Your Inbox
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
              We've sent a password reset link to <strong className="text-white">{email}</strong>. Click the link in the email to set a new password.
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-left text-xs text-red-400 leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Your Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.35)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] cursor-pointer disabled:opacity-50 mt-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    Send Recovery Email
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
