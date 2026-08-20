import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SearchProvider } from './context/SearchContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminGuard from './components/admin/AdminGuard';
import CustomerGuard from './components/auth/CustomerGuard';

// Customer Auth Pages
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AuthCallback from './pages/auth/AuthCallback';

// Customer Account Portal Pages
import AccountLayout from './pages/account/AccountLayout';
import AccountDashboard from './pages/account/AccountDashboard';
import AccountOrders from './pages/account/AccountOrders';
import AccountReturns from './pages/account/AccountReturns';
import AccountAddresses from './pages/account/AccountAddresses';
import AccountReviews from './pages/account/AccountReviews';
import AccountProfile from './pages/account/AccountProfile';

// Storefront Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import About from './pages/About';
import Contact from './pages/Contact';
import Deals from './pages/Deals';
import BestSellersPage from './pages/BestSellersPage';
import TrendingPage from './pages/TrendingPage';
import NewArrivalsPage from './pages/NewArrivalsPage';
import CategoryPage from './pages/CategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import PrivacyPolicy from './pages/LegalPrivacy';
import TermsAndConditions from './pages/TermsAndConditions';
import RefundPolicy from './pages/RefundPolicy';
import Orders from './pages/Orders';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHeroSlider from './pages/admin/AdminHeroSlider';
import AdminBanners from './pages/admin/AdminBanners';
import AdminSpecialOffer from './pages/admin/AdminSpecialOffer';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReturns from './pages/admin/AdminReturns';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSocialGallery from './pages/admin/AdminSocialGallery';
import AdminUsers from './pages/admin/AdminUsers';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SearchProvider>
          <WishlistProvider>
            <CartProvider>
              <BrowserRouter>
                <Routes>
                  {/* Storefront Routes */}
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="shop" element={<Shop />} />
                    <Route path="product/:slug" element={<ProductDetail />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="track-order" element={<Orders />} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="deals" element={<Deals />} />
                    <Route path="best-sellers" element={<BestSellersPage />} />
                    <Route path="trending" element={<TrendingPage />} />
                    <Route path="new-arrivals" element={<NewArrivalsPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="category/:categorySlug" element={<CategoryPage />} />
                    <Route path="category/:categorySlug/:subcategorySlug" element={<CategoryPage />} />
                    <Route path="privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="terms-and-conditions" element={<TermsAndConditions />} />
                    <Route path="refund-policy" element={<RefundPolicy />} />
                    <Route path="return-policy" element={<RefundPolicy />} />

                    {/* Customer Auth Routes */}
                    <Route path="login" element={<Login />} />
                    <Route path="signup" element={<SignUp />} />
                    <Route path="register" element={<SignUp />} />
                    <Route path="create-account" element={<SignUp />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password" element={<ResetPassword />} />
                    <Route path="auth/callback" element={<AuthCallback />} />

                    {/* Protected Customer Account Portal Routes */}
                    <Route element={<CustomerGuard />}>
                      <Route path="account" element={<AccountLayout />}>
                        <Route index element={<AccountDashboard />} />
                        <Route path="orders" element={<AccountOrders />} />
                        <Route path="returns" element={<AccountReturns />} />
                        <Route path="tracking" element={<AccountOrders />} />
                        <Route path="addresses" element={<AccountAddresses />} />
                        <Route path="reviews" element={<AccountReviews />} />
                        <Route path="profile" element={<AccountProfile />} />
                      </Route>
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Admin Auth Route */}
                  <Route path="/admin/login" element={<AdminLogin />} />

                  {/* Protected Admin Routes */}
                  <Route element={<AdminGuard />}>
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="hero-slider" element={<AdminHeroSlider />} />
                      <Route path="banners" element={<AdminBanners />} />
                      <Route path="special-offer" element={<AdminSpecialOffer />} />
                      <Route path="social-gallery" element={<AdminSocialGallery />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="returns" element={<AdminReturns />} />
                      <Route path="reviews" element={<AdminReviews />} />
                      <Route path="customers" element={<AdminCustomers />} />
                      <Route path="team" element={<AdminUsers />} />
                      <Route path="users" element={<AdminUsers />} />
                    </Route>
                  </Route>
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </WishlistProvider>
        </SearchProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
