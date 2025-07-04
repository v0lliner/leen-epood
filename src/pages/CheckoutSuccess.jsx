import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const CheckoutSuccess = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    // Get transaction ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transaction');
    
    if (transactionId) {
      setOrderInfo({
        transaction_id: transactionId,
        date: new Date().toLocaleDateString('et-EE')
      });
    }

    setLoading(false);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
                <p>Teie tellimus on edukalt vormistatud ja makse on vastu võetud.</p>
                
                {loading ? (
                  <div className="loading-info">
                    <div className="loading-spinner"></div>
                    <p>Laadin tellimuse andmeid...</p>
                  </div>
                ) : orderInfo ? (
                  <div className="order-confirmation">
                    <h3>Tellimuse kinnitamine</h3>
                    <div className="order-details">
                      <p><strong>Makse ID:</strong> {orderInfo.transaction_id}</p>
                      <p><strong>Kuupäev:</strong> {orderInfo.date}</p>
                      <p><strong>Staatus:</strong> <span className="status-completed">Makstud</span></p>
                    </div>
                  </div>
                ) : (
                  <div className="order-info">
                    <p>Saadame teile peagi tellimuse kinnituse e-kirja.</p>
                  </div>
                )}

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
                  <p>
                    <a href="mailto:leen@leen.ee" className="contact-link">leen@leen.ee</a> või 
                    <a href="tel:+37253801413" className="contact-link">+372 5380 1413</a>
                  </p>
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

        .loading-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin: 32px 0;
          padding: 24px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--color-ultramarine);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .order-confirmation {
          background: #f8f9fa;
          padding: 24px;
          border-radius: 8px;
          margin: 32px 0;
          border-left: 4px solid var(--color-ultramarine);
        }

        .order-confirmation h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-size: 1.25rem;
        }

        .order-details {
          text-align: left;
        }

        .order-details p {
          margin-bottom: 8px;
          font-size: 1rem;
        }
        
        .status-completed {
          color: #28a745;
          font-weight: 500;
        }

        .order-info {
          background: #f8f9fa;
          padding: 24px;
          border-radius: 8px;
          margin: 32px 0;
        }

        .order-info p {
          color: #666;
          font-size: 1rem;
          margin: 0;
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

        .contact-link {
          color: var(--color-ultramarine);
          text-decoration: none;
          font-weight: 500;
          margin: 0 4px;
        }

        .contact-link:hover {
          text-decoration: underline;
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
        }
      `}</style>
    </>
  );
};

export default CheckoutSuccess;