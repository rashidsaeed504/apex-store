import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Star,
  User,
  RotateCcw,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import AccountErrorBoundary from "../../components/account/AccountErrorBoundary";

export default function AccountLayout() {
  const { user, profile, signOut } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    success("Logged out successfully.");
    navigate("/");
  };

  const navItems = [
    { name: "Overview", path: "/account", icon: LayoutDashboard, end: true },
    { name: "Orders", path: "/account/orders", icon: Package },
    { name: "Returns", path: "/account/returns", icon: RotateCcw },
    { name: "Addresses", path: "/account/addresses", icon: MapPin },
    { name: "Reviews", path: "/account/reviews", icon: Star },
    { name: "Profile", path: "/account/profile", icon: User },
  ];

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Customer";
  const displayEmail = user?.email || profile?.email || "";
  const displayAvatar =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Aug 2026";

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 mt-12 sm:pt-24 md:pt-28 pb-24 md:pb-20 select-none">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Premium Mobile & Desktop Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-5 sm:mb-8 relative overflow-hidden shadow-2xl"
        >
          {/* Subtle Ambient Red Glow */}
          <div className="absolute top-0 right-0 w-64 sm:w-80 h-64 sm:h-80 bg-apex-red/10 blur-[90px] rounded-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-3.5 sm:gap-6 min-w-0">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border border-white/15 shadow-md shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-apex-red/30 to-amber-500/20 border border-white/15 flex items-center justify-center font-black text-lg sm:text-2xl text-white uppercase shadow-md shrink-0">
                  {displayName[0]}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h1 className="text-base sm:text-xl lg:text-2xl font-bold uppercase tracking-tight text-white truncate max-w-[170px] sm:max-w-xs md:max-w-md">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-apex-red/15 text-apex-red text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-apex-red/30 shrink-0">
                    <ShieldCheck size={10} /> Member
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {displayEmail}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Member since {memberSince}
                </p>
              </div>
            </div>

            {/* Right: Sign Out Action Button */}
            <div className="pt-2 sm:pt-0 border-t border-white/5 sm:border-0 flex items-center justify-between sm:justify-end gap-2">
              <span className="sm:hidden text-[11px] text-gray-500 font-medium">
                Session Active
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-white/10 hover:border-red-500/30 active:scale-95 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </motion.div>

        {/* 2. Mobile 2-Column Tabs Grid (No Horizontal Scroll Slider) */}
        <div className="grid grid-cols-2 gap-2 md:hidden mb-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-center text-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider w-full min-h-[44px] odd:last:col-span-2 transition-all cursor-pointer ${
                    isActive
                      ? "bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                      : "bg-[#0D0D0D] text-gray-400 hover:text-white border border-white/5 hover:bg-white/5"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="leading-tight">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* 3. Desktop 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden md:block md:col-span-4 lg:col-span-3 bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 sticky top-24 space-y-1.5 shadow-xl">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Account Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? "bg-apex-red text-white shadow-[0_0_20px_rgba(220,38,38,0.35)]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
            <AccountErrorBoundary>
              <Outlet />
            </AccountErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
