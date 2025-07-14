import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase/client';
import SEOHead from '../../components/Layout/SEOHead';
import FadeInSection from '../../components/UI/FadeInSection';

interface Subscription {
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

const Account = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (error) {
          console.error('Error fetching subscription:', error);
          setError('Failed to load subscription data');
        } else {
          setSubscription(data);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getSubscriptionStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: '#28a745' };
      case 'trialing':
        return { label: 'Trial', color: '#17a2b8' };
      case 'past_due':
        return { label: 'Past Due', color: '#ffc107' };
      case 'canceled':
        return { label: 'Canceled', color: '#dc3545' };
      case 'not_started':
        return { label: 'Not Started', color: '#6c757d' };
      default:
        return { label: status.charAt(0).toUpperCase() + status.slice(1), color: '#6c757d' };
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <SEOHead page="home" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="account-header">
                <h1>My Account</h1>
                <button onClick={handleSignOut} className="sign-out-button">
                  Sign Out
                </button>
              </div>
            </FadeInSection>

            <FadeInSection>
              <div className="account-content">
                <div className="account-section">
                  <h2>Account Information</h2>
                  <div className="info-card">
                    <div className="info-row">
                      <span className="info-label">Email</span>
                      <span className="info-value">{user.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Member Since</span>
                      <span className="info-value">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="account-section">
                  <h2>Subscription</h2>
                  {loading ? (
                    <div className="loading-spinner-container">
                      <div className="loading-spinner"></div>
                      <p>Loading subscription data...</p>
                    </div>
                  ) : error ? (
                    <div className="error-message">
                      {error}
                    </div>
                  ) : subscription ? (
                    <div className="subscription-card">
                      <div className="subscription-header">
                        <h3>Subscription Status</h3>
                        <span 
                          className="subscription-status"
                          style={{ backgroundColor: getSubscriptionStatusDisplay(subscription.subscription_status).color }}
                        >
                          {getSubscriptionStatusDisplay(subscription.subscription_status).label}
                        </span>
                      </div>
                      
                      {subscription.subscription_status !== 'not_started' && (
                        <div className="subscription-details">
                          {subscription.current_period_end && (
                            <div className="subscription-row">
                              <span className="subscription-label">Current Period Ends</span>
                              <span className="subscription-value">
                                {formatDate(subscription.current_period_end)}
                              </span>
                            </div>
                          )}
                          
                          {subscription.payment_method_brand && subscription.payment_method_last4 && (
                            <div className="subscription-row">
                              <span className="subscription-label">Payment Method</span>
                              <span className="subscription-value">
                                {subscription.payment_method_brand.charAt(0).toUpperCase() + 
                                  subscription.payment_method_brand.slice(1)} •••• {subscription.payment_method_last4}
                              </span>
                            </div>
                          )}
                          
                          {subscription.cancel_at_period_end && (
                            <div className="subscription-notice">
                              Your subscription will end on {formatDate(subscription.current_period_end)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-subscription">
                      <p>You don't have an active subscription.</p>
                      <Link to="/epood" className="browse-products-link">
                        Browse Products
                      </Link>
                    </div>
                  )}
                </div>

                <div className="account-section">
                  <h2>Order History</h2>
                  <div className="orders-card">
                    <p className="no-orders">Your order history will appear here.</p>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 48px;
        }

        .account-header h1 {
          color: var(--color-ultramarine);
          margin: 0;
        }

        .sign-out-button {
          background-color: #f8f9fa;
          color: #dc3545;
          border: 1px solid #dc3545;
          padding: 8px 16px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sign-out-button:hover {
          background-color: #dc3545;
          color: white;
        }

        .account-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
        }

        .account-section {
          margin-bottom: 16px;
        }

        .account-section h2 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 24px;
        }

        .info-card,
        .subscription-card,
        .orders-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }

        .info-row,
        .subscription-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .info-row:last-child,
        .subscription-row:last-child {
          border-bottom: none;
        }

        .info-label,
        .subscription-label {
          font-weight: 500;
          color: #666;
        }

        .info-value,
        .subscription-value {
          color: var(--color-text);
        }

        .subscription-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .subscription-header h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-text);
          margin: 0;
        }

        .subscription-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .subscription-details {
          margin-top: 16px;
        }

        .subscription-notice {
          margin-top: 16px;
          padding: 12px;
          background-color: #fff3cd;
          border-radius: 4px;
          color: #856404;
          font-size: 0.9rem;
        }

        .no-subscription,
        .no-orders {
          text-align: center;
          padding: 24px;
          color: #666;
        }

        .browse-products-link {
          display: inline-block;
          margin-top: 16px;
          color: var(--color-ultramarine);
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }

        .browse-products-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          gap: 16px;
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

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .account-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 32px;
          }

          .account-content {
            gap: 32px;
          }

          .info-row,
          .subscription-row {
            flex-direction: column;
            gap: 4px;
          }

          .subscription-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default Account;