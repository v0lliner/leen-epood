import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase and Stripe clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      appInfo: {
        name: 'Leen Väränen',
        version: '1.0.0',
      },
    });

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { items, success_url, cancel_url } = requestBody;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Items array is required and must not be empty' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: 'Success and cancel URLs are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate items structure
    for (const item of items) {
      if (!item.name || !item.amount || !item.quantity || !item.currency) {
        return new Response(
          JSON.stringify({ error: 'Each item must have name, amount, quantity, and currency' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (typeof item.amount !== 'number' || item.amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Item amount must be a positive number' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return new Response(
          JSON.stringify({ error: 'Item quantity must be a positive number' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Try to get user from auth header (optional)
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
          console.log(`Processing checkout for authenticated user: ${user.id}`);
          
          // Try to get existing Stripe customer
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
              console.log(`Using existing Stripe customer: ${customerId}`);
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
                } else {
                  console.error('Failed to save customer to database:', createCustomerError);
                }
              } catch (customerError) {
                console.error('Failed to create Stripe customer:', customerError);
                // Continue without customer ID
              }
            }
          } else {
            console.error('Error fetching customer from database:', getCustomerError);
          }
        } else if (getUserError) {
          console.error('Error getting user from token:', getUserError);
        }
      } catch (authError) {
        console.error('Error processing authentication:', authError);
        // Continue without customer ID
      }
    } else {
      console.log('Processing checkout for guest user');
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
        unit_amount: Math.round(item.amount), // Ensure it's an integer
      },
      quantity: Math.round(item.quantity), // Ensure it's an integer
    }));

    // Create Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment', // One-time payment
      success_url,
      cancel_url,
      locale: 'et', // Estonian language for checkout
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['EE', 'FI', 'LV', 'LT', 'SE'],
      },
      phone_number_collection: {
        enabled: true,
      },
      custom_text: {
        shipping_address: {
          message: 'Palun sisestage täpne tarneaadress',
        },
        submit: {
          message: 'Teie tellimus töödeldakse 1-3 tööpäeva jooksul',
        },
      },
    };

    // Only add customer ID if we have one
    if (customerId) {
      sessionParams.customer = customerId;
    }

    // Create the checkout session
    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create checkout session',
          details: stripeError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Created checkout session ${session.id}${customerId ? ` for customer ${customerId}` : ' for guest'}`);

    // Return successful response
    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in checkout function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});