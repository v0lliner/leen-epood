import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.3";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Maksekeskus credentials
const SHOP_ID = "4e2bed9a-aa24-4b87-801b-56c31c535d36";
const PUBLISHABLE_KEY = "wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM";
const SECRET_KEY = "WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ";
const TEST_MODE = false;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper function to create a MAC hash for Maksekeskus
function createMacHash(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + SECRET_KEY);
  return crypto.subtle.digest("SHA-512", data).then(hash => {
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  });
}

// Helper function to make API requests to Maksekeskus
async function makeApiRequest(method, endpoint, body = null) {
  const apiUrl = `${TEST_MODE ? 'https://api.test.maksekeskus.ee' : 'https://api.maksekeskus.ee'}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": "Basic " + btoa(`${SHOP_ID}:${SECRET_KEY}`)
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(apiUrl, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

// Handle requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // Create transaction endpoint
    if (path === "create-transaction" && req.method === "POST") {
      const { amount, currency, orderId, customerEmail, customerName } = await req.json();
      
      // Validate required fields
      if (!amount || !currency || !orderId) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Create a transaction in Maksekeskus
      const transactionData = {
        transaction: {
          amount: amount,
          currency: currency,
          reference: orderId,
          return_url: `${url.origin}/checkout/success`,
          cancel_url: `${url.origin}/checkout`,
          notification_url: `${url.origin}/functions/v1/payment-gateway/notification`
        },
        customer: {
          email: customerEmail || "",
          name: customerName || "",
          country: "EE",
          locale: "et"
        }
      };

      const transaction = await makeApiRequest("POST", "/v1/transactions", transactionData);

      return new Response(
        JSON.stringify({
          transactionId: transaction.id,
          paymentUrl: transaction.payment_url,
          shopId: SHOP_ID,
          publishableKey: PUBLISHABLE_KEY
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Payment notification endpoint
    if (path === "notification" && req.method === "POST") {
      const data = await req.json();
      const receivedMac = req.headers.get("mac");
      
      // Verify the MAC signature
      const macInput = JSON.stringify(data);
      const expectedMac = await createMacHash(macInput);
      
      if (receivedMac !== expectedMac) {
        return new Response("Invalid MAC", { status: 403 });
      }
      
      // Process the payment notification
      const { transaction, status } = data;
      
      // Update order status in database
      if (transaction && status) {
        const { data: orderData, error } = await supabase
          .from("orders")
          .update({ status: mapPaymentStatusToOrderStatus(status) })
          .eq("order_number", transaction.reference)
          .select();
          
        if (error) {
          console.error("Error updating order:", error);
        }
        
        // Add payment record
        if (status === "COMPLETED") {
          const { error: paymentError } = await supabase
            .from("order_payments")
            .insert({
              order_id: orderData?.[0]?.id,
              transaction_id: transaction.id,
              payment_method: transaction.method || "maksekeskus",
              amount: transaction.amount,
              currency: transaction.currency,
              status: status
            });
            
          if (paymentError) {
            console.error("Error recording payment:", paymentError);
          }
        }
      }
      
      return new Response("OK", { status: 200 });
    }

    // Default response for unknown endpoints
    return new Response(
      JSON.stringify({ error: "Endpoint not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to map Maksekeskus payment status to order status
function mapPaymentStatusToOrderStatus(paymentStatus) {
  switch (paymentStatus) {
    case "COMPLETED":
      return "PAID";
    case "PENDING":
      return "PENDING";
    case "CANCELLED":
      return "CANCELLED";
    case "EXPIRED":
      return "CANCELLED";
    case "REFUNDED":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}