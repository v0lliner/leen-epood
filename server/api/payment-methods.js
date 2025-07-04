/**
 * API endpoint for getting payment methods
 */

// Mock payment methods data - replace with actual Maksekeskus integration
const MOCK_PAYMENT_METHODS = [
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

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    return;
  }

  try {
    // Get amount from query string
    const amount = parseFloat(req.query.amount) || 0;
    
    if (amount <= 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
      return;
    }
    
    // Filter payment methods based on amount
    const availableMethods = MOCK_PAYMENT_METHODS.filter(method => 
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
}