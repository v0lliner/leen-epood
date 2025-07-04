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

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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
    console.log('=== Fetching payment methods from Maksekeskus ===');
    console.log('API credentials:', {
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
    
    // TEMPORARY: Return mock data for testing
    // console.log('USING MOCK DATA instead of actual API call');
    // return getMockPaymentMethods();

    // NOTE: Uncomment this code when ready to use the real API
    // Fetch payment methods from Maksekeskus
    const response = await axios.get(`${API_BASE_URL}/methods`, {
      auth: {
        username: SHOP_ID, // 4e2bed9a-aa24-4b87-801b-56c31c535d36
        password: API_OPEN_KEY // wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM
      }, 
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => true // Accept any status code to handle it manually
    });
    
    // Check if response is successful
    console.log('Maksekeskus API response status:', response.status);
    
    if (response.status !== 200) {
      console.error('Maksekeskus API error when fetching payment methods:', {
        status: response.status,
        data: response.data
      });
      
      // Return cached methods if available, otherwise empty array
      return paymentMethodsCache.methods.length > 0 
        ? paymentMethodsCache.methods 
        : [];
    }
    
    // Extract banklinks
    console.log('Maksekeskus API response data:', JSON.stringify(response.data).substring(0, 200) + '...');
    
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

// Mock payment methods for testing
function getMockPaymentMethods() {
  console.log('Using mock payment methods data');
  let mockMethods = [
    {
      "name": "Swedbank",
      "display_name": "Swedbank",
      "channel": "swedbank",
      "type": "banklink",
      "countries": ["ee"],
      "logo_url": "https://static.maksekeskus.ee/img/channel/swedbank.png",
      "min_amount": 0.01,
      "max_amount": 15000
    },
    {
      "name": "SEB",
      "display_name": "SEB",
      "channel": "seb",
      "type": "banklink",
      "countries": ["ee"],
      "logo_url": "https://static.maksekeskus.ee/img/channel/seb.png",
      "min_amount": 0.01,
      "max_amount": 15000
    },
    {
      "name": "LHV",
      "display_name": "LHV Pank",
      "channel": "lhv",
      "type": "banklink",
      "countries": ["ee"],
      "logo_url": "https://static.maksekeskus.ee/img/channel/lhv.png",
      "min_amount": 0.01,
      "max_amount": 15000
    },
    {
      "name": "Coop Pank",
      "display_name": "Coop Pank",
      "channel": "coop",
      "type": "banklink",
      "countries": ["ee"],
      "logo_url": "https://static.maksekeskus.ee/img/channel/coop.png",
      "min_amount": 0.01,
      "max_amount": 15000
    }
  ];
  
  // Add more mock methods for testing
  mockMethods = [
    ...mockMethods,
    {
      "name": "Luminor",
      "display_name": "Luminor",
      "channel": "luminor",
      "type": "banklink",
      "countries": ["ee"],
      "logo_url": "https://static.maksekeskus.ee/img/channel/luminor.png",
      "min_amount": 0.01,
      "max_amount": 15000
    },
    {
      "name": "Citadele",
      "display_name": "Citadele",
      "channel": "citadele",
      "type": "banklink",
      "countries": ["ee"],
      "logo_url": "https://static.maksekeskus.ee/img/channel/citadele.png",
      "min_amount": 0.01,
      "max_amount": 15000
    },
    {
      "name": "Swedbank",
      "display_name": "Swedbank (LV)",
      "channel": "swedbank_lv",
      "type": "banklink",
      "countries": ["lv"],
      "logo_url": "https://static.maksekeskus.ee/img/channel/swedbank.png",
      "min_amount": 0.01,
      "max_amount": 15000
    }
  ];
  
  // Log the mock methods
  console.log(`Created ${mockMethods.length} mock payment methods`);
  console.log(`Returning ${mockMethods.length} mock payment methods`);
  return mockMethods;
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
      // Use the exact URLs provided by the client
      return_url: 'https://leen.ee/makse/korras',
      cancel_url: 'https://leen.ee/makse/katkestatud',
      notification_url: 'https://leen.ee/api/maksekeskus/notification'
    };
    
    // Create transaction
    const response = await axios.post(`${API_BASE_URL}/transactions`, transaction, {
      auth: {
        username: SHOP_ID, // 4e2bed9a-aa24-4b87-801b-56c31c535d36
        password: API_SECRET_KEY // WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ
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
    console.log('Payment methods request with query params:', req.query);
    
    // Get amount from query string
    let amount = null;
    
    // Validate amount parameter
    if (req.query.amount) {
      // Parse amount, ensuring it's a valid number
      console.log('Raw amount from request:', req.query.amount);
      const cleanAmount = req.query.amount.toString().trim().replace(',', '.');
      amount = parseFloat(cleanAmount);
      
      // Check if parsing resulted in a valid number
      console.log('Parsed amount:', amount);
      if (isNaN(amount)) {
        console.error('Invalid amount format:', req.query.amount);
        return res.status(400).json({
          success: false,
          error: 'Invalid amount format'
        });
      }
    }
    
    // Validate amount is positive
    if (!amount || amount <= 0) {
      console.error('Amount must be greater than zero:', amount);
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than zero'
      });
    }
    
    // Fetch payment methods
    console.log('Fetching payment methods for amount:', amount, '€');
    const allMethods = await fetchPaymentMethods();
    
    // If no methods were fetched, return an error
    if (!allMethods || allMethods.length === 0) {
      return res.status(503).json({
        success: false,
        error: 'Payment service temporarily unavailable'
      });
    }
    
    // Filter methods based on amount and country
    console.log('Filtering payment methods for Estonia and amount:', amount, '€');
    const availableMethods = allMethods.filter(method => {
      // Check country match
      const countryMatch = method.countries && Array.isArray(method.countries) && 
                          method.countries.includes('ee');
      
      // Check min amount
      const minAmount = method.min_amount || 0;
      const minAmountOk = amount >= minAmount;
      
      // Check max amount
      const maxAmount = method.max_amount || Number.MAX_SAFE_INTEGER;
      const maxAmountOk = amount <= maxAmount;
      
      console.log(`Method ${method.name} (${method.channel}): country match: ${countryMatch}, min amount (${minAmount}) ok: ${minAmountOk}, max amount (${maxAmount}) ok: ${maxAmountOk}`);
      
      return countryMatch && minAmountOk && maxAmountOk;
    });
    
    console.log(`Filtered ${allMethods.length} methods to ${availableMethods.length} available methods for amount ${amount}`);
    
    // Return payment methods
    console.log('Returning payment methods:', availableMethods.map(m => m.channel || m.name).join(', '));
    return res.status(200).json({
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
    
    console.log(`Created order with ID: ${order.id}, order number: ${order.order_number}`);
    
    // Create transaction in Maksekeskus
    const transaction = await createTransaction({
      ...orderData,
      id: order.id,
      ip: req.ip
    }, paymentMethod);
    
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
app.listen(PORT, () => {
  console.log(`=== Maksekeskus API Server ===`);
  console.log(`Server running on http://localhost:${PORT} (${new Date().toISOString()})`);
  console.log(`Notification URL: ${SITE_URL}/api/maksekeskus/notification`);
  console.log(`Environment: ${TEST_MODE ? 'TEST' : 'PRODUCTION'}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Credentials: Shop ID ${SHOP_ID ? 'is present' : 'is MISSING'}`);
  console.log(`Credentials: API keys ${API_SECRET_KEY && API_OPEN_KEY ? 'are present' : 'are MISSING'}`);
  console.log(`=== Server Ready ===\n`);
  
  // Set test mode to false to use real API
  process.env.MAKSEKESKUS_TEST_MODE = 'false';
  console.log(`Test mode set to: ${process.env.MAKSEKESKUS_TEST_MODE}`);
});