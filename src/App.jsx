import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navigation from './components/Layout/Navigation';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Admin/ProtectedRoute';
import CookieConsentBanner from './components/UI/CookieConsentBanner';
import Home from './pages/Home';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Muugitingimused from './pages/Muugitingimused';
import Privaatsuspoliitika from './pages/Privaatsuspoliitika';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/Products';
import AdminCategories from './pages/Admin/Categories';
import AdminTehtudTood from './pages/Admin/TehtudTood';
import AdminAboutPage from './pages/Admin/AboutPage';
import AdminOrders from './pages/Admin/Orders';
import AdminFAQ from './pages/Admin/FAQ';
import TehtudToodForm from './pages/Admin/TehtudToodForm';
import ProductForm from './pages/Admin/ProductForm';
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
                <Route path="/checkout/success" element={
                  <div className="app">
                    <Navigation />
                    <CheckoutSuccess />
                    <Footer />
                  </div>
                } />
                <Route path="/makse/korras" element={
                  <div className="app">
                    <Navigation />
                    <CheckoutSuccess />
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

                {/* 404 route */}
                <Route path="*" element={
                  <div className="app">
                    <Navigation />
                    <NotFound />
                    <Footer />
                  </div>
                } />
              </Routes>
            </Router>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;