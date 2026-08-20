import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { checkIsAdmin } from '../../services/api';
import AccessDenied from './AccessDenied';
import { Loader2, Shield } from 'lucide-react';

export default function AdminGuard() {
  const [authStatus, setAuthStatus] = useState('checking'); // 'checking' | 'authorized' | 'unauthorized' | 'unauthenticated'
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminSession() {
      if (!isSupabaseConfigured) {
        // In local mock mode, check current active user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (isMounted) setAuthStatus('unauthenticated');
          return;
        }
        const adminCheck = await checkIsAdmin(session.user.id, session.user.email);
        if (isMounted) {
          setCurrentUser(session.user);
          setAuthStatus(adminCheck.isAdmin ? 'authorized' : 'unauthorized');
        }
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session || !session.user) {
          if (isMounted) {
            setCurrentUser(null);
            setAuthStatus('unauthenticated');
          }
          return;
        }

        if (isMounted) setCurrentUser(session.user);

        // Explicit Admin Authorization Check against database allowlist
        const adminCheck = await checkIsAdmin(session.user.id, session.user.email);
        
        if (isMounted) {
          if (adminCheck.isAdmin) {
            setAuthStatus('authorized');
          } else {
            setAuthStatus('unauthorized');
          }
        }
      } catch (err) {
        console.error('Admin authorization verification error:', err);
        if (isMounted) setAuthStatus('unauthenticated');
      }
    }

    verifyAdminSession();

    // Real-time listener for session changes (logout, token expiration, sign in)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (!session?.user) {
        setCurrentUser(null);
        setAuthStatus('unauthenticated');
      } else {
        setCurrentUser(session.user);
        const adminCheck = await checkIsAdmin(session.user.id, session.user.email);
        if (isMounted) {
          setAuthStatus(adminCheck.isAdmin ? 'authorized' : 'unauthorized');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [location.pathname]);

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl max-w-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-apex-red/10 border border-apex-red/30 flex items-center justify-center text-apex-red shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <Loader2 className="w-6 h-6 text-apex-red animate-spin" />
          <div>
            <p className="text-xs uppercase tracking-widest text-white font-bold font-mono">
              Verifying Authorization
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Checking database admin permissions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated Visitor -> Redirect to Normal Customer Login (/login) preserving intended destination
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Authenticated Customer but NOT in Admin Allowlist -> Show Access Restricted Screen
  if (authStatus === 'unauthorized') {
    return <AccessDenied user={currentUser} />;
  }

  // 3. Authenticated & Explicitly Authorized Admin -> Render Requested Admin Portal Page
  return <Outlet />;
}
