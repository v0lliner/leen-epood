import { corsHeaders } from '../_shared/cors.ts';

interface SmartpostTerminal {
  place_id: string;
  name: string;
  city: string;
  address: string;
  description?: string;
  country: string;
  active: boolean;
}

// Cache terminals for 1 hour
let terminalsCache: SmartpostTerminal[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

async function getSmartpostTerminals(): Promise<SmartpostTerminal[]> {
  const currentTime = Date.now();
  
  // Return cached data if available and not expired
  if (terminalsCache && (currentTime - lastFetchTime < CACHE_DURATION)) {
    console.log('Returning cached Smartpost terminals');
    return terminalsCache;
  }
  
  console.log('Fetching fresh Smartpost terminals');
  try {
    const response = await fetch('https://my.smartpost.ee/api/ext/v1/places?country=ee&filter=apt');
    
    if (!response.ok) {
      throw new Error(`Smartpost API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Filter and transform the data
    const terminals = data
      .filter((terminal: any) => terminal.active)
      .map((terminal: any) => ({
        place_id: terminal.place_id,
        name: terminal.name,
        city: terminal.city,
        address: terminal.address,
        description: terminal.description,
        country: terminal.country,
        active: terminal.active
      }))
      .sort((a: SmartpostTerminal, b: SmartpostTerminal) => {
        // Sort by city first, then by name
        if (a.city !== b.city) {
          return a.city.localeCompare(b.city, 'et');
        }
        return a.name.localeCompare(b.name, 'et');
      });
    
    // Update cache
    terminalsCache = terminals;
    lastFetchTime = currentTime;
    
    return terminals;
  } catch (error) {
    console.error('Error fetching Smartpost terminals:', error);
    // If we have cached data, return it even if expired
    if (terminalsCache) {
      console.log('Returning expired cached data due to fetch error');
      return terminalsCache;
    }
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  try {
    const terminals = await getSmartpostTerminals();
    
    return new Response(
      JSON.stringify({
        success: true,
        terminals,
        count: terminals.length,
        cached: (Date.now() - lastFetchTime < CACHE_DURATION)
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in Smartpost terminals function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch Smartpost terminals'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});