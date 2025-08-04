import Navigation from './Navigation';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="app">
      <Navigation />
      {children}
      <Footer />
    </div>
  );
};

export default Layout;
