import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import axios from 'npm:axios@1.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Maksekeskus API configuration
const SHOP_ID = Deno.env.get('MAKSEKESKUS_SHOP_ID')!;
const API_SECRET_KEY = Deno.env.get('MAKSEKESKUS_API_SECRET_KEY')!;
const TEST_MODE = Deno.env.get('MAKSEKESKUS_TEST_MODE') === 'true';
const SITE_URL = Deno.env.get('SITE_URL') || 'https://leen.ee';

// Maksekeskus API URLs
const API_BASE_URL = TEST_MODE 
  ? 'https://api.test.maksekeskus.ee/v1'
  : 'https://api.maksekeskus.ee/v1';

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Parse request body
    const { orderData, paymentMethod } = await req.json();
    
    // Validate required fields
    if (!orderData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!paymentMethod) {
      return new Response(
        JSON.stringify({ success: false, error: 'Payment method is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Validate order items
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order must contain at least one item' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Create order in database
    const order = await createOrder(orderData);
    
    // Create transaction with Maksekeskus API
    const transaction = await createTransaction({
      ...orderData,
      id: order.id,
      order_number: order.order_number
    }, paymentMethod);
    
    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        order_number: order.order_number,
        transaction_id: transaction.transaction_id,
        payment_url: transaction.payment_url
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error creating payment:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create payment' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to create order in database
async function createOrder(orderData) {
  try {
    // Calculate total amount
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 
      0
    );
    
    // Insert order into database
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_name: orderData.name,
        customer_email: orderData.email,
        customer_phone: orderData.phone,
        shipping_address: orderData.address,
        shipping_city: orderData.city,
        shipping_postal_code: orderData.postalCode,
        shipping_country: orderData.country,
        total_amount: totalAmount,
        currency: 'EUR',
        status: 'PENDING',
        notes: orderData.notes || null,
        user_id: orderData.userId || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating order:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Insert order items
    for (const item of orderData.items) {
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.id,
          product_title: item.title,
          quantity: item.quantity || 1,
          price: parseFloat(item.price)
        });
      
      if (itemError) {
        console.error('Error creating order item:', itemError);
        // Continue with other items even if one fails
      }
    }
    
    return order;
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
}

// Helper function to create a transaction in Maksekeskus
async function createTransaction(orderData, paymentMethod) {
  try {
    // Prepare transaction data
    const transaction = {
      amount: orderData.total,
      currency: 'EUR',
      reference: generateReference(orderData.order_number || 'TEMP'),
      merchant_data: JSON.stringify({
        order_id: orderData.id || 'TEMP',
        customer_email: orderData.email
      }),  
      customer: {
        email: orderData.email,
        name: orderData.name,
        country: 'ee',
        locale: 'et'
      }, 
      return_url: `${SITE_URL}/makse/korras`,
      cancel_url: `${SITE_URL}/makse/katkestatud`,
      notification_url: `${SITE_URL}/api/maksekeskus/notification`
    };
    
    // Create transaction
    const response = await axios.post(`${API_BASE_URL}/transactions`, transaction, {
      auth: {
        username: SHOP_ID,
        password: API_SECRET_KEY
      },
      timeout: 15000 // 15 second timeout for transaction creation
    });
    
    // Get payment URL for the selected method
    let paymentUrl = null;
    
    // Check banklinks
    if (response.data.payment_methods && response.data.payment_methods.banklinks) {
      for (const bank of response.data.payment_methods.banklinks) {
        if (bank.channel === paymentMethod) {
          paymentUrl = bank.url;
          break;
        }
      }
    }
    
    // If not found in banklinks, check other methods
    if (!paymentUrl && response.data.payment_methods && response.data.payment_methods.other) {
      for (const other of response.data.payment_methods.other) {
        if (other.name === 'redirect') {
          paymentUrl = other.url;
          break;
        }
      }
    }
    
    if (!paymentUrl) {
      throw new Error('Selected payment method not available');
    }
    
    return {
      transaction_id: response.data.id,
      payment_url: paymentUrl
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

// Helper function to generate reference number
function generateReference(orderId: string): string {
  // Format: LEEN + order ID + timestamp (truncated to fit 20 chars)
  const reference = `LEEN${orderId}${Date.now().toString().substr(-6)}`;
  
  // Ensure max 20 chars
  return reference.substring(0, 20);
}