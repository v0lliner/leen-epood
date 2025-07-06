import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const CheckoutSuccess = () => {
  const { t } = useTranslation();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState(null); 
  const [orderReference, setOrderReference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Clear the cart when the success page loads - this ensures cart is only cleared after successful payment
    clearCart();
    
    // Get order reference from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const reference = queryParams.get('reference');
    
    if (reference) {
      setOrderReference(reference);
    }
    
    // Function to load order details
    const loadOrderDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First try to get order details from URL reference parameter
        if (reference) {
          console.log('Fetching order details for reference:', reference);
          
          // Fetch order details from the backend using the reference
          const response = await fetch(`/php/admin/orders.php?order_number=${reference}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch order details: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success && data.order) {
            console.log('Order details fetched successfully:', data.order);
            
            // Format the order data for display
            const formattedOrder = {
              orderReference: data.order.order_number,
              orderAmount: data.order.total_amount,
              customerEmail: data.order.customer_email,
              timestamp: new Date(data.order.created_at).getTime(),
              orderItems: data.order.items || [],
              payments: data.order.payments || []
            };
            
            setOrderDetails(formattedOrder);
            
            // Clear any pending order from localStorage since we got the data from the server
            localStorage.removeItem('pendingOrder');
            return;
          }
        }
        
        // Fallback to localStorage if URL parameter doesn't work
        const pendingOrder = localStorage.getItem('pendingOrder');
        
        if (pendingOrder) {
          console.log('Using order details from localStorage');
          const orderData = JSON.parse(pendingOrder);
          
          // Set basic order details from localStorage
          setOrderDetails(orderData);
          
          // Clear the pending order after retrieving it
          localStorage.removeItem('pendingOrder');
        } else {
          throw new Error('No order information found');
        }
      } catch (error) {
        console.error('Error loading order details:', error);
        setError(error.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    
    loadOrderDetails();
  }, [clearCart]); 

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  if (loading) {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Laadin tellimuse andmeid...</p>
              </div>
            </div>
          </section>
        </main>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 64px;
            gap: 16px;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid var(--color-ultramarine);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }
  
  if (error || !orderDetails) {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <FadeInSection>
                <div className="error-content">
                  <div className="error-icon">❌</div>
                  <h1>Tellimuse andmete laadimine ebaõnnestus</h1>
                  <p>{error || 'Tellimuse andmeid ei leitud'}</p>
                  
                  <div className="error-actions">
                    <Link to="/epood" className="btn btn-primary" onClick={scrollToTop}>
                      Jätka ostlemist
                    </Link>
                    <Link to="/" className="btn btn-secondary" onClick={scrollToTop}>
                      Tagasi avalehele
                    </Link>
                  </div>
                </div>
              </FadeInSection>
            </div>
          </section>
        </main>
        <style jsx>{`
          .error-content {
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
          }

          .error-icon {
            font-size: 4rem;
            margin-bottom: 24px;
            color: #dc3545;
          }

          .error-content h1 {
            color: var(--color-text);
            margin-bottom: 16px;
          }

          .error-content p {
            margin-bottom: 32px;
            color: #666;
            font-size: 1.125rem;
          }

          .error-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            margin: 48px 0;
            flex-wrap: wrap;
          }

          .btn {
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            font-family: var(--font-body);
            font-weight: 500;
            transition: opacity 0.2s ease;
            display: inline-block;
          }

          .btn-primary {
            background-color: var(--color-ultramarine);
            color: white;
          }

          .btn-secondary {
            background-color: #6c757d;
            color: white;
          }

          .btn:hover {
            opacity: 0.9;
          }

          @media (max-width: 768px) {
            .error-actions {
              flex-direction: column;
              align-items: center;
            }

            .btn {
              width: 200px;
              text-align: center;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="success-content">
                <div className="success-icon">✅</div>
                <h1>Aitäh teie ostu eest!</h1>
                <p>Teie tellimus on edukalt vormistatud ja makse on kinnitatud.</p>
                
                <div className="order-info">
                  {orderDetails && (
                    <>
                      {orderDetails.orderReference && (
                        <div className="order-detail">
                          <span className="detail-label">Tellimuse number:</span>
                          <span className="detail-value">{orderDetails.orderReference}</span>
                        </div>
                      )}
                      {orderDetails.orderAmount && (
                        <div className="order-detail">
                          <span className="detail-label">Summa:</span>
                          <span className="detail-value">{orderDetails.orderAmount}€</span>
                        </div>
                      )}
                      {orderDetails.customerEmail && (
                        <div className="order-detail">
                          <span className="detail-label">E-post:</span>
                          <span className="detail-value">{orderDetails.customerEmail}</span>
                        </div>
                      )}
                      {orderDetails.timestamp && (
                        <div className="order-detail">
                          <span className="detail-label">Tellimuse aeg:</span>
                          <span className="detail-value">{new Date(orderDetails.timestamp).toLocaleString('et-EE')}</span>
                        </div>
                      )}
                      
                      {/* Display order items if available */}
                      {orderDetails.orderItems && orderDetails.orderItems.length > 0 && (
                        <div className="order-items">
                          <h3>Tellitud tooted:</h3>
                          <div className="items-list">
                            {orderDetails.orderItems.map((item, index) => (
                              <div key={index} className="order-item">
                                <span className="item-title">{item.product_title}</span>
                                <span className="item-price">{item.price}€</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <p className="order-message">Tellimuse kinnitus on saadetud teie e-posti aadressile.</p>
                </div>

                <div className="success-actions">
                  <Link to="/epood" className="btn btn-primary" onClick={scrollToTop}>
                    Jätka ostlemist
                  </Link>
                  <Link to="/" className="btn btn-secondary" onClick={scrollToTop}>
                    Tagasi avalehele
                  </Link>
                </div>

                <div className="contact-info">
                  <h4>Küsimused?</h4>
                  <p>Kui teil on küsimusi tellimuse kohta, võtke meiega ühendust:</p>
                  <div className="contact-links">
                    <a href="mailto:leen@leen.ee" className="contact-link">
                      <span className="contact-icon">✉️</span>
                      leen@leen.ee
                    </a>
                    <a href="tel:+37253801413" className="contact-link">
                      <span className="contact-icon">📞</span>
                      +372 5380 1413
                    </a>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .success-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .success-icon {
          font-size: 4rem;
          margin-bottom: 24px;
        }

        .success-content h1 {
          color: var(--color-ultramarine);
          margin-bottom: 16px;
        }

        .success-content > p {
          margin-bottom: 32px;
          color: #666;
          font-size: 1.125rem;
        }

        .order-info {
          background: #f8f9fa;
          padding: 24px;
          border-radius: 8px;
          margin: 32px 0;
        }

        .order-detail {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-label {
          font-weight: 500;
          color: #666;
        }

        .detail-value {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
        }

        .order-message {
          margin-top: 16px;
          font-weight: 500;
          text-align: center;
          color: #2f3e9c;
          background-color: #f0f4ff;
          padding: 8px;
          border-radius: 4px;
        }

        .order-info p {
          color: #666;
          font-size: 1rem;
          margin: 0;
        }

        .order-items {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }

        .order-items h3 {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          color: var(--color-ultramarine);
          margin-bottom: 12px;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .item-title {
          font-weight: 500;
        }

        .item-price {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
        }

        .success-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin: 48px 0;
          flex-wrap: wrap;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-family: var(--font-body);
          font-weight: 500;
          transition: opacity 0.2s ease;
          display: inline-block;
        }

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn:hover {
          opacity: 0.9;
        }

        .contact-info {
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid #f0f0f0;
        }

        .contact-info h4 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-size: 1.125rem;
        }

        .contact-info p {
          color: #666;
          margin-bottom: 8px;
          line-height: 1.6;
        }
        
        .contact-links {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 16px;
        }

        .contact-link {
          color: var(--color-ultramarine);
          text-decoration: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .contact-link:hover {
          background-color: rgba(47, 62, 156, 0.1);
        }
        
        .contact-icon {
          font-size: 1.25rem;
        }

        @media (max-width: 768px) {
          .success-actions {
            flex-direction: column;
            align-items: center;
          }

          .btn {
            width: 200px;
            text-align: center;
          }
          
          .contact-links {
            flex-direction: column;
            gap: 12px;
            align-items: center;
          }
        }
      `}</style>
    </>
  );
};

export default CheckoutSuccess;