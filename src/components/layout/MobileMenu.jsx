import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Home, 
  ShoppingBag, 
  Grid, 
  Tag, 
  Info, 
  Heart, 
  User, 
  Plus,
  Package, 
  MapPin, 
  Star, 
  LogOut, 
  HelpCircle,
  Building2,
  ChevronRight
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, TiktokIcon, YoutubeIcon } from '../ui/SocialIcons';
import Logo from '../ui/Logo';
import { fetchActiveCategoriesAndSubcategories } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Smooth accordion animation variants (250-350ms, ease-out, no bounce)
const accordionContentVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    y: -8,
    transition: {
      height: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.2, ease: 'easeIn' },
      y: { duration: 0.2, ease: 'easeIn' },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    y: 0,
    transition: {
      height: { duration: 0.32, ease: [0.25, 1, 0.5, 1] },
      opacity: { duration: 0.28, ease: 'easeOut', delay: 0.05 },
      y: { duration: 0.28, ease: 'easeOut', delay: 0.05 },
    },
  },
};

export default function MobileMenu({ isOpen, onClose }) {
  const [openSection, setOpenSection] = useState('shop'); // 'shop' | 'help' | 'company' | null
  const [openCategory, setOpenCategory] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);

  const { user, profile, signOut } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    async function loadCategories() {
      const activeData = await fetchActiveCategoriesAndSubcategories();
      setCategoriesList(activeData);
    }
    loadCategories();
  }, []);

  const toggleSection = (sectionName) => {
    setOpenSection(openSection === sectionName ? null : sectionName);
  };

  const toggleCategory = (catName) => {
    setOpenCategory(openCategory === catName ? null : catName);
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
    success('Logged out successfully.');
    navigate('/');
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Customer';
  const displayAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />

          {/* Drawer Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#050505] border-l border-white/10 z-50 flex flex-col justify-between overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                APEX MENU
              </span>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="p-6 flex-1 space-y-6">
              {/* Account Quick Card */}
              {user ? (
                <div className="p-4 bg-[#0a0a0a] border border-white/10 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={displayName}
                        className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-apex-red to-red-800 text-white font-black flex items-center justify-center text-sm uppercase shrink-0">
                        {displayName[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-sm truncate">{displayName}</span>
                        <span className="bg-apex-red/15 text-apex-red text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Member
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate font-mono">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                    <Link
                      to="/account"
                      onClick={onClose}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-center font-bold text-white transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/account/orders"
                      onClick={onClose}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-center font-bold text-white transition-colors"
                    >
                      My Orders
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#0a0a0a] border border-white/10 rounded-2xl space-y-2.5">
                  <p className="text-xs text-gray-400">Sign in for member perks and tracking:</p>
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      onClick={onClose}
                      className="btn-primary flex-1 py-2 text-center text-xs font-bold uppercase rounded-lg"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={onClose}
                      className="flex-1 py-2 text-center text-xs font-bold uppercase rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}

              <nav className="space-y-4">
                {/* 1. Home Link */}
                <Link
                  to="/"
                  onClick={onClose}
                  className="flex items-center gap-4 text-sm font-bold tracking-wider text-white hover:text-apex-red transition-colors"
                >
                  <Home className="w-4 h-4 text-gray-400" />
                  <span>HOME</span>
                </Link>

                {/* 2. SHOP ACCORDION */}
                <div className="border-b border-white/5 pb-3">
                  <button
                    onClick={() => toggleSection('shop')}
                    className="w-full flex items-center justify-between text-sm font-bold tracking-wider text-white hover:text-apex-red transition-colors cursor-pointer py-1.5"
                  >
                    <div className="flex items-center gap-4">
                      <ShoppingBag className="w-4 h-4 text-apex-red" />
                      <span>SHOP</span>
                    </div>
                    {/* Animated Plus/Minus icon: rotates 45 deg into close symbol */}
                    <motion.span
                      animate={{ rotate: openSection === 'shop' ? 45 : 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className={`inline-flex items-center justify-center ${
                        openSection === 'shop' ? 'text-apex-red' : 'text-gray-400'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {openSection === 'shop' && (
                      <motion.div
                        key="shop-content"
                        variants={accordionContentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="pl-8 pt-3 space-y-3 overflow-hidden"
                      >
                        {/* All Products Link */}
                        <Link
                          to="/shop"
                          onClick={onClose}
                          className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-apex-red transition-colors py-1"
                        >
                          <span>All Products</span>
                          <span className="text-[10px] text-gray-500 font-mono">BROWSE →</span>
                        </Link>

                        {/* Category Items with nested Subcategories */}
                        {categoriesList.map((cat) => {
                          const catSlug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                          const isCatOpen = openCategory === cat.name;
                          const hasSubs = Array.isArray(cat.subcategories) && cat.subcategories.length > 0;

                          return (
                            <div key={cat.id || cat.name} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Link
                                  to={`/category/${catSlug}`}
                                  onClick={onClose}
                                  className="text-xs font-bold tracking-wider uppercase text-white hover:text-apex-red transition-colors py-1"
                                >
                                  {cat.name}
                                </Link>
                                {hasSubs && (
                                  <button
                                    onClick={() => toggleCategory(cat.name)}
                                    className="p-1 text-gray-400 hover:text-apex-red transition-colors cursor-pointer"
                                  >
                                    <motion.span
                                      animate={{ rotate: isCatOpen ? 45 : 0 }}
                                      transition={{ duration: 0.2 }}
                                      className={`inline-flex items-center justify-center ${isCatOpen ? 'text-apex-red' : 'text-gray-400'}`}
                                    >
                                      <Plus size={13} />
                                    </motion.span>
                                  </button>
                                )}
                              </div>

                              {/* Nested Subcategories with smooth expand */}
                              <AnimatePresence initial={false}>
                                {isCatOpen && hasSubs && (
                                  <motion.div
                                    variants={accordionContentVariants}
                                    initial="collapsed"
                                    animate="expanded"
                                    exit="collapsed"
                                    className="pl-3 space-y-2 border-l border-apex-red/30 my-1 overflow-hidden"
                                  >
                                    {cat.subcategories.map((sub) => {
                                      const subSlug = sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                      return (
                                        <Link
                                          key={sub.id || sub.name}
                                          to={`/category/${catSlug}/${subSlug}`}
                                          onClick={onClose}
                                          className="block text-xs text-gray-400 hover:text-white transition-colors font-medium py-1"
                                        >
                                          {sub.name}
                                        </Link>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}

                        {/* View All Categories Link */}
                        <Link
                          to="/categories"
                          onClick={onClose}
                          className="block text-xs font-semibold text-apex-red hover:underline pt-1"
                        >
                          View All Categories →
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. HELP & SUPPORT ACCORDION */}
                <div className="border-b border-white/5 pb-3">
                  <button
                    onClick={() => toggleSection('help')}
                    className="w-full flex items-center justify-between text-sm font-bold tracking-wider text-white hover:text-apex-red transition-colors cursor-pointer py-1.5"
                  >
                    <div className="flex items-center gap-4">
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                      <span>HELP & SUPPORT</span>
                    </div>
                    <motion.span
                      animate={{ rotate: openSection === 'help' ? 45 : 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className={`inline-flex items-center justify-center ${
                        openSection === 'help' ? 'text-apex-red' : 'text-gray-400'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {openSection === 'help' && (
                      <motion.div
                        key="help-content"
                        variants={accordionContentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="pl-8 pt-3 space-y-2.5 overflow-hidden"
                      >
                        <Link
                          to="/orders"
                          onClick={onClose}
                          className="block text-xs text-gray-300 hover:text-apex-red transition-colors py-1"
                        >
                          Track Your Order
                        </Link>
                        <Link
                          to="/contact"
                          onClick={onClose}
                          className="block text-xs text-gray-300 hover:text-apex-red transition-colors py-1"
                        >
                          Contact Us & Support
                        </Link>
                        <Link
                          to="/refund-policy"
                          onClick={onClose}
                          className="block text-xs text-gray-300 hover:text-apex-red transition-colors py-1"
                        >
                          Refund & Return Policy
                        </Link>
                        <Link
                          to="/terms-and-conditions"
                          onClick={onClose}
                          className="block text-xs text-gray-300 hover:text-apex-red transition-colors py-1"
                        >
                          Terms & Conditions
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 4. COMPANY ACCORDION */}
                <div className="border-b border-white/5 pb-3">
                  <button
                    onClick={() => toggleSection('company')}
                    className="w-full flex items-center justify-between text-sm font-bold tracking-wider text-white hover:text-apex-red transition-colors cursor-pointer py-1.5"
                  >
                    <div className="flex items-center gap-4">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>COMPANY</span>
                    </div>
                    <motion.span
                      animate={{ rotate: openSection === 'company' ? 45 : 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className={`inline-flex items-center justify-center ${
                        openSection === 'company' ? 'text-apex-red' : 'text-gray-400'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {openSection === 'company' && (
                      <motion.div
                        key="company-content"
                        variants={accordionContentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="pl-8 pt-3 space-y-2.5 overflow-hidden"
                      >
                        <Link
                          to="/about"
                          onClick={onClose}
                          className="block text-xs text-gray-300 hover:text-apex-red transition-colors py-1"
                        >
                          About APEX Store
                        </Link>
                        <Link
                          to="/privacy-policy"
                          onClick={onClose}
                          className="block text-xs text-gray-300 hover:text-apex-red transition-colors py-1"
                        >
                          Privacy Policy
                        </Link>
                        <Link
                          to="/refund-policy"
                          onClick={onClose}
                          className="block text-xs text-gray-300 hover:text-apex-red transition-colors py-1"
                        >
                          Refund Policy
                        </Link>
                        <Link
                          to="/deals"
                          onClick={onClose}
                          className="block text-xs text-gray-300 hover:text-apex-red transition-colors py-1"
                        >
                          Exclusive Deals
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Direct Links
                <Link
                  to="/deals"
                  onClick={onClose}
                  className="flex items-center gap-4 text-sm font-bold tracking-wider text-white hover:text-apex-red transition-colors pt-1"
                >
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span>DEALS & OFFERS</span>
                </Link> */}

                <Link
                  to="/wishlist"
                  onClick={onClose}
                  className="flex items-center gap-4 text-sm font-bold tracking-wider text-white hover:text-apex-red transition-colors"
                >
                  <Heart className="w-4 h-4 text-gray-400" />
                  <span>WISHLIST</span>
                </Link>

                {/* Logged in Customer Navigation Links */}
                {user && (
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <Link
                      to="/account/addresses"
                      onClick={onClose}
                      className="flex items-center gap-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Saved Addresses</span>
                    </Link>

                    <Link
                      to="/account/reviews"
                      onClick={onClose}
                      className="flex items-center gap-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      <span>My Reviews</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-4 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors w-full cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </nav>
            </div>

            {/* Bottom Brand & Social Footer */}
            <div className="p-6 border-t border-white/10 space-y-4 bg-[#0a0a0a]">
              <Logo variant="drawer" />
              <div className="flex items-center space-x-5 pt-2">
                <a 
                  href="https://www.instagram.com/apexstor.pk?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-apex-red transition-colors"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-apex-red transition-colors" aria-label="Facebook">
                  <FacebookIcon className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.tiktok.com/@apexstorepk?_r=1&_t=ZS-98rNnZGljxY" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-apex-red transition-colors"
                  aria-label="TikTok"
                >
                  <TiktokIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-apex-red transition-colors" aria-label="YouTube">
                  <YoutubeIcon className="w-5 h-5" />
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
