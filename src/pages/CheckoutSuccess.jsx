import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { Link } from 'react-router-dom';

const CheckoutSuccess = () => {
  const { t } = useTranslation();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState(null); 
  const [orderReference, setOrderReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear the cart when the success page loads - this ensures cart is only cleared after successful payment
    clearCart();

    // Extract order reference from URL query parameters or path
    let reference = '';
    const queryParams = new URLSearchParams(location.search);
    reference = queryParams.get('reference') || '';

    // If no reference in query params, try to extract from path segments
    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only try to get order details from URL reference parameter
        if (reference) {
          console.log('Fetching order details from server for reference:', reference);
          
          // Fetch order details from the backend using the reference
          const response = await fetch(`/php/admin/orders.php?order_number=${reference}`);
          
          if (!response.ok) {
            console.warn(`Failed to fetch order details from server: ${response.status}`);
            throw new Error('Tellimuse andmete laadimine ebaõnnestus. Palun võtke ühendust klienditoega.');
          }
          
          const data = await response.json();
          
          if (data.success && data.order) {
            console.log('Order details fetched successfully from server:', data.order);
            
            // Format the order data for display
            const formattedOrder = {
              orderReference: data.order.order_number,
              orderAmount: data.order.total_amount,
              customerEmail: data.order.customer_email,
              customerName: data.order.customer_name,
              customerPhone: data.order.customer_phone,
              omnivaParcelMachineId: data.order.omniva_parcel_machine_id,
              omnivaParcelMachineName: data.order.omniva_parcel_machine_name,
              omnivaBarcode: data.order.omniva_barcode,
              trackingUrl: data.order.tracking_url,
              timestamp: new Date(data.order.created_at).getTime(),
              orderItems: data.order.items || [],
              payments: data.order.payments || [],
              status: data.order.status
            };
            
            setOrderDetails(formattedOrder);
          } else {
            throw new Error('Tellijat ei leitud – palun võta ühendust klienditoega.');
          }
        } else {
          throw new Error('Tellimuse viidet ei leitud. Palun võtke ühendust klienditoega.');
        }
      } catch (error) {
        console.error('Error loading order details:', error);
        setError(error.message || 'Tellimuse andmete laadimine ebaõnnestus');
        
        // If no order data is found, redirect to shop after a delay
        setTimeout(() => {
          navigate('/epood');
        }, 5000);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrderDetails();
  }, [clearCart, location, navigate]); 

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
                {orderReference && (
                  <div className="order-reference">
                    <span>Tellimuse number: <strong>{orderReference}</strong></span>
                  </div>
                )}
                
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
                      {orderDetails.customerName && (
                        <div className="order-detail">
                          <span className="detail-label">Nimi:</span>
                          <span className="detail-value">{orderDetails.customerName}</span>
                        </div>
                      )}
                      {orderDetails.customerPhone && (
                        <div className="order-detail">
                          <span className="detail-label">Telefon:</span>
                          <span className="detail-value">{orderDetails.customerPhone}</span>
                        </div>
                      )}
                      
                      {/* Display Omniva parcel machine info if available */}
                      {orderDetails.omnivaParcelMachineName && (
                        <div className="order-detail">
                          <span className="detail-label">Pakiautomaat:</span>
                          <span className="detail-value">{orderDetails.omnivaParcelMachineName}</span>
                        </div>
                      )}

                      {/* Display Omniva tracking link if available */}
                      {orderDetails.trackingUrl && (
                        <div className="order-detail">
                          <span className="detail-label">Jälgimisnumber:</span>
                          <span className="detail-value">
                            <a 
                              href={orderDetails.trackingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="tracking-link"
                            >
                              {orderDetails.omnivaBarcode} 🔗
                            </a>
                          </span>
                        </div>
                      )}
                      
                      {orderDetails.timestamp && (
                        <div className="order-detail">
                          <span className="detail-label">Tellimuse aeg:</span>
                          <span className="detail-value">{new Date(orderDetails.timestamp).toLocaleString('et-EE')}</span>
                        </div>
                      )}
                      {orderDetails.orderItems && orderDetails.orderItems.length > 0 && (
                        <div className="order-items">
                          <h3>Tellitud tooted:</h3>
                          <table className="items-table">
                            <thead>
                              <tr>
                                <th>Toode</th>
                                <th>Kogus</th>
                                <th>Hind</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderDetails.orderItems.map((item, index) => (
                                <tr key={index} className="order-item">
                                  <td className="item-title">{item.product_title}</td>
                                  <td className="item-quantity">{item.quantity || 1}</td>
                                  <td className="item-price">{typeof item.price === 'number' ? `${item.price.toFixed(2)}€` : item.price}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
                      <span className="contact-icon" aria-hidden="true">✉️</span>
                      leen@leen.ee
                    </a>
                    <a href="tel:+37253801413" className="contact-link">
                      <span className="contact-icon" aria-hidden="true">📞</span>
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

        .order-reference {
          background-color: #f0f4ff;
          color: var(--color-ultramarine);
          padding: 12px 16px;
          border-radius: 8px;
          margin: 24px 0;
          font-weight: 500;
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
          border-radius: 8px;
          margin-top: 16px;
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
          margin-bottom: 24px;
        }

        .order-items h3 {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          color: var(--color-ultramarine);
          margin-bottom: 12px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          font-size: 0.95rem;
        }

        .items-table th {
          text-align: left;
          padding: 8px;
          border-bottom: 1px solid #e0e0e0;
          font-weight: 500;
          color: #555;
        }

        .items-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #f0f0f0;
        }

        .items-table tr:last-child td {
          border-bottom: none;
        }

        .item-title {
          font-weight: 500;
        }

        .item-quantity {
          text-align: center;
          color: #666;
        }

        .item-price {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          text-align: right;
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
          background-color: #fafafa;
          padding: 32px;
          border-radius: 8px;
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
          margin-top: 24px;
          flex-wrap: wrap;
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
            margin: 0 auto;
          }
          
          .contact-links {
            flex-direction: column;
            gap: 12px;
            align-items: center;
          }
          
          .items-table th:nth-child(2),
          .items-table td:nth-child(2) {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default CheckoutSuccess;