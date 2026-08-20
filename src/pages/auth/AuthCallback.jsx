import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Logo from '../../components/ui/Logo';

export default function AuthCallback() {
  const [errorMsg, setErrorMsg] = useState(null);
  const { refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Authenticating | APEX Store';

    async function handleAuthCallback() {
      if (!isSupabaseConfigured) {
        setErrorMsg('Supabase client is not configured.');
        return;
      }

      // Check if URL has an error param from OAuth provider
      const searchParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.substring(1));
      
      const error = searchParams.get('error') || hashParams.get('error');
      const errorDescription = 
        searchParams.get('error_description') || 
        hashParams.get('error_description') ||
        searchParams.get('message');

      if (error) {
        console.warn('OAuth Error:', error, errorDescription);
        const displayErr = errorDescription ? decodeURIComponent(errorDescription).replace(/\+/g, ' ') : 'Authentication failed. Please try again.';
        setErrorMsg(displayErr);
        if (toastError) toastError(displayErr);
        setTimeout(() => {
          navigate('/login', { replace: true, state: { error: displayErr } });
        }, 2000);
        return;
      }

      try {
        // Exchange code/hash session with Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          const user = session.user;
          const userEmail = user.email;
          const userMetadata = user.user_metadata || {};
          const fullName = userMetadata.full_name || userMetadata.name || '';
          const avatarUrl = userMetadata.avatar_url || userMetadata.picture || '';

          // Upsert customer profile in Supabase
          if (userEmail) {
            try {
              await supabase.from('customers').upsert(
                [
                  {
                    id: user.id,
                    email: userEmail.trim().toLowerCase(),
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                  },
                ],
                { onConflict: 'email' }
              );
            } catch (custErr) {
              console.warn('Customer upsert during OAuth warning:', custErr);
            }
          }

          if (refreshProfile) {
            await refreshProfile();
          }

          if (success) success('Signed in successfully! Welcome to APEX.');

          // Retrieve destination from sessionStorage or query param
          let targetPath = '/account';
          try {
            const stored = sessionStorage.getItem('apex_auth_redirect');
            const searchParams = new URLSearchParams(location.search);
            const queryRedirect = searchParams.get('redirect') || searchParams.get('from');

            if (stored && stored.startsWith('/') && !stored.includes('/login') && !stored.includes('/auth') && !stored.includes('/signup')) {
              targetPath = stored;
            } else if (queryRedirect && queryRedirect.startsWith('/') && !queryRedirect.includes('/login') && !queryRedirect.includes('/auth') && !queryRedirect.includes('/signup')) {
              targetPath = queryRedirect;
            }
            sessionStorage.removeItem('apex_auth_redirect');
          } catch (e) {
            console.warn('Session storage read error:', e);
          }

          navigate(targetPath, { replace: true });
        } else {
          // If session is not immediately ready, wait for onAuthStateChange
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession?.user) {
              subscription.unsubscribe();
              if (success) success('Signed in successfully! Welcome to APEX.');
              
              let targetPath = '/account';
              try {
                const stored = sessionStorage.getItem('apex_auth_redirect');
                const searchParams = new URLSearchParams(location.search);
                const queryRedirect = searchParams.get('redirect') || searchParams.get('from');

                if (stored && stored.startsWith('/') && !stored.includes('/login') && !stored.includes('/auth') && !stored.includes('/signup')) {
                  targetPath = stored;
                } else if (queryRedirect && queryRedirect.startsWith('/') && !queryRedirect.includes('/login') && !queryRedirect.includes('/auth') && !queryRedirect.includes('/signup')) {
                  targetPath = queryRedirect;
                }
                sessionStorage.removeItem('apex_auth_redirect');
              } catch (e) {}

              navigate(targetPath, { replace: true });
            }
          });

          // Timeout fallback if no session received in 4 seconds
          setTimeout(() => {
            subscription.unsubscribe();
            navigate('/login', { replace: true });
          }, 4000);
        }
      } catch (err) {
        console.warn('OAuth callback handling error:', err);
        const errText = err.message || 'Authentication error. Please sign in again.';
        setErrorMsg(errText);
        if (toastError) toastError(errText);
        setTimeout(() => {
          navigate('/login', { replace: true, state: { error: errText } });
        }, 2000);
      }
    }

    handleAuthCallback();
  }, [navigate, location, refreshProfile, success, toastError]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 pt-24 pb-16 relative overflow-hidden">
      {/* Cyberpunk ambient red glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-apex-red/15 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative z-10 space-y-6"
      >
        <div className="flex justify-center mb-2">
          <Logo variant="navbar" />
        </div>

        {errorMsg ? (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-white">
              Authentication Error
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              {errorMsg}
            </p>
            <p className="text-[11px] text-gray-500 font-mono">
              Redirecting you to the login page...
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 rounded-2xl bg-apex-red/15 border border-apex-red/30 text-apex-red flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(220,38,38,0.35)]">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">
              Authenticating with <span className="text-apex-red">Google</span>
            </h2>
            <p className="text-xs text-gray-400">
              Securing your APEX account session. Please wait a moment...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
