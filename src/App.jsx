import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import Navigation from './components/Layout/Navigation';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import './styles/globals.css';
import './i18n';

function App() {
  return (
    <HelmetProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/minust" element={<About />} />
              <Route path="/portfoolio" element={<Portfolio />} />
              <Route path="/epood" element={<Shop />} />
              <Route path="/epood/toode/:slug" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/kontakt" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </HelmetProvider>
  );
}

export default App;