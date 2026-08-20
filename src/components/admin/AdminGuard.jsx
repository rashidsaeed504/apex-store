import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AdminGuard() {
  const [authStatus, setAuthStatus] = useState('checking'); // 'checking' | 'authenticated' | 'unauthenticated'
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminSession() {
      if (!isSupabaseConfigured) {
        if (isMounted) setAuthStatus('unauthenticated');
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session || !session.user) {
          if (isMounted) setAuthStatus('unauthenticated');
          return;
        }

        // Active valid Supabase session verified
        if (isMounted) setAuthStatus('authenticated');
      } catch (err) {
        console.error('Admin session verification error:', err);
        if (isMounted) setAuthStatus('unauthenticated');
      }
    }

    verifyAdminSession();

    // Real-time listener for session changes (logout, token expiration)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setAuthStatus(session?.user ? 'authenticated' : 'unauthenticated');
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [location.pathname]);

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl">
          <Loader2 className="w-8 h-8 text-apex-red animate-spin" />
          <p className="text-xs uppercase tracking-widest text-gray-400 font-mono">
            Verifying Admin Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (authStatus !== 'authenticated') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
