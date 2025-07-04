import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import * as crypto from 'npm:crypto-js@4.2.0';

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

// Maksekeskus API credentials
const SHOP_ID = Deno.env.get('MAKSEKESKUS_SHOP_ID')!;
const API_SECRET_KEY = Deno.env.get('MAKSEKESKUS_API_SECRET_KEY')!;

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
    const formData = await req.formData();
    const payload = formData.get('json')?.toString() || '';
    const mac = formData.get('mac')?.toString() || '';

    console.log('Received Maksekeskus notification:', {
      payload: payload.substring(0, 100) + '...',
      mac: mac ? mac.substring(0, 10) + '...' : 'missing'
    });

    // Verify MAC signature
    if (!verifyMac(payload, mac)) {
      console.error('Invalid MAC signature in notification');
      return new Response(
        JSON.stringify({ error: 'Invalid MAC signature' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse payload
    const data = JSON.parse(payload);
    
    // Extract merchant data
    const merchantData = JSON.parse(data.merchant_data || '{}');
    const orderId = merchantData.order_id || null;
    
    if (!orderId) {
      console.error('Notification missing order_id:', data);
      return new Response(
        JSON.stringify({ error: 'Missing order_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Map Maksekeskus status to our status
    const statusMap: Record<string, string> = {
      'COMPLETED': 'COMPLETED',
      'CANCELLED': 'CANCELLED',
      'EXPIRED': 'EXPIRED',
      'PENDING': 'PENDING'
    };
    
    const status = statusMap[data.status] || 'PENDING';
    
    // Update order payment status
    await updateOrderPayment(
      orderId,
      data.transaction || 'unknown',
      status,
      data.payment_method || 'banklink',
      parseFloat(data.amount || '0')
    );
    
    console.log(`Processed notification for order ${orderId}, status: ${status}`);
    
    // Always return 200 OK to acknowledge receipt
    return new Response(
      JSON.stringify({ status: 'OK' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Still return 200 OK to acknowledge receipt
    return new Response(
      JSON.stringify({ status: 'OK', error: error.message }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to verify MAC signature
function verifyMac(payload: string, mac: string): boolean {
  try {
    // Create HMAC using SHA-512 with the API secret key
    const calculatedMac = crypto.HmacSHA512(payload, API_SECRET_KEY)
      .toString(crypto.enc.Hex)
      .toUpperCase();
    
    // Convert received MAC to uppercase for comparison
    const receivedMac = mac ? mac.toUpperCase() : '';
    
    // Compare the calculated MAC with the received MAC
    const isValid = calculatedMac === receivedMac;
    
    if (!isValid) {
      console.warn('MAC validation failed:', {
        calculated: calculatedMac.substring(0, 10) + '...',
        received: receivedMac.substring(0, 10) + '...'
      });
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying MAC:', error);
    return false;
  }
}

// Helper function to update order payment status
async function updateOrderPayment(
  orderId: string, 
  transactionId: string, 
  status: string, 
  paymentMethod: string, 
  amount: number
): Promise<boolean> {
  try {
    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('order_payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();
    
    if (existingPayment) {
      console.log(`Duplicate webhook received for transaction ${transactionId}, order ${orderId}`);
      
      // Only update if status is changing to a more final state
      if (existingPayment.status === 'COMPLETED' && status !== 'COMPLETED') {
        console.log(`Ignoring status change from COMPLETED to ${status}`);
        return true;
      }
      
      // Update existing payment
      const { error } = await supabase
        .from('order_payments')
        .update({
          status: status
        })
        .eq('id', existingPayment.id);
      
      if (error) {
        console.error('Error updating payment:', error);
        throw error;
      }
    } else {
      // Create new payment
      const { error } = await supabase
        .from('order_payments')
        .insert({
          order_id: orderId,
          transaction_id: transactionId,
          payment_method: paymentMethod,
          amount: amount,
          currency: 'EUR',
          status: status
        });
      
      if (error) {
        console.error('Error creating payment:', error);
        throw error;
      }
    }
    
    // Update order status if payment completed
    if (status === 'COMPLETED') {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'PAID'
        })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }
      
      // Mark products as sold
      await markProductsAsSold(orderId);
    }
    
    console.log(`Updated payment status for order ${orderId} to ${status}`);
    return true;
  } catch (error) {
    console.error('Error in updateOrderPayment:', error);
    throw error;
  }
}

// Helper function to mark products as sold
async function markProductsAsSold(orderId: string): Promise<void> {
  try {
    // Get products from order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id')
      .eq('order_id', orderId);
    
    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      throw itemsError;
    }
    
    // Update product availability
    for (const item of orderItems || []) {
      const { error } = await supabase
        .from('products')
        .update({
          available: false
        })
        .eq('id', item.product_id);
      
      if (error) {
        console.error(`Error marking product ${item.product_id} as sold:`, error);
        // Continue with other products even if one fails
      }
    }
    
    console.log(`Marked ${orderItems?.length || 0} products as sold for order ${orderId}`);
  } catch (error) {
    console.error('Error in markProductsAsSold:', error);
    // Don't throw, as this is a non-critical operation
  }
}