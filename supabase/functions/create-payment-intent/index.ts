import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Leen E-pood',
    version: '1.0.0',
  },
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const { amount, currency = 'eur', items, customer, metadata = {} } = await req.json();

    // Validate required parameters
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Items are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user information from auth header if available
    let userId = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) {
        console.error('Auth error:', authError);
      } else if (user) {
        userId = user.id;
        console.log(`Authenticated user: ${userId}`);
      }
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId;
    
    if (userId) {
      // Try to find existing customer mapping
      const { data: customerData } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();
      
      if (customerData?.customer_id) {
        stripeCustomerId = customerData.customer_id;
        console.log(`Found existing Stripe customer: ${stripeCustomerId}`);
      } else {
        // Create new customer in Stripe
        const newCustomer = await stripe.customers.create({
          email: customer?.email || '',
          name: customer?.name || '',
          phone: customer?.phone || '',
          metadata: {
            user_id: userId,
          },
        });
        
        stripeCustomerId = newCustomer.id;
        console.log(`Created new Stripe customer: ${stripeCustomerId}`);
        
        // Save customer mapping
        await supabase.from('stripe_customers').insert({
          user_id: userId,
          customer_id: stripeCustomerId,
        });
      }
    } else if (customer?.email) {
      // Create ephemeral customer for guest checkout
      const newCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.name || '',
        phone: customer.phone || '',
      });
      
      stripeCustomerId = newCustomer.id;
      console.log(`Created ephemeral Stripe customer: ${stripeCustomerId}`);
    }

    // Prepare line items description for the payment intent
    const lineItems = items.map(item => `${item.title || 'Product'} x${item.quantity || 1}`).join(', ');

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: stripeCustomerId,
      metadata: {
        ...metadata,
        items: lineItems.substring(0, 500), // Stripe metadata has a 500 char limit
        user_id: userId || 'guest',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return the client secret to the client
    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create payment intent' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});