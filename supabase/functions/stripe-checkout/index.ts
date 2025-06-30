import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  // For 204 No Content, don't include Content-Type or body
  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { items, success_url, cancel_url } = await req.json();

    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return corsResponse({ error: 'Items array is required and must not be empty' }, 400);
    }

    if (!success_url || !cancel_url) {
      return corsResponse({ error: 'Success and cancel URLs are required' }, 400);
    }

    // Try to get user from auth header, but don't require it
    let customerId: string | undefined = undefined;
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const {
          data: { user },
          error: getUserError,
        } = await supabase.auth.getUser(token);

        if (!getUserError && user) {
          // User is authenticated, try to get or create Stripe customer
          const { data: customer, error: getCustomerError } = await supabase
            .from('stripe_customers')
            .select('customer_id')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .maybeSingle();

          if (!getCustomerError) {
            if (customer?.customer_id) {
              // Existing customer found
              customerId = customer.customer_id;
            } else {
              // Create new customer
              try {
                const newCustomer = await stripe.customers.create({
                  email: user.email,
                  metadata: {
                    userId: user.id,
                  },
                });

                console.log(`Created new Stripe customer ${newCustomer.id} for user ${user.id}`);

                const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
                  user_id: user.id,
                  customer_id: newCustomer.id,
                });

                if (!createCustomerError) {
                  customerId = newCustomer.id;
                }
              } catch (err) {
                console.error('Failed to create Stripe customer:', err);
                // Continue without customer ID
              }
            }
          }
        }
      } catch (err) {
        console.error('Error processing authentication:', err);
        // Continue without customer ID
      }
    }

    // Convert items to Stripe line_items format
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: item.currency.toLowerCase(),
        product_data: {
          name: item.name,
          description: item.description || undefined,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: item.amount, // amount in cents
      },
      quantity: item.quantity,
    }));

    // Create Checkout Session with or without customer ID
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment', // One-time payment
      success_url,
      cancel_url,
    };

    // Only add customer ID if we have one
    if (customerId) {
      sessionParams.customer = customerId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`Created checkout session ${session.id}${customerId ? ` for customer ${customerId}` : ' for guest'}`);

    return corsResponse({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error(`Checkout error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});