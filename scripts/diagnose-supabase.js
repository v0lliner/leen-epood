#!/usr/bin/env node

/**
 * Supabase Connection Diagnostic Script
 * 
 * This script tests various aspects of Supabase connectivity to identify
 * RLS policy issues, CORS problems, or other connection failures.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Test configuration
const tests = {
  basic: true,
  rls: true,
  auth: true,
  cors: true,
  detailed: true
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  log(`${statusIcon} ${testName}: ${status}`, statusColor);
  if (details) {
    log(`   ${details}`, 'reset');
  }
}

async function testBasicConnection() {
  logSection('🔌 BASIC CONNECTION TEST');
  
  try {
    // Test environment variables
    const requiredVars = {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    let envVarsOk = true;
    for (const [key, value] of Object.entries(requiredVars)) {
      if (!value) {
        logTest(`Environment Variable: ${key}`, 'FAIL', 'Missing or empty');
        envVarsOk = false;
      } else {
        logTest(`Environment Variable: ${key}`, 'PASS', `Present (${value.substring(0, 20)}...)`);
      }
    }

    if (!envVarsOk) {
      log('\n❌ Cannot proceed with tests - missing environment variables', 'red');
      return false;
    }

    // Test URL format
    try {
      const url = new URL(process.env.VITE_SUPABASE_URL);
      logTest('Supabase URL Format', 'PASS', `${url.protocol}//${url.hostname}`);
    } catch (error) {
      logTest('Supabase URL Format', 'FAIL', `Invalid URL: ${error.message}`);
      return false;
    }

    // Test basic HTTP connectivity
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      logTest('HTTP Connectivity', response.ok ? 'PASS' : 'FAIL', 
        `Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        log(`   Response: ${errorText}`, 'red');
      }
    } catch (error) {
      logTest('HTTP Connectivity', 'FAIL', `Network error: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    logTest('Basic Connection', 'FAIL', `Unexpected error: ${error.message}`);
    return false;
  }
}

async function testRLSPolicies() {
  logSection('🔒 ROW LEVEL SECURITY (RLS) TEST');
  
  try {
    // Test with anon key (should respect RLS)
    const anonClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Test with service role key (should bypass RLS)
    const serviceClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test products table access with anon key
    try {
      const { data: anonData, error: anonError } = await anonClient
        .from('products')
        .select('id, title, available')
        .limit(5);

      if (anonError) {
        logTest('Anon Key - Products Access', 'FAIL', `Error: ${anonError.message}`);
        
        // Check if it's an RLS policy issue
        if (anonError.message.includes('row-level security') || 
            anonError.message.includes('policy') ||
            anonError.code === 'PGRST116') {
          log('   🔍 This appears to be an RLS policy issue', 'yellow');
          log('   💡 The anon role may not have SELECT permissions on products table', 'yellow');
        }
      } else {
        logTest('Anon Key - Products Access', 'PASS', `Retrieved ${anonData?.length || 0} products`);
      }
    } catch (error) {
      logTest('Anon Key - Products Access', 'FAIL', `Exception: ${error.message}`);
    }

    // Test products table access with service role key
    try {
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('products')
        .select('id, title, available')
        .limit(5);

      if (serviceError) {
        logTest('Service Role - Products Access', 'FAIL', `Error: ${serviceError.message}`);
      } else {
        logTest('Service Role - Products Access', 'PASS', `Retrieved ${serviceData?.length || 0} products`);
        
        if (serviceData && serviceData.length > 0) {
          log('   📋 Sample products:', 'blue');
          serviceData.forEach((product, index) => {
            log(`   ${index + 1}. ${product.title} (${product.available ? 'Available' : 'Sold'})`, 'reset');
          });
        }
      }
    } catch (error) {
      logTest('Service Role - Products Access', 'FAIL', `Exception: ${error.message}`);
    }

    // Check RLS status on products table
    try {
      const { data: rlsStatus } = await serviceClient
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public')
        .eq('tablename', 'products')
        .single();

      if (rlsStatus) {
        logTest('Products Table RLS Status', rlsStatus.rowsecurity ? 'ENABLED' : 'DISABLED', 
          `Row Level Security is ${rlsStatus.rowsecurity ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      logTest('RLS Status Check', 'FAIL', `Could not check RLS status: ${error.message}`);
    }

    // Check existing policies
    try {
      const { data: policies } = await serviceClient
        .rpc('get_policies', { table_name: 'products' })
        .catch(() => null);

      if (policies && policies.length > 0) {
        logTest('RLS Policies Found', 'INFO', `Found ${policies.length} policies`);
        policies.forEach(policy => {
          log(`   📜 ${policy.policyname}: ${policy.cmd} for ${policy.roles}`, 'blue');
        });
      } else {
        // Try alternative method to check policies
        const { data: altPolicies } = await serviceClient
          .from('pg_policies')
          .select('policyname, cmd, roles, qual')
          .eq('tablename', 'products')
          .catch(() => ({ data: null }));

        if (altPolicies && altPolicies.length > 0) {
          logTest('RLS Policies Found', 'INFO', `Found ${altPolicies.length} policies`);
          altPolicies.forEach(policy => {
            log(`   📜 ${policy.policyname}: ${policy.cmd} for ${policy.roles}`, 'blue');
          });
        } else {
          logTest('RLS Policies', 'WARN', 'No policies found or unable to query policies');
        }
      }
    } catch (error) {
      logTest('Policy Check', 'FAIL', `Could not check policies: ${error.message}`);
    }

  } catch (error) {
    logTest('RLS Test Setup', 'FAIL', `Setup error: ${error.message}`);
  }
}

async function testCORS() {
  logSection('🌐 CORS TEST');
  
  try {
    // Test CORS preflight request
    const corsResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/products`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'apikey, content-type'
      }
    });

    logTest('CORS Preflight', corsResponse.ok ? 'PASS' : 'FAIL', 
      `Status: ${corsResponse.status}`);

    // Check CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
    };

    for (const [header, value] of Object.entries(corsHeaders)) {
      logTest(`CORS Header: ${header}`, value ? 'PASS' : 'WARN', value || 'Not present');
    }

    // Test actual request from localhost origin
    const actualResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/products?limit=1`, {
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      }
    });

    logTest('CORS Actual Request', actualResponse.ok ? 'PASS' : 'FAIL', 
      `Status: ${actualResponse.status}`);

  } catch (error) {
    logTest('CORS Test', 'FAIL', `Error: ${error.message}`);
  }
}

async function testAuthentication() {
  logSection('🔐 AUTHENTICATION TEST');
  
  try {
    const client = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Test getting current session (should be null for anon)
    const { data: session, error: sessionError } = await client.auth.getSession();
    
    if (sessionError) {
      logTest('Auth Session Check', 'FAIL', `Error: ${sessionError.message}`);
    } else {
      logTest('Auth Session Check', 'PASS', 
        session.session ? 'User is authenticated' : 'No active session (expected for anon)');
    }

    // Test getting current user (should be null for anon)
    const { data: user, error: userError } = await client.auth.getUser();
    
    if (userError) {
      logTest('Auth User Check', 'FAIL', `Error: ${userError.message}`);
    } else {
      logTest('Auth User Check', 'PASS', 
        user.user ? `User: ${user.user.email}` : 'No authenticated user (expected for anon)');
    }

  } catch (error) {
    logTest('Authentication Test', 'FAIL', `Error: ${error.message}`);
  }
}

async function testDetailedProductAccess() {
  logSection('📊 DETAILED PRODUCT ACCESS TEST');
  
  try {
    const serviceClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get total product count
    const { count: totalCount, error: countError } = await serviceClient
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      logTest('Product Count', 'FAIL', `Error: ${countError.message}`);
    } else {
      logTest('Product Count', 'PASS', `Total products: ${totalCount}`);
    }

    // Get products with Stripe sync status
    const { data: products, error: productsError } = await serviceClient
      .from('products')
      .select('id, title, price, stripe_product_id, stripe_price_id, sync_status')
      .limit(10);

    if (productsError) {
      logTest('Product Details', 'FAIL', `Error: ${productsError.message}`);
    } else {
      logTest('Product Details', 'PASS', `Retrieved ${products?.length || 0} products with details`);
      
      if (products && products.length > 0) {
        log('\n   📋 Product Sync Status:', 'blue');
        let syncedCount = 0;
        let unsyncedCount = 0;
        
        products.forEach((product, index) => {
          const synced = product.stripe_product_id && product.stripe_price_id;
          if (synced) syncedCount++;
          else unsyncedCount++;
          
          const syncStatus = synced ? '✅ Synced' : '❌ Not Synced';
          log(`   ${index + 1}. "${product.title}" (${product.price}) - ${syncStatus}`, 'reset');
          
          if (synced) {
            log(`      Stripe Product: ${product.stripe_product_id}`, 'green');
            log(`      Stripe Price: ${product.stripe_price_id}`, 'green');
          }
        });
        
        log(`\n   📈 Sync Summary: ${syncedCount} synced, ${unsyncedCount} unsynced`, 'blue');
      }
    }

    // Test specific problematic product if it exists
    const { data: problematicProduct } = await serviceClient
      .from('products')
      .select('*')
      .eq('title', 'Ohakas')
      .single();

    if (problematicProduct) {
      logTest('Problematic Product Found', 'INFO', `"Ohakas" product exists`);
      log(`   ID: ${problematicProduct.id}`, 'blue');
      log(`   Title: "${problematicProduct.title}"`, 'blue');
      log(`   Price: ${problematicProduct.price}`, 'blue');
      log(`   Stripe Product ID: ${problematicProduct.stripe_product_id || 'Not set'}`, 'blue');
    }

  } catch (error) {
    logTest('Detailed Product Test', 'FAIL', `Error: ${error.message}`);
  }
}

async function generateRecommendations(testResults) {
  logSection('💡 RECOMMENDATIONS');
  
  // Analyze test results and provide recommendations
  log('Based on the diagnostic results:', 'cyan');
  
  // Check if we can access products with service role but not anon
  log('\n🔧 Potential Solutions:', 'yellow');
  
  log('1. If anon key fails but service role works:', 'blue');
  log('   → This is an RLS policy issue', 'reset');
  log('   → Add a policy to allow public SELECT on products table', 'reset');
  log('   → SQL: CREATE POLICY "Enable public read access for products" ON products FOR SELECT TO public USING (true);', 'green');
  
  log('\n2. If both keys fail:', 'blue');
  log('   → Check your Supabase project URL and API keys', 'reset');
  log('   → Verify your project is not paused', 'reset');
  log('   → Check Supabase status page', 'reset');
  
  log('\n3. If CORS issues detected:', 'blue');
  log('   → Supabase should handle CORS automatically', 'reset');
  log('   → Check if you have custom CORS configuration', 'reset');
  log('   → Try accessing from the same domain as your Supabase project', 'reset');
  
  log('\n4. For migration script specifically:', 'blue');
  log('   → Use the service role key for server-side operations', 'reset');
  log('   → Run the migration from a server environment, not browser', 'reset');
  log('   → Consider using the Supabase Edge Function instead of Node.js script', 'reset');
}

async function main() {
  log('🚀 Starting Supabase Connection Diagnostics', 'cyan');
  log(`📅 ${new Date().toISOString()}`, 'reset');
  
  const testResults = {};
  
  // Run all diagnostic tests
  if (tests.basic) {
    testResults.basic = await testBasicConnection();
  }
  
  if (tests.rls && testResults.basic !== false) {
    testResults.rls = await testRLSPolicies();
  }
  
  if (tests.cors && testResults.basic !== false) {
    testResults.cors = await testCORS();
  }
  
  if (tests.auth && testResults.basic !== false) {
    testResults.auth = await testAuthentication();
  }
  
  if (tests.detailed && testResults.basic !== false) {
    testResults.detailed = await testDetailedProductAccess();
  }
  
  // Generate recommendations
  await generateRecommendations(testResults);
  
  logSection('🏁 DIAGNOSTIC COMPLETE');
  log('If you need help interpreting these results, please share the output.', 'cyan');
}

// Run diagnostics
main().catch(error => {
  log(`💥 Diagnostic script failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});