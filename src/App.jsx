import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ArrowLinkEffect from './components/UI/ArrowLinkEffect';
import Navigation from './components/Layout/Navigation';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Admin/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/Products';
import AdminCategories from './pages/Admin/Categories';
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
              <ArrowLinkEffect />
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
                <Route path="/kontakt" element={
                  <div className="app">
                    <Navigation />
                    <Contact />
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