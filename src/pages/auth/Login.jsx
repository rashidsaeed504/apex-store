import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Logo from "../../components/ui/Logo";

// High-fidelity Google SVG Icon
const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.registeredEmail || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(location.state?.error || "");
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");

  const { signIn, signInWithGoogle, user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Customer Login | APEX Store";
    window.scrollTo(0, 0);
    if (user) {
      const from = location.state?.from?.pathname || "/account";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg("Please provide both your email address and password.");
      toastError("Please provide both your email address and password.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn({ email: cleanEmail, password });
      success("Logged in successfully! Welcome back.");
      const from = location.state?.from?.pathname || "/account";
      navigate(from, { replace: true });
    } catch (err) {
      console.warn("Customer login error:", err);
      let msg =
        err.message || "Failed to sign in. Please verify your credentials.";
      if (msg.includes("Invalid login credentials")) {
        msg = "Invalid email or password. Please check and try again.";
      } else if (msg.includes("Email not confirmed")) {
        msg =
          "Your email address has not been confirmed yet. Please check your inbox.";
      }
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setGoogleLoading(true);
    try {
      const destination = location.state?.from?.pathname || "/account";
      await signInWithGoogle(destination);
    } catch (err) {
      console.warn("Google OAuth initialization error:", err);
      const msg = err.message || "Failed to start Google sign-in. Please try again.";
      setErrorMsg(msg);
      toastError(msg);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 pt-24 mt-16 pb-16 relative overflow-hidden">
      {/* Cyberpunk ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-apex-red/15 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <Logo variant="navbar" />
        </div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-apex-red/10 border border-apex-red/30 text-apex-red flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <UserCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Customer <span className="text-apex-red">Sign In</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Access your orders, saved addresses, and member benefits.
          </p>
        </div>

        {/* Success Message Banner (e.g. from Signup redirection) */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-left text-xs text-emerald-400 leading-relaxed shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-0.5">Registration Successful</p>
              <p className="text-emerald-300/90">{successMsg}</p>
            </div>
          </motion.div>
        )}

        {/* Error Message Banner */}
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

        {/* Continue with Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting || googleLoading}
          className="w-full mb-6 bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 hover:border-white/20 rounded-xl py-3 px-4 text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Connecting to Google...
            </>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-white/10" />
          <span className="px-3 text-[11px] font-mono text-gray-500 uppercase tracking-widest">
            OR WITH EMAIL
          </span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 text-left">
              Email Address
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-apex-red hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-11 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={submitting || googleLoading}
            className="w-full btn-primary py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.35)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] cursor-pointer disabled:opacity-50 mt-6"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In to Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider & Sign Up Option */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-gray-400">
            Don't have an APEX account yet?{" "}
            <Link
              to="/signup"
              className="text-apex-red font-bold hover:underline ml-1"
            >
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
