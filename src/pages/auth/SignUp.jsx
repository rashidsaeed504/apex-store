import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  ArrowRight,
  AlertCircle,
  Loader2,
  UserPlus,
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

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "Lahore",
    address: "",
    password: "",
    confirmPassword: "",
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { signUp, signInWithGoogle, user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const getDestination = () => {
    // 1. Check router location state
    const from = location.state?.from;
    if (typeof from === 'string' && from.startsWith('/') && !from.includes('/login') && !from.includes('/auth') && !from.includes('/signup')) {
      return from;
    }
    if (from?.pathname && typeof from.pathname === 'string' && from.pathname.startsWith('/') && !from.pathname.includes('/login') && !from.pathname.includes('/auth') && !from.pathname.includes('/signup')) {
      return from.pathname;
    }

    // 2. Check URL search query parameter (?redirect= or ?from=)
    try {
      const searchParams = new URLSearchParams(location.search);
      const qRedirect = searchParams.get('redirect') || searchParams.get('from');
      if (qRedirect && qRedirect.startsWith('/') && !qRedirect.includes('/login') && !qRedirect.includes('/auth') && !qRedirect.includes('/signup')) {
        return qRedirect;
      }
    } catch (e) {}

    // 3. Check temporary sessionStorage redirect
    try {
      const stored = sessionStorage.getItem('apex_auth_redirect');
      if (stored && stored.startsWith('/') && !stored.includes('/login') && !stored.includes('/auth') && !stored.includes('/signup')) {
        return stored;
      }
    } catch (e) {}

    return '/account';
  };

  useEffect(() => {
    document.title = "Create Customer Account | APEX Store";
    window.scrollTo(0, 0);

    const dest = getDestination();
    if (dest && dest !== '/account') {
      try {
        sessionStorage.setItem('apex_auth_redirect', dest);
      } catch (e) {}
    }

    if (user) {
      try {
        sessionStorage.removeItem('apex_auth_redirect');
      } catch (e) {}
      navigate(dest, { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      toastError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMsg("Please enter a valid email address.");
      toastError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      toastError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-check.");
      toastError("Passwords do not match.");
      return;
    }

    if (!formData.agreeTerms) {
      setErrorMsg(
        "Please agree to the Terms & Conditions to create an account.",
      );
      toastError("Please agree to the Terms & Conditions.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUp({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
      });

      const messageText = result.needsEmailConfirmation
        ? "Account created. Please check your email to verify your account, then log in."
        : "Account created successfully. Please log in to continue.";

      success(messageText);

      const dest = getDestination();
      try {
        sessionStorage.setItem('apex_auth_redirect', dest);
      } catch (e) {}

      // Immediately redirect to LOGIN page with state message, pre-filled email and preserved destination
      navigate("/login", {
        replace: true,
        state: {
          message: messageText,
          registeredEmail: formData.email.trim(),
          from: dest,
        },
      });
    } catch (err) {
      console.warn("Sign up error:", err);
      let msg = err.message || "Failed to create account. Please try again.";
      if (msg.includes("already registered") || msg.includes("already exists")) {
        msg =
          "An account with this email address already exists. Please log in instead.";
      }
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMsg("");
    setGoogleLoading(true);
    try {
      const destination = getDestination();
      try {
        sessionStorage.setItem('apex_auth_redirect', destination);
      } catch (e) {}
      await signInWithGoogle(destination);
    } catch (err) {
      console.warn("Google OAuth error:", err);
      const msg = err.message || "Failed to start Google registration. Please try again.";
      setErrorMsg(msg);
      toastError(msg);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 pt-24 pb-16 mt-16 relative overflow-hidden">
      {/* Ambient glowing effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-apex-red/15 blur-[140px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <Logo variant="navbar" />
        </div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-apex-red/10 border border-apex-red/30 text-apex-red flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Create <span className="text-apex-red">Account</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Join APEX to unlock faster checkout, track orders, and submit
            verified reviews.
          </p>
        </div>

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
          onClick={handleGoogleSignUp}
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
            OR FILL REGISTRATION FORM
          </span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Furkan Rashid"
                className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
              />
            </div>
          </div>

          {/* Phone Number & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0300 1234567"
                  className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Lahore"
                  className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Default Shipping Address (Optional)
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="House/Apt #, Street, Area, Landmark"
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
            />
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 chars"
                  className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-apex-red outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
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
          </div>

          {/* Terms Agreement */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 accent-apex-red w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-400 leading-relaxed">
                I agree to the{" "}
                <Link
                  to="/terms-and-conditions"
                  target="_blank"
                  className="text-apex-red hover:underline font-semibold"
                >
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  className="text-apex-red hover:underline font-semibold"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || googleLoading}
            className="w-full btn-primary py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.35)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] cursor-pointer disabled:opacity-50 mt-6"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create APEX Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Existing Member Link */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-gray-400">
            Already have an APEX account?{" "}
            <Link
              to="/login"
              state={{ from: getDestination() }}
              className="text-apex-red font-bold hover:underline ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
