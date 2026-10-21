import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Store, LayoutGrid, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const { cartCount, isCartOpen, closeCart } = useCart();

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: Home,
      isActive: (pathname) => pathname === '/',
      ariaLabel: 'Go to Homepage',
    },
    {
      name: 'Shop',
      path: '/shop',
      icon: Store,
      isActive: (pathname) =>
        pathname === '/shop' ||
        pathname.startsWith('/product/') ||
        pathname === '/deals' ||
        pathname === '/best-sellers' ||
        pathname === '/trending' ||
        pathname === '/new-arrivals',
      ariaLabel: 'Browse Shop and Products',
    },
    {
      name: 'Categories',
      path: '/categories',
      icon: LayoutGrid,
      isActive: (pathname) =>
        pathname === '/categories' || pathname.startsWith('/category/'),
      ariaLabel: 'View Product Categories',
    },
    {
      name: 'Cart',
      path: '/cart',
      icon: ShoppingCart,
      badge: cartCount,
      isActive: (pathname) => pathname === '/cart',
      ariaLabel: `View Shopping Cart (${cartCount} ${cartCount === 1 ? 'item' : 'items'})`,
    },
  ];

  const handleNavClick = () => {
    // If slide-over cart drawer is open, smoothly close it upon mobile navigation
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
      {/* Pill-shaped Navigation Bar matching APEX Store color palette */}
      <div className="relative w-full bg-[#111111]/95 backdrop-blur-xl border border-[#303030] rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.85)] p-1.5 flex items-center justify-between">
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
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-colors duration-150 min-h-[44px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D92332] focus-visible:ring-offset-1 focus-visible:ring-offset-[#111111] ${
                active ? 'text-[#D92332]' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
              }`}
            >
              {/* Subtle restrained active highlight */}
              {active && (
                <div className="absolute inset-0 bg-[#D92332]/10 border border-[#D92332]/20 rounded-xl pointer-events-none" />
              )}

              {/* Icon Container with synchronized Cart Badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-colors duration-150 ${
                    active ? 'text-[#D92332]' : 'text-[#E5E7EB] group-hover:text-white'
                  }`}
                  strokeWidth={active ? 2.2 : 1.9}
                />

                {/* Live Synchronized Cart Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    aria-label={`${item.badge} items in cart`}
                    className="absolute -top-1.5 -right-2.5 bg-[#D92332] text-white text-[9px] font-black font-mono min-w-[17px] h-4 px-1 rounded-full flex items-center justify-center border border-[#111111] shadow-[0_0_6px_rgba(217,35,50,0.6)]"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              {/* Small label beneath icon */}
              <span
                className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-1 transition-colors duration-150 truncate ${
                  active ? 'text-[#D92332] font-bold' : 'text-[#9CA3AF] group-hover:text-[#E5E7EB]'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
