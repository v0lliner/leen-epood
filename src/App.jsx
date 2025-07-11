import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense } from 'react';
import { CartProvider } from './context/CartContext'; 
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navigation from './components/Layout/Navigation';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Admin/ProtectedRoute';
import CookieConsentBanner from './components/UI/CookieConsentBanner';
import Home from './pages/Home';

// Lazy load pages
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
              <Suspense fallback={
                <div className="loading-full-page">
                  <div className="loading-spinner"></div>
                  <p>Laadin...</p>
                </div>
              }>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={
                    <div className="app">
                      <Navigation />
                      <Home />
                      <Footer />
                    </div>
                  } />
                  <Route path="/minust" element={
                    <div className="app">
                      <Navigation />
                      <About />
                      <Footer />
                    </div>
                  } />
                  <Route path="/minu-lemmikud" element={
                    <div className="app">
                      <Navigation />
                      <Portfolio />
                      <Footer />
                    </div>
                  } />
                  {/* Keep old routes for backward compatibility */}
                  <Route path="/parimad-palad" element={
                    <div className="app">
                      <Navigation />
                      <Portfolio />
                      <Footer />
                    </div>
                  } />
                  <Route path="/tehtud-tood" element={
                    <div className="app">
                      <Navigation />
                      <Portfolio />
                      <Footer />
                    </div>
                  } />
                  <Route path="/portfoolio" element={
                    <div className="app">
                      <Navigation />
                      <Portfolio />
                      <Footer />
                    </div>
                  } />
                  <Route path="/epood" element={
                    <div className="app">
                      <Navigation />
                      <Shop />
                      <Footer />
                    </div>
                  } />
                  <Route path="/epood/toode/:slug" element={
                    <div className="app">
                      <Navigation />
                      <ProductDetail />
                      <Footer />
                    </div>
                  } />
                  <Route path="/checkout" element={
                    <div className="app">
                      <Navigation />
                      <Checkout />
                      <Footer />
                    </div>
                  } />
                  <Route path="/makse/katkestatud" element={
                    <div className="app">
                      <Navigation />
                      <Checkout />
                      <Footer />
                    </div>
                  } />
                  <Route path="/kontakt" element={
                    <div className="app">
                      <Navigation />
                      <Contact />
                      <Footer />
                    </div>
                  } />
                  <Route path="/kkk" element={
                    <div className="app">
                      <Navigation />
                      <FAQ />
                      <Footer />
                    </div>
                  } />
                  <Route path="/muugitingimused" element={
                    <div className="app">
                      <Navigation />
                      <Muugitingimused />
                      <Footer />
                    </div>
                  } />
                  <Route path="/privaatsuspoliitika" element={
                    <div className="app">
                      <Navigation />
                      <Privaatsuspoliitika />
                      <Footer />
                    </div>
                  } />

                {/* Admin routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/products" element={
                  <ProtectedRoute>
                    <AdminProducts />
                  </ProtectedRoute>
                } />
                <Route path="/admin/categories" element={
                  <ProtectedRoute>
                    <AdminCategories />
                  </ProtectedRoute>
                } />
                <Route path="/admin/about" element={
                  <ProtectedRoute>
                    <AdminAboutPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/faq" element={
                  <ProtectedRoute>
                    <AdminFAQ />
                  </ProtectedRoute>
                } />
                <Route path="/admin/homepage" element={
                  <ProtectedRoute>
                    <HomepageContent />
                  </ProtectedRoute>
                } />
                <Route path="/admin/orders" element={
                  <ProtectedRoute>
                    <AdminOrders />
                  </ProtectedRoute>
                } />
                <Route path="/admin/minu-lemmikud" element={
                  <ProtectedRoute>
                    <AdminTehtudTood />
                  </ProtectedRoute>
                } />
                {/* Keep old admin routes for backward compatibility */}
                <Route path="/admin/parimad-palad" element={
                  <ProtectedRoute>
                    <AdminTehtudTood />
                  </ProtectedRoute>
                } />
                <Route path="/admin/tehtud-tood" element={
                  <ProtectedRoute>
                    <AdminTehtudTood />
                  </ProtectedRoute>
                } />
                <Route path="/admin/minu-lemmikud/new" element={
                  <ProtectedRoute>
                    <TehtudToodForm />
                  </ProtectedRoute>
                } />
                <Route path="/admin/minu-lemmikud/:id/edit" element={
                  <ProtectedRoute>
                    <TehtudToodForm />
                  </ProtectedRoute>
                } />
                {/* Keep old admin routes for backward compatibility */}
                <Route path="/admin/parimad-palad/new" element={
                  <ProtectedRoute>
                    <TehtudToodForm />
                  </ProtectedRoute>
                } />
                <Route path="/admin/parimad-palad/:id/edit" element={
                  <ProtectedRoute>
                    <TehtudToodForm />
                  </ProtectedRoute>
                } />
                <Route path="/admin/tehtud-tood/new" element={
                  <ProtectedRoute>
                    <TehtudToodForm />
                  </ProtectedRoute>
                } />
                <Route path="/admin/tehtud-tood/:id/edit" element={
                  <ProtectedRoute>
                    <TehtudToodForm />
                  </ProtectedRoute>
                } />
                <Route path="/admin/products/new" element={
                  <ProtectedRoute>
                    <ProductForm />
                  </ProtectedRoute>
                } />
                <Route path="/admin/products/:id/edit" element={
                  <ProtectedRoute>
                    <ProductForm />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings/payment" element={
                  <ProtectedRoute>
                    <PaymentSettings />
                  </ProtectedRoute>
                } />

                {/* 404 route */}
                <Route path="*" element={
                  <div className="app">
                    <Navigation />
                    <NotFound />
                    <Footer />
                  </div>
                } />
                <Route path="/makse/:status" element={
                  <div className="app">
                    <Navigation />
                    <Checkout />
                    <Footer />
                  </div>
                } />
                </Routes>
              </Suspense>
                    <Navigation />
                    <Checkout />
                    <Footer />
                  </div>
                } />
                </Routes>
              </Suspense>
            </Router>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;