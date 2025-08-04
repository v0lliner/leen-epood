import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from './utils/stripe';
import { CartProvider } from './context/CartContext'; 
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './components/Layout/MainLayout';
import AdminLayout from './components/Layout/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsentBanner from './components/UI/CookieConsentBanner';

// Lazy load all pages for consistent code splitting
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Muugitingimused = lazy(() => import('./pages/Muugitingimused'));
const Privaatsuspoliitika = lazy(() => import('./pages/Privaatsuspoliitika'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Signup = lazy(() => import('./pages/Auth/Signup'));
const CheckoutSuccess = lazy(() => import('./pages/Checkout/Success'));
const CheckoutCancel = lazy(() => import('./pages/Checkout/Cancel'));

// Lazy load admin pages
const AdminLogin = lazy(() => import('./pages/Admin/Login'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/Admin/Products'));
const AdminCategories = lazy(() => import('./pages/Admin/Categories'));
const AdminTehtudTood = lazy(() => import('./pages/Admin/TehtudTood'));
const AdminAboutPage = lazy(() => import('./pages/Admin/AboutPage'));
const AdminOrders = lazy(() => import('./pages/Admin/Orders'));
const AdminFAQ = lazy(() => import('./pages/Admin/FAQ'));
const HomepageContent = lazy(() => import('./pages/Admin/HomepageContent'));
const TehtudToodForm = lazy(() => import('./pages/Admin/TehtudToodForm'));
const ProductForm = lazy(() => import('./pages/Admin/ProductForm'));
const PaymentSettings = lazy(() => import('./pages/Admin/PaymentSettings'));
const StripeSync = lazy(() => import('./pages/Admin/StripeSync'));
import './styles/globals.css';
import './i18n';

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <CookieConsentBanner />
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="loading-full-page">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                  </div>
                }>
                  <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<MainLayout><Home /></MainLayout>} />
                  <Route path="/minust" element={<MainLayout><About /></MainLayout>} />
                  <Route path="/minu-lemmikud" element={<MainLayout><Portfolio /></MainLayout>} />
                  
                  {/* Keep old routes for backward compatibility */}
                  <Route path="/parimad-palad" element={<MainLayout><Portfolio /></MainLayout>} />
                  <Route path="/tehtud-tood" element={<MainLayout><Portfolio /></MainLayout>} />
                  <Route path="/portfoolio" element={<MainLayout><Portfolio /></MainLayout>} />
                  
                  <Route path="/epood" element={<MainLayout><Shop /></MainLayout>} />
                  <Route path="/epood/toode/:slug" element={<MainLayout><ProductDetail /></MainLayout>} />
                  
                  <Route path="/checkout" element={
                    <MainLayout>
                      <Elements stripe={stripePromise}>
                        <Checkout />
                      </Elements>
                    </MainLayout>
                  } />
                  <Route path="/checkout/success" element={<MainLayout><CheckoutSuccess /></MainLayout>} />
                  <Route path="/checkout/cancel" element={<MainLayout><CheckoutCancel /></MainLayout>} />
                  <Route path="/makse/katkestatud" element={
                    <MainLayout>
                      <Elements stripe={stripePromise}>
                        <Checkout />
                      </Elements>
                    </MainLayout>
                  } />
                  <Route path="/makse/:status" element={
                    <MainLayout>
                      <Elements stripe={stripePromise}>
                        <Checkout />
                      </Elements>
                    </MainLayout>
                  } />
                  
                  <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
                  <Route path="/signup" element={<MainLayout><Signup /></MainLayout>} />
                  <Route path="/kontakt" element={<MainLayout><Contact /></MainLayout>} />
                  <Route path="/kkk" element={<MainLayout><FAQ /></MainLayout>} />
                  <Route path="/muugitingimused" element={<MainLayout><Muugitingimused /></MainLayout>} />
                  <Route path="/privaatsuspoliitika" element={<MainLayout><Privaatsuspoliitika /></MainLayout>} />

                  {/* Admin routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
                  <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
                  <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
                  <Route path="/admin/categories" element={<AdminLayout><AdminCategories /></AdminLayout>} />
                  <Route path="/admin/about" element={<AdminLayout><AdminAboutPage /></AdminLayout>} />
                  <Route path="/admin/faq" element={<AdminLayout><AdminFAQ /></AdminLayout>} />
                  <Route path="/admin/homepage" element={<AdminLayout><HomepageContent /></AdminLayout>} />
                  <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
                  <Route path="/admin/minu-lemmikud" element={<AdminLayout><AdminTehtudTood /></AdminLayout>} />
                  
                  {/* Keep old admin routes for backward compatibility */}
                  <Route path="/admin/parimad-palad" element={<AdminLayout><AdminTehtudTood /></AdminLayout>} />
                  <Route path="/admin/tehtud-tood" element={<AdminLayout><AdminTehtudTood /></AdminLayout>} />
                  <Route path="/admin/minu-lemmikud/new" element={<AdminLayout><TehtudToodForm /></AdminLayout>} />
                  <Route path="/admin/minu-lemmikud/:id/edit" element={<AdminLayout><TehtudToodForm /></AdminLayout>} />
                  <Route path="/admin/parimad-palad/new" element={<AdminLayout><TehtudToodForm /></AdminLayout>} />
                  <Route path="/admin/parimad-palad/:id/edit" element={<AdminLayout><TehtudToodForm /></AdminLayout>} />
                  <Route path="/admin/tehtud-tood/new" element={<AdminLayout><TehtudToodForm /></AdminLayout>} />
                  <Route path="/admin/tehtud-tood/:id/edit" element={<AdminLayout><TehtudToodForm /></AdminLayout>} />
                  <Route path="/admin/products/new" element={<AdminLayout><ProductForm /></AdminLayout>} />
                  <Route path="/admin/products/:id/edit" element={<AdminLayout><ProductForm /></AdminLayout>} />
                  <Route path="/admin/settings/payment" element={<AdminLayout><PaymentSettings /></AdminLayout>} />
                  <Route path="/admin/stripe-sync" element={<AdminLayout><StripeSync /></AdminLayout>} />

                  {/* 404 route */}
                  <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
                </Routes>
                </Suspense>
              </ErrorBoundary>
            </Router>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
