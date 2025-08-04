import Navigation from './Navigation';
import Footer from './Footer';

const MainLayout = ({ children }) => {
  return (
    <div className="app">
      <Navigation />
      {children}
      <Footer />
    </div>
  );
};

export default MainLayout;
