import express from 'express';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto-js';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Maksekeskus configuration
const SHOP_ID = process.env.MAKSEKESKUS_SHOP_ID;
const API_SECRET_KEY = process.env.MAKSEKESKUS_API_SECRET_KEY;
const API_OPEN_KEY = process.env.MAKSEKESKUS_API_OPEN_KEY;
const TEST_MODE = process.env.MAKSEKESKUS_TEST_MODE === 'true';
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';

// Maksekeskus API URLs
const API_BASE_URL = TEST_MODE 
  ? 'https://sandbox-payment.maksekeskus.ee/api/v1'
  : 'https://payment.maksekeskus.ee/api/v1';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache for payment methods (refreshed daily)
let paymentMethodsCache = {
  methods: [],
  timestamp: 0
};

// Helper function to fetch payment methods from Maksekeskus
async function fetchPaymentMethods() {
  try {
    // Check if cache is valid (less than 24 hours old)
    const now = Date.now();
    if (paymentMethodsCache.methods.length > 0 && 
        now - paymentMethodsCache.timestamp < 24 * 60 * 60 * 1000) {
      console.log('Using cached payment methods');
      return paymentMethodsCache.methods;
    }
    
    // Fetch payment methods from Maksekeskus
    const response = await axios.get(`${API_BASE_URL}/methods`, {
      auth: {
        username: SHOP_ID,
        password: API_OPEN_KEY
      }
    });
    
    // Extract banklinks
    const banklinks = response.data.banklinks || [];
    
    // Update cache
    paymentMethodsCache = {
      methods: banklinks,
      timestamp: now
    };
    
    console.log(`Fetched ${banklinks.length} payment methods from Maksekeskus`);
    return banklinks;
  } catch (error) {
    console.error('Error fetching payment methods:', error.message);
    
    // Return cached methods if available, otherwise empty array
    return paymentMethodsCache.methods.length > 0 
      ? paymentMethodsCache.methods 
      : [];
  }
}

// Helper function to create a transaction in Maksekeskus
async function createTransaction(orderData, paymentMethod) {
  try {
    // Prepare transaction data
    const transaction = {
      amount: orderData.total,
      currency: 'EUR',
      reference: generateReference(orderData.id || 'TEMP'),
      merchant_data: JSON.stringify({
        order_id: orderData.id || 'TEMP',
        customer_email: orderData.email
      }),
      customer: {
        email: orderData.email,
        name: orderData.name,
        country: 'ee',
        locale: 'et',
        ip: orderData.ip || '127.0.0.1'
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
      }
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
    
    console.log(`Created transaction: ${response.data.id} for order`);
    
    return {
      transaction_id: response.data.id,
      payment_url: paymentUrl
    };
  } catch (error) {
    console.error('Error creating transaction:', error.message);
    throw error;
  }
}

// Helper function to generate reference number
function generateReference(orderId) {
  // Format: LEEN + order ID + timestamp (truncated to fit 20 chars)
  const reference = `LEEN${orderId}${Date.now().toString().substr(-6)}`;
  
  // Ensure max 20 chars
  return reference.substring(0, 20);
}

// Helper function to verify MAC signature
function verifyMac(payload, mac) {
  const calculatedMac = crypto.SHA512(payload + API_SECRET_KEY).toString().toUpperCase();
  return calculatedMac === mac;
}

// Helper function to create order in database
async function createOrder(orderData) {
  try {
    // Calculate total amount
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + (item.price * (item.quantity || 1)), 
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
      throw error;
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
          price: item.price
        });
      
      if (itemError) {
        console.error('Error creating order item:', itemError);
        // Continue with other items even if one fails
      }
    }
    
    console.log(`Created order: ${order.id} with ${orderData.items.length} items`);
    return order;
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
}

// Helper function to update order payment status
async function updateOrderPayment(orderId, transactionId, status, paymentMethod, amount) {
  try {
    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('order_payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();
    
    if (existingPayment) {
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
async function markProductsAsSold(orderId) {
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
    for (const item of orderItems) {
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
    
    console.log(`Marked ${orderItems.length} products as sold for order ${orderId}`);
  } catch (error) {
    console.error('Error in markProductsAsSold:', error);
    // Don't throw, as this is a non-critical operation
  }
}

// Routes
app.get('/api/payment-methods', async (req, res) => {
  try {
    // Get amount from query string
    const amount = parseFloat(req.query.amount) || 0;
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    
    // Fetch payment methods
    const allMethods = await fetchPaymentMethods();
    
    // Filter methods based on amount and country
    const availableMethods = allMethods.filter(method => 
      method.countries.includes('ee') &&
      (!method.min_amount || amount >= method.min_amount) &&
      (!method.max_amount || amount <= method.max_amount)
    );
    
    // Return payment methods
    res.status(200).json({
      success: true,
      methods: availableMethods
    });
    
  } catch (error) {
    console.error('Error getting payment methods:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to load payment methods'
    });
  }
});

app.post('/api/create-payment', async (req, res) => {
  try {
    const { orderData, paymentMethod } = req.body;
    
    if (!orderData || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required data'
      });
    }
    
    // Create order in database
    const order = await createOrder(orderData);
    
    // Create transaction in Maksekeskus
    const transaction = await createTransaction({
      ...orderData,
      id: order.id,
      ip: req.ip
    }, paymentMethod);
    
    res.status(200).json({
      success: true,
      order_id: order.id,
      transaction_id: transaction.transaction_id,
      payment_url: transaction.payment_url
    });
    
  } catch (error) {
    console.error('Error creating payment:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to create payment'
    });
  }
});

app.post('/api/maksekeskus/notification', async (req, res) => {
  try {
    // Always respond with 200 OK first to acknowledge receipt
    res.status(200).json({ status: 'ok' });
    
    // Get raw request body and MAC
    const payload = req.body.json;
    const mac = req.body.mac;
    
    // Log the notification
    console.log('Received notification:', payload);
    
    // Verify MAC signature
    if (!verifyMac(payload, mac)) {
      console.error('Invalid MAC signature');
      return;
    }
    
    // Parse payload
    const data = JSON.parse(payload);
    
    // Extract merchant data
    const merchantData = JSON.parse(data.merchant_data || '{}');
    const orderId = merchantData.order_id;
    
    if (!orderId) {
      console.error('Notification missing order_id:', data);
      return;
    }
    
    // Map Maksekeskus status to our status
    const statusMap = {
      'COMPLETED': 'COMPLETED',
      'CANCELLED': 'CANCELLED',
      'EXPIRED': 'EXPIRED',
      'PENDING': 'PENDING'
    };
    
    const status = statusMap[data.status] || 'PENDING';
    
    // Update order payment status
    await updateOrderPayment(
      orderId,
      data.transaction,
      status,
      'banklink', // Generic payment method
      parseFloat(data.amount)
    );
    
    console.log(`Processed notification for order ${orderId}, status: ${status}`);
    
  } catch (error) {
    console.error('Error processing notification:', error.message);
    // We've already sent a 200 OK response, so just log the error
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});