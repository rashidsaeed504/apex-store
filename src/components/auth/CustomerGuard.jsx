import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function CustomerGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#050505] flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-3 p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl">
          <Loader2 className="w-8 h-8 text-apex-red animate-spin" />
          <p className="text-xs uppercase tracking-widest text-gray-400 font-mono">
            Loading Customer Account...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
