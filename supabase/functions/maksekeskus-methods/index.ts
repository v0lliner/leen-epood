import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import axios from 'npm:axios@1.6.7';
import * as crypto from 'npm:crypto-js@4.2.0';

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maksekeskus API configuration
const SHOP_ID = Deno.env.get('MAKSEKESKUS_SHOP_ID')!;
const API_OPEN_KEY = Deno.env.get('MAKSEKESKUS_API_OPEN_KEY')!;
const API_SECRET_KEY = Deno.env.get('MAKSEKESKUS_API_SECRET_KEY')!;
const TEST_MODE = Deno.env.get('MAKSEKESKUS_TEST_MODE') === 'true';

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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Get amount from query string
    const url = new URL(req.url);
    let amount = url.searchParams.get('amount');
    
    // Validate amount parameter
    if (!amount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Amount parameter is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Parse amount, ensuring it's a valid number
    const cleanAmount = amount.toString().trim().replace(',', '.');
    const parsedAmount = parseFloat(cleanAmount);
    
    // Check if parsing resulted in a valid number
    if (isNaN(parsedAmount)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid amount format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Ensure amount is positive
    if (parsedAmount <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Amount must be greater than zero' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch payment methods from Maksekeskus API
    try {
      console.log(`Fetching payment methods for amount: ${parsedAmount}`);
      
      // Prepare request parameters
      const params = new URLSearchParams({
        amount: parsedAmount.toString(),
        currency: 'EUR',
        country: 'ee'
      });
      
      // Make request to Maksekeskus API
      const response = await axios.get(`${API_BASE_URL}/methods?${params.toString()}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${SHOP_ID}:${API_OPEN_KEY}`)}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Process response
      if (response.status === 200 && response.data) {
        // Extract payment methods from response
        const methods = [];
        
        // Process banklinks
        if (response.data.banklinks && Array.isArray(response.data.banklinks)) {
          response.data.banklinks.forEach(bank => {
            methods.push({
              name: bank.name,
              display_name: bank.name,
              channel: bank.channel,
              type: 'banklink',
              countries: ['ee'],
              logo_url: `https://static.maksekeskus.ee/img/channel/lnd/${bank.channel}.png`,
              min_amount: 0.01,
              max_amount: 15000
            });
          });
        }
        
        // Return payment methods
        return new Response(
          JSON.stringify({
            success: true,
            methods: methods,
            count: methods.length
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    } catch (apiError) {
      console.error('Error calling Maksekeskus API:', apiError);
      
      // Fall back to mock data on API error
      const mockMethods = getMockPaymentMethods();
      const filteredMethods = filterMethods(mockMethods, parsedAmount);
      
      return new Response(
        JSON.stringify({
          success: true,
          methods: filteredMethods,
          count: filteredMethods.length,
          fromMock: true,
          error: apiError.message
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    
    // Return mock methods on error
    const mockMethods = getMockPaymentMethods();
    
    // Parse amount for filtering
    const url = new URL(req.url);
    const amount = url.searchParams.get('amount');
    const parsedAmount = parseFloat(amount?.toString().replace(',', '.') || '0.01');
    
    // Filter methods based on amount
    const filteredMethods = filterMethods(mockMethods, parsedAmount > 0 ? parsedAmount : 0.01);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        methods: filteredMethods, 
        count: filteredMethods.length, 
        fromMock: true,
        error: error.message
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to filter methods based on amount and country
function filterMethods(methods, amount) {
  const filtered = methods.filter(method => {
    // Ensure min_amount and max_amount are numbers
    const minAmount = typeof method.min_amount === 'number' ? method.min_amount : 0;
    const maxAmount = typeof method.max_amount === 'number' ? method.max_amount : Number.MAX_SAFE_INTEGER;
    
    // Check country match (Estonia)
    const countryMatch = method.countries && Array.isArray(method.countries) && 
                        method.countries.includes('ee');
    
    // Check min amount
    const minAmountOk = amount >= minAmount;
    
    // Check max amount
    const maxAmountOk = amount <= maxAmount;
    
    return countryMatch && minAmountOk && maxAmountOk;
  });
  
  console.log(`Filtered ${methods.length} methods to ${filtered.length} for amount ${amount}`);
  return filtered;
}

// Mock payment methods for testing
function getMockPaymentMethods() {
  return [
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
    },
    {
      "name": "Luminor",
      "display_name": "Luminor",
      "channel": "luminor",
      "type": "banklink",
      "countries": ["ee"],
      "logo_url": "https://static.maksekeskus.ee/img/channel/luminor.png",
      "min_amount": 0.01,
      "max_amount": 15000
    }
  ];
}