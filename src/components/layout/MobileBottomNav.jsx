import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

// ── Custom Precise SVGs Matching the APEX Store Mobile Bottom Navigation Specification ──

function HomeIcon({ active, className = 'w-5 h-5' }) {
  if (active) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <path d="M11.293 2.293a1 1 0 0 1 1.414 0l8.5 8.5A1 1 0 0 1 20.5 12.5H19v7.5a1.5 1.5 0 0 1-1.5 1.5h-4a1 1 0 0 1-1-1v-4.5h-3V20.5a1 1 0 0 1-1 1h-4A1.5 1.5 0 0 1 3 20v-7.5H1.5a1 1 0 0 1-.707-1.707l8.5-8.5h2z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function ShopIcon({ active, className = 'w-5 h-5' }) {
  if (active) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
    </svg>
  );
}

function CategoriesIcon({ active, className = 'w-5 h-5' }) {
  if (active) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        {/* Back card outline */}
        <path
          d="M5 15V6a2 2 0 0 1 2-2h8"
          stroke="#D92332"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Front card filled */}
        <rect x="8" y="8" width="12.5" height="12.5" rx="3" fill="#D92332" />
        {/* Inner detail dots on front card */}
        <rect x="11" y="11" width="2.5" height="2.5" rx="0.75" fill="#1F1F1F" />
        <rect x="15" y="11" width="2.5" height="2.5" rx="0.75" fill="#1F1F1F" />
        <rect x="11" y="15" width="6.5" height="2" rx="0.75" fill="#1F1F1F" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Back card outline */}
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
      {/* Front card outline */}
      <rect x="8" y="8" width="12.5" height="12.5" rx="3" />
      {/* Inner detail indicators */}
      <rect x="11" y="11" width="2.5" height="2.5" rx="0.75" fill="currentColor" stroke="none" />
      <rect x="15" y="11" width="2.5" height="2.5" rx="0.75" fill="currentColor" stroke="none" />
      <rect x="11" y="15" width="6.5" height="1.8" rx="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CartIcon({ active, className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '2'}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2.5 3.5h3l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h8.8a1.8 1.8 0 0 0 1.8-1.4l1.6-7.7H6.2" />
    </svg>
  );
}

export default function MobileBottomNav() {
  const location = useLocation();
  const { cartCount, isCartOpen, closeCart } = useCart();

  // 4 items matching APEX Store Mobile Navigation Specification: Home, Shop, Categories, Cart
  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: HomeIcon,
      isActive: (pathname) => pathname === '/',
      ariaLabel: 'Go to homepage',
    },
    {
      name: 'Shop',
      path: '/shop',
      icon: ShopIcon,
      isActive: (pathname) => pathname === '/shop' || pathname.startsWith('/product/'),
      ariaLabel: 'Browse all products',
    },
    {
      name: 'Categories',
      path: '/categories',
      icon: CategoriesIcon,
      isActive: (pathname) =>
        pathname === '/categories' || pathname.startsWith('/category/'),
      ariaLabel: 'Explore product categories',
    },
    {
      name: 'Cart',
      path: '/cart',
      icon: CartIcon,
      badge: cartCount,
      isActive: (pathname) => pathname === '/cart' || pathname === '/checkout',
      ariaLabel: `View cart & checkout (${cartCount} ${cartCount === 1 ? 'item' : 'items'})`,
    },
  ];

  const handleNavClick = () => {
    // Smoothly close cart drawer if open when navigating
    if (isCartOpen && closeCart) {
      closeCart();
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] inset-x-3 sm:inset-x-6 max-w-md mx-auto z-40 md:hidden pointer-events-auto select-none"
    >
      {/* Floating Pill Dock matching the design specification (#1F1F1F background, subtle red rim glow) */}
      <div className="relative w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_20px_rgba(217,35,50,0.14)] p-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const active = item.isActive(location.pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={handleNavClick}
              aria-label={item.ariaLabel}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 min-h-[48px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D92332] focus-visible:ring-offset-1 focus-visible:ring-offset-[#1F1F1F]`}
            >
              {/* Icon Container with synchronized Cart Badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  active={active}
                  className={`w-[22px] h-[22px] transition-colors duration-200 ${
                    active ? 'text-[#D92332]' : 'text-[#E5E7EB] group-hover:text-white'
                  }`}
                />

                {/* Live Synchronized Cart Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    aria-label={`${item.badge} items in cart`}
                    className="absolute -top-1.5 -right-2.5 bg-[#D92332] text-white text-[10px] font-bold font-sans min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-[#1F1F1F] shadow-[0_0_8px_rgba(217,35,50,0.7)] leading-none"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              {/* Text Label */}
              <span
                className={`text-[11px] tracking-tight mt-1 transition-colors duration-200 truncate ${
                  active
                    ? 'text-[#D92332] font-bold'
                    : 'text-[#9CA3AF] group-hover:text-[#E5E7EB] font-medium'
                }`}
              >
                {item.name}
              </span>

              {/* Active Indicator Underline / Pill */}
              {active && (
                <span className="w-4 h-[2px] bg-[#D92332] rounded-full mt-0.5 shadow-[0_0_6px_rgba(217,35,50,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
