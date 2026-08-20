import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Tags, 
  Flame,
  Star,
  Image as ImageIcon,
  Tv,
  LogOut, 
  ExternalLink, 
  Menu, 
  X,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import { InstagramIcon } from '../components/ui/SocialIcons';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('Apex Administrator');
  const { info } = useToast();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Hero Slider', path: '/admin/hero-slider', icon: Tv },
    { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { name: 'Special Offer', path: '/admin/special-offer', icon: Flame },
    { name: 'Social Gallery', path: '/admin/social-gallery', icon: InstagramIcon },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Returns', path: '/admin/returns', icon: RotateCcw },
    { name: 'Reviews', path: '/admin/reviews', icon: Star },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Admin Team', path: '/admin/team', icon: ShieldCheck },
  ];

  useEffect(() => {
    async function loadAdminProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setAdminEmail(user.email);
        }
      } catch (err) {
        console.warn('Failed to load admin user details:', err);
      }
    }
    loadAdminProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      if (info) info('Admin session ended. You have been signed out.');
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    navigate('/login', { replace: true, state: { from: '/admin' } });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static top-0 left-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-white/5 z-50 flex flex-col transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" to="/admin" />
            <span className="text-[10px] bg-apex-red/20 text-apex-red px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              ADMIN
            </span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="px-6 py-3 bg-[#111] border-b border-white/5 flex items-center justify-between text-xs">
          <span className="text-gray-400">Database Engine:</span>
          {isSupabaseConfigured ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Supabase Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium" title="Operating with local persistence engine">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Local Engine
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-apex-red text-white font-semibold shadow-[0_0_15px_rgba(220,38,38,0.3)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              View Storefront
            </span>
            <span className="text-[10px] text-gray-500">Live</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Admin
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white p-2"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-white uppercase tracking-wider hidden sm:block">
              APEX STORE Control Panel
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-apex-red flex items-center justify-center font-bold text-white text-xs shadow-[0_0_10px_rgba(220,38,38,0.4)] uppercase">
                {adminEmail ? adminEmail.substring(0, 2) : 'AP'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-none">Apex Administrator</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">{adminEmail}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Admin Page Outlet */}
        <main className="p-4 md:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
