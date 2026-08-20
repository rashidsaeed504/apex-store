import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, ChevronDown, User, LogOut, Package, MapPin, Star, ShieldCheck, LayoutDashboard } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useSearch } from "../../context/SearchContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Logo from "../ui/Logo";
import MobileMenu from "./MobileMenu";
import { fetchActiveCategoriesAndSubcategories } from "../../services/api.js";

export default function Navbar({ openCart }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const accountRef = useRef(null);

  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { openSearch } = useSearch();
  const { user, profile, signOut } = useAuth();
  const { success } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on route change or click outside
  useEffect(() => {
    setIsAccountDropdownOpen(false);
    setIsCategoryDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadCategories() {
      const activeData = await fetchActiveCategoriesAndSubcategories();
      setCategoriesList(activeData);
    }
    loadCategories();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsAccountDropdownOpen(false);
    success("Logged out successfully.");
    navigate("/");
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "Categories", path: "/categories", hasDropdown: true },
    { name: "Deals", path: "/deals" },
    { name: "Orders", path: "/orders" },
    { name: "About", path: "/about" },
  ];

  const isActive = (path) => location.pathname === path;
  const customerName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Customer";
  const customerAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";

  return (
    <>
      <header
        className={`fixed top-0 w-full z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 py-3.5"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Mobile Hamburger & Brand Logo */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden text-gray-300 hover:text-white p-1 focus:outline-none"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Logo variant="navbar" />
            </div>

            {/* Center: Navigation Links (Desktop Only) */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <div
                  key={link.name}
                  className="relative group"
                  onMouseEnter={() =>
                    link.hasDropdown && setIsCategoryDropdownOpen(true)
                  }
                  onMouseLeave={() =>
                    link.hasDropdown && setIsCategoryDropdownOpen(false)
                  }
                >
                  <Link
                    to={link.path}
                    className={`relative text-sm uppercase tracking-wider font-semibold transition-colors py-2 ${
                      isActive(link.path) && !link.hasDropdown
                        ? "text-white"
                        : "text-gray-300 hover:text-white"
                    } flex items-center gap-1`}
                  >
                    {link.name}
                    {link.hasDropdown && (
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          isCategoryDropdownOpen ? "rotate-180 text-apex-red" : ""
                        }`}
                      />
                    )}
                    {isActive(link.path) && !link.hasDropdown && (
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-apex-red rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                    )}
                  </Link>

                  {/* Desktop Categories Mega Dropdown Menu */}
                  {link.hasDropdown && isCategoryDropdownOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-[760px] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-6 z-50 grid grid-cols-4 gap-6 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
                      {categoriesList.map((cat) => {
                        const catSlug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return (
                          <div key={cat.id || cat.name} className="space-y-3">
                            <Link
                              to={`/category/${catSlug}`}
                              onClick={() => setIsCategoryDropdownOpen(false)}
                              className="block text-xs font-black uppercase tracking-wider text-apex-red hover:text-white transition-colors border-b border-white/10 pb-2 leading-tight"
                            >
                              {cat.name}
                            </Link>
                            {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 && (
                              <ul className="space-y-2">
                                {cat.subcategories.map((sub) => {
                                  const subSlug = sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                  return (
                                    <li key={sub.id || sub.name}>
                                      <Link
                                        to={`/category/${catSlug}/${subSlug}`}
                                        onClick={() =>
                                          setIsCategoryDropdownOpen(false)
                                        }
                                        className="text-xs text-gray-400 hover:text-white transition-colors block py-0.5 font-medium"
                                      >
                                        {sub.name}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right: Icons (Search, Wishlist, Account, Cart) */}
            <div className="flex items-center gap-1.5 sm:gap-4">
              {/* Search */}
              <button
                onClick={openSearch}
                className="p-2 text-gray-300 hover:text-white transition-colors focus:outline-none cursor-pointer"
                aria-label="Search products"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="p-2 text-gray-300 hover:text-white transition-colors relative"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 bg-apex-red text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-mono">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Customer Account Dropdown */}
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="p-1.5 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  aria-label="Account Menu"
                >
                  {user ? (
                    customerAvatar ? (
                      <img
                        src={customerAvatar}
                        alt={customerName}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-apex-red/50 shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-apex-red to-red-800 text-white font-black text-xs flex items-center justify-center border border-white/20 shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                        {customerName[0].toUpperCase()}
                      </div>
                    )
                  ) : (
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>

                {/* Dropdown Menu */}
                {isAccountDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-2 z-50 backdrop-blur-2xl">
                    {user ? (
                      /* Logged In Customer State */
                      <div className="space-y-1">
                        <div className="p-3 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm truncate">
                              {customerName}
                            </span>
                            <span className="bg-apex-red/15 text-apex-red text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Member
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5 font-mono">
                            {user.email}
                          </p>
                        </div>

                        <Link
                          to="/account"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-apex-red" />
                          Dashboard
                        </Link>

                        <Link
                          to="/account/orders"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <Package className="w-4 h-4 text-gray-400" />
                          My Orders
                        </Link>

                        <Link
                          to="/account/addresses"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-gray-400" />
                          Saved Addresses
                        </Link>

                        <Link
                          to="/account/reviews"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <Star className="w-4 h-4 text-amber-400" />
                          My Reviews
                        </Link>

                        <Link
                          to="/account/profile"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          Profile Settings
                        </Link>

                        <div className="pt-1 border-t border-white/10">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Guest / Logged Out State */
                      <div className="p-3 space-y-2">
                        <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mb-2">
                          Customer Account
                        </p>
                        <Link
                          to="/login"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="btn-primary w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center"
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-1.5 text-gray-300 hover:text-white transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-apex-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-black shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
