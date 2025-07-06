import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as crypto from 'crypto';
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

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Maksekeskus configuration
const SHOP_ID = process.env.MAKSEKESKUS_SHOP_ID;
const API_SECRET_KEY = process.env.MAKSEKESKUS_API_SECRET_KEY;
const API_OPEN_KEY = process.env.MAKSEKESKUS_API_OPEN_KEY;
const TEST_MODE = process.env.MAKSEKESKUS_TEST_MODE === 'true';
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';

// Maksekeskus API URLs
const API_BASE_URL = TEST_MODE 
  ? 'https://api.test.maksekeskus.ee/v1'
  : 'https://api.maksekeskus.ee/v1';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  // Only log query params if they exist and don't contain sensitive data
  if (Object.keys(req.query).length > 0) {
    console.log('Request query params:', req.query);
  }
  next();
});

// Cache for payment methods (refreshed daily)
let paymentMethodsCache = {
  methods: [],
  timestamp: 0
};

// Helper function to fetch payment methods from Maksekeskus
async function fetchPaymentMethods() {
  try {
    console.log('=== Fetching payment methods ===');
    console.log('API credentials check:', {
      shop_id: SHOP_ID ? 'Present' : 'Missing',
      api_open_key: API_OPEN_KEY ? 'Present' : 'Missing',
      test_mode: TEST_MODE
    });
    
    // Check if cache is valid (less than 24 hours old)
    const now = Date.now();
    if (paymentMethodsCache.methods.length > 0 && 
        now - paymentMethodsCache.timestamp < 24 * 60 * 60 * 1000) {
      console.log('Using cached payment methods');
      return paymentMethodsCache.methods;
    }
    
    // Use real API call to get payment methods
    const response = await axios.get(`${API_BASE_URL}/shops/${SHOP_ID}/payment-methods`, {
      auth: {
        username: SHOP_ID,
        password: API_OPEN_KEY
      }, 
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => true // Accept any status code to handle it manually
    });
    
    if (response.status !== 200) {
      console.error('Maksekeskus API error when fetching payment methods:', {
        status: response.status,
        data: response.data
      });
      
      return paymentMethodsCache.methods.length > 0 
        ? paymentMethodsCache.methods 
        : [];
    }
    
    // Extract banklinks from response
    const banklinks = response.data.banklinks || [];
    
    // Update cache
    paymentMethodsCache = {
      methods: banklinks,
      timestamp: now
    };
    
    console.log(`Fetched ${banklinks.length} payment methods from Maksekeskus`);
    return banklinks;
  } catch (error) {
    console.error('Exception when fetching payment methods:', {
      name: error.name,
      code: error.code,
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response'
    });
    
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
      reference: generateReference(orderData.order_number || 'TEMP'),
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
      },
      timeout: 15000, // 15 second timeout for transaction creation
      validateStatus: (status) => true // Accept any status code to handle it manually
    });
    
    // Check if response is successful
    if (response.status !== 200 && response.status !== 201) {
      console.error('Maksekeskus API error when creating transaction:', {
        status: response.status,
        data: response.data
      });
      
      // Provide a more detailed error message if available
      const errorMessage = response.data && response.data.error 
        ? response.data.error 
        : `Payment service unavailable (Status: ${response.status}). Please try again later.`;
      
      throw new Error(errorMessage);
    }
    
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
      payment_url: paymentUrl,
      transaction: response.data
    };
  } catch (error) {
    console.error('Exception when creating transaction:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response'
    });
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
  try {
    // Create HMAC using SHA-512 with the API secret key (using Node's crypto)
    const calculatedMac = crypto
      .createHmac('sha512', API_SECRET_KEY)
      .update(payload)
      .digest('hex')
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
    console.log('=== Payment methods request received ===');
    console.log('Query params:', req.query, typeof req.query.amount);
    
    // Get amount from query string
    let amount = null;
    
    // Validate amount parameter
    if (req.query.amount) {
      // Parse amount, ensuring it's a valid number
      console.log('Raw amount from request:', req.query.amount, typeof req.query.amount);
      const cleanAmount = req.query.amount.toString().trim().replace(',', '.');
      amount = parseFloat(cleanAmount);
      
      // Check if parsing resulted in a valid number
      console.log('Parsed amount result:', amount, typeof amount, 'isNaN:', isNaN(amount));
      if (isNaN(amount)) {
        console.error('Invalid amount format:', req.query.amount);
        // Use a default minimum amount instead of returning an error
        amount = 0.01;
        console.log('Using default minimum amount:', amount);
      }
    }
    
    // Validate amount is positive
    if (!amount || amount <= 0) {
      console.warn('Amount is zero or negative, using minimum value:', amount, typeof amount);
      amount = 0.01;
    }
    
    // Try to fetch real payment methods first
    let allMethods = await fetchPaymentMethods();
    
    if (!allMethods || allMethods.length === 0) {
      console.log('No methods fetched from API');
      return res.status(503).json({
        success: false,
        error: 'Payment service temporarily unavailable'
      });
    }
    
    // If still no methods, return an error
    if (!allMethods || allMethods.length === 0) {
      return res.status(503).json({
        success: false,
        error: 'Payment service temporarily unavailable'
      });
    }
    
    // Filter methods based on amount and country
    console.log('Filtering methods for Estonia and amount:', amount, '€');
    const availableMethods = allMethods.filter(method => {
      // Ensure min_amount and max_amount are numbers
      const minAmount = typeof method.min_amount === 'number' ? method.min_amount : 0;
      const maxAmount = typeof method.max_amount === 'number' ? method.max_amount : Number.MAX_SAFE_INTEGER;
      
      // Check country match
      const countryMatch = method.countries && Array.isArray(method.countries) && 
                          method.countries.includes('ee');
      
      // Check min amount
      const minAmountOk = amount >= minAmount;
      
      // Check max amount
      const maxAmountOk = amount <= maxAmount;
      
      // Log only if there's an issue with the method
      if (!countryMatch || !minAmountOk || !maxAmountOk) {
        console.log(`Method ${method.name} (${method.channel}) filtered out: country match: ${countryMatch}, min amount (${minAmount}) ok: ${minAmountOk}, max amount (${maxAmount}) ok: ${maxAmountOk}`);
      }
      
      return countryMatch && minAmountOk && maxAmountOk;
    });
    
    console.log(`Found ${availableMethods.length} available methods for amount ${amount}€`);
    
    // Return payment methods
    console.log('Returning methods:', availableMethods.map(m => m.channel || m.name).join(', '));
    return res.status(200).json({
      debug: {
        amount: amount,
        amount_type: typeof amount,
        total_methods: allMethods.length,
        filtered_methods: availableMethods.length
      },
      success: true,
      methods: availableMethods,
      count: availableMethods.length
    });
    
  } catch (error) {
    console.error('=== ERROR in /api/payment-methods endpoint ===');
    console.error('Error details:', error.name, error.message, error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to load payment methods. Please try again later.'
    });
  }
});

app.post('/api/create-payment', async (req, res) => {
  try {
    const { orderData, paymentMethod } = req.body;
    
    console.log('=== Create payment request received ===');
    console.log('Payment method:', paymentMethod);
    console.log('Order data:', {
      ...orderData,
      // Don't log sensitive customer data
      name: orderData.name ? '***' : undefined,
      email: orderData.email ? '***' : undefined,
      phone: orderData.phone ? '***' : undefined,
      address: orderData.address ? '***' : undefined
    });

    // Validate required fields
    if (!orderData) {
      return res.status(400).json({
        success: false,
        error: 'Order data is required'
      });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Payment method is required'
      });
    }
    
    // Validate order items
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order must contain at least one item'
      });
    }
    
    // Create order in database
    const order = await createOrder(orderData);

    console.log('Order created in database:', {
      id: order.id,
      order_number: order.order_number,
      total_amount: order.total_amount
    });
    
    // Create real transaction with Maksekeskus API
    const transaction = await createTransaction({
      ...orderData,
      id: order.id,
      order_number: order.order_number,
      ip: req.ip
    }, paymentMethod);

    console.log('Transaction created:', {
      transaction_id: transaction.transaction_id,
      payment_url: transaction.payment_url ? 'Available' : 'Missing'
    });
    
    res.status(200).json({
      success: true,
      order_id: order.id || null,
      order_number: order.order_number || null,
      transaction_id: transaction.transaction_id || null,
      payment_url: transaction.payment_url || null
    });
    
  } catch (error) {
    console.error('Exception in /api/create-payment endpoint:', error.message, error.stack);
    
    // Determine appropriate status code
    const statusCode = error.response?.status || 500;

    console.error('Error response:', {
      status: statusCode,
      message: error.message
    });
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to create payment. Please try again later.'
    });
  }
});

app.post('/api/maksekeskus/notification', async (req, res) => {
  try {
    // Always respond with 200 OK first to acknowledge receipt
    res.status(200).json({ status: 'OK' });
    
    // Get raw request body and MAC
    const payload = req.body.json;
    const mac = req.body.mac;
    
    // Log the notification
    console.log('Received Maksekeskus notification:', {
      payload,
      mac: mac ? `${mac.substring(0, 10)}...` : 'missing'
    });
    
    // Verify MAC signature
    if (!verifyMac(payload, mac)) {
      console.error('Invalid MAC signature in notification', {
        payload: payload ? payload.substring(0, 100) + '...' : 'missing',
        mac: mac ? mac.substring(0, 10) + '...' : 'missing'
      });
      return;
    }
    
    // Parse payload
    const data = JSON.parse(payload);
    
    // Extract merchant data
    const merchantData = JSON.parse(data.merchant_data || '{}');
    const orderId = merchantData.order_id || null;
    
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
      orderId || 'unknown',
      data.transaction || 'unknown',
      status || 'PENDING',
      data.payment_method || 'banklink', // Use payment_method if available, otherwise generic
      parseFloat(data.amount || '0')
    );
    
    console.log(`Processed notification for order ${orderId}, status: ${status}`);
    
  } catch (error) {
    console.error('Exception in notification endpoint:', error.message, error.stack);
    // We've already sent a 200 OK response, so just log the error
  }
});

// Admin API endpoints
// Get all orders
app.get('/api/admin/orders', async (req, res) => {
  try {
    console.log('Fetching orders from database...');
    
    // Get orders from database
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error fetching orders:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`
      });
    }
    
    console.log(`Successfully fetched ${orders?.length || 0} orders`);
    
    return res.status(200).json({
      success: true,
      orders: orders || []
    });
  } catch (error) {
    console.error('Exception in /api/admin/orders endpoint:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
});

// Get order details
app.get('/api/admin/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order from database
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching order:', error);
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);
    
    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
    }
    
    // Get order payments
    const { data: payments, error: paymentsError } = await supabase
      .from('order_payments')
      .select('*')
      .eq('order_id', id);
    
    if (paymentsError) {
      console.error('Error fetching order payments:', paymentsError);
    }
    
    // Return order with items and payments
    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items: items || [],
        payments: payments || []
      }
    });
  } catch (error) {
    console.error('Exception in /api/admin/orders/:id endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update order status
app.put('/api/admin/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update order status'
      });
    }
    
    // If status is CANCELLED or REFUNDED, mark products as available again
    if (status === 'CANCELLED' || status === 'REFUNDED') {
      try {
        // Get order items
        const { data: items } = await supabase
          .from('order_items')
          .select('product_id')
          .eq('order_id', id);
        
        // Update product availability
        if (items && items.length > 0) {
          for (const item of items) {
            await supabase
              .from('products')
              .update({ available: true })
              .eq('id', item.product_id);
          }
        }
      } catch (err) {
        console.error('Error updating product availability:', err);
        // Continue even if this fails
      }
    }
    
    return res.status(200).json({
      success: true,
      order: data
    });
  } catch (error) {
    console.error('Exception in /api/admin/orders/:id/status endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get order statistics
app.get('/api/admin/orders/stats', async (req, res) => {
  try {
    // Get order counts by status
    const { data, error } = await supabase
      .from('orders')
      .select('status');
    
    if (error) {
      console.error('Error fetching order stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch order statistics'
      });
    }
    
    // Calculate counts
    const stats = {
      total: data.length,
      pending: data.filter(order => order.status === 'PENDING').length,
      paid: data.filter(order => order.status === 'PAID').length,
      processing: data.filter(order => order.status === 'PROCESSING').length,
      shipped: data.filter(order => order.status === 'SHIPPED').length,
      completed: data.filter(order => order.status === 'COMPLETED').length,
      cancelled: data.filter(order => order.status === 'CANCELLED').length,
      refunded: data.filter(order => order.status === 'REFUNDED').length
    };
    
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Exception in /api/admin/orders/stats endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get order by transaction ID
app.get('/api/orders/by-transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Get payment by transaction ID
    const { data: payment, error: paymentError } = await supabase
      .from('order_payments')
      .select('order_id')
      .eq('transaction_id', transactionId)
      .single();
    
    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', payment.order_id)
      .single();
    
    if (orderError) {
      console.error('Error fetching order:', orderError);
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', payment.order_id);
    
    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
    }
    
    // Return order with items
    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items: items || []
      }
    });
  } catch (error) {
    console.error('Exception in /api/orders/by-transaction/:transactionId endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: {
      test_mode: TEST_MODE,
      api_base: API_BASE_URL
    }
  });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`=== Maksekeskus API Server ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Notification URL: ${SITE_URL}/api/maksekeskus/notification`);
  console.log(`Environment: ${TEST_MODE ? 'TEST' : 'PRODUCTION'}`);
  console.log(`Using mock payment methods: false`);
  console.log(`=== Server Ready ===\n`);
});