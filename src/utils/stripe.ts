import { supabase } from './supabase/client';

export interface CheckoutItem {
  name: string;
  description: string;
  amount: number; // in cents
  quantity: number;
  currency: string;
  image?: string;
}

export interface CheckoutSessionRequest {
  items: CheckoutItem[];
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(
  request: CheckoutSessionRequest
): Promise<{ data: CheckoutSessionResponse | null; error: string | null }> {
  try {
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { data: null, error: 'User not authenticated' };
    }

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: request,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Stripe checkout error:', error);
      return { data: null, error: error.message || 'Failed to create checkout session' };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error creating checkout session:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Get user's subscription status
 */
export async function getUserSubscription(): Promise<{
  data: any | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error fetching subscription:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Get user's order history
 */
export async function getUserOrders(): Promise<{
  data: any[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('stripe_user_orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Unexpected error fetching orders:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Stripe amounts are in cents
}