/**
 * API endpoint for creating payment transactions
 */

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    return;
  }

  try {
    const { orderData, paymentMethod } = req.body;
    
    if (!orderData || !paymentMethod) {
      res.status(400).json({
        success: false,
        error: 'Missing required data'
      });
      return;
    }
    
    // Mock payment creation - replace with actual Maksekeskus integration
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate mock payment URL
    const paymentUrl = `/payment-success?transaction=${transactionId}&order=${orderData.id || 'mock_order'}`;
    
    res.status(200).json({
      success: true,
      transaction_id: transactionId,
      payment_url: paymentUrl,
      redirect_url: paymentUrl
    });
    
  } catch (error) {
    console.error('Error creating payment:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}