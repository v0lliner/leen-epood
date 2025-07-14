import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for handling Stripe checkout
 */
export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Create a checkout session and redirect to Stripe
   * @param priceId The Stripe Price ID
   * @param mode The checkout mode ('payment' or 'subscription')
   * @param successPath The path to redirect to after successful payment
   * @param cancelPath The path to redirect to if payment is cancelled
   */
  const createCheckoutSession = async (
    priceId: string,
    mode: 'payment' | 'subscription',
    successPath: string = '/checkout/success',
    cancelPath: string = '/checkout/cancel'
  ) => {
    if (!user) {
      setError('You must be logged in to make a purchase');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the JWT token for authentication
      const token = localStorage.getItem('sb-access-token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Get the current origin for success and cancel URLs
      const origin = window.location.origin;
      const success_url = `${origin}${successPath}`;
      const cancel_url = `${origin}${cancelPath}`;

      // Call the Supabase Edge Function to create a checkout session
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url,
          cancel_url,
          mode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error('No checkout URL returned');
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout');
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    loading,
    error
  };
};