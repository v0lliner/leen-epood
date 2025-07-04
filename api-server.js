import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock bank data
const BANKS = [
  {
    method: 'swedbank',
    name: 'Swedbank',
    countries: ['EE'],
    min_amount: 0.01,
    max_amount: 10000
  },
  {
    method: 'seb',
    name: 'SEB',
    countries: ['EE'],
    min_amount: 0.01,
    max_amount: 10000
  },
  {
    method: 'luminor',
    name: 'Luminor',
    countries: ['EE'],
    min_amount: 0.01,
    max_amount: 10000
  },
  {
    method: 'lhv',
    name: 'LHV',
    countries: ['EE'],
    min_amount: 0.01,
    max_amount: 10000
  },
  {
    method: 'coop',
    name: 'Coop Pank',
    countries: ['EE'],
    min_amount: 0.01,
    max_amount: 10000
  }
];

// Routes
app.get('/api/payment-methods', (req, res) => {
  try {
    // Get amount from query string
    const amount = parseFloat(req.query.amount) || 0;
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    
    // Filter payment methods based on amount
    const availableMethods = BANKS.filter(method => 
      amount >= method.min_amount && amount <= method.max_amount
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
      error: 'Internal server error'
    });
  }
});

app.post('/api/create-payment', (req, res) => {
  try {
    const { orderData, paymentMethod } = req.body;
    
    if (!orderData || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required data'
      });
    }
    
    // Generate a mock transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // In a real implementation, this would create a transaction with Maksekeskus
    // and return the payment URL. For this mock, we'll simulate a successful payment
    // by redirecting to the success page.
    
    // Create a mock payment URL that redirects to the success page
    const paymentUrl = `${req.protocol}://${req.get('host')}/payment-success?transaction=${transactionId}`;
    
    // Log the transaction
    console.log(`Created payment transaction: ${transactionId} for method: ${paymentMethod}`);
    console.log(`Order data:`, JSON.stringify(orderData, null, 2));
    
    res.status(200).json({
      success: true,
      transaction_id: transactionId,
      payment_url: `/makse/korras?transaction=${transactionId}`,
      order_id: orderData.id || 'MOCK_ORDER'
    });
    
  } catch (error) {
    console.error('Error creating payment:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Mock payment success endpoint
app.get('/payment-success', (req, res) => {
  const { transaction } = req.query;
  res.redirect(`/makse/korras?transaction=${transaction}`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});