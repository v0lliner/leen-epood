# Maksekeskus Integration Documentation

This document provides comprehensive information about the Maksekeskus payment integration implemented for the Leen.ee e-shop.

## Overview

The integration uses Maksekeskus.ee payment gateway to process payments via bank-links (open banking). The implementation follows a server-to-server integration pattern for secure transaction processing.

## Architecture

The integration consists of:

1. **Backend (Node.js)**
   - Express.js API server
   - Direct integration with Maksekeskus REST API
   - Webhook handling for payment notifications
   - Order management with Supabase

2. **Frontend (React)**
   - Payment method selection UI
   - Integration with checkout flow
   - Payment status handling

## Setup Instructions

### 1. Environment Variables

Configure the integration by setting the following environment variables:

```
# Maksekeskus API credentials
MAKSEKESKUS_SHOP_ID=your-shop-id
MAKSEKESKUS_API_SECRET_KEY=your-secret-key
MAKSEKESKUS_API_OPEN_KEY=your-open-key

# Supabase service role key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Base URL for the site
SITE_URL=https://leen.ee

# Test mode (true/false)
MAKSEKESKUS_TEST_MODE=true
```

### 2. Dependencies

Install the required Node.js dependencies:

```bash
npm add axios crypto-js dotenv @supabase/supabase-js express cors
```

### 3. Database Setup

The integration uses the following Supabase tables:

- `orders` - Stores order information
- `order_items` - Stores order line items
- `order_payments` - Stores payment information

The necessary SQL migrations are included in the project.

### 4. Server Configuration

Ensure your server has:

- Node.js 16 or higher
- HTTPS enabled for production
- Proper CORS configuration
- Accessible webhook endpoint

## Payment Flow

### 1. Checkout Process

1. User adds products to cart and proceeds to checkout
2. User enters shipping information
3. System fetches available payment methods from Maksekeskus
4. User selects a bank-link payment method
5. User clicks "Proceed to payment"
6. System creates an order in the Supabase database
7. System creates a transaction in Maksekeskus
8. User is redirected to the selected bank's payment page

### 2. Payment Completion

1. After completing payment at the bank, user is redirected back to the shop
2. Successful payments redirect to `/makse/korras`
3. Cancelled payments redirect to `/makse/katkestatud`
4. Maksekeskus sends a notification to the webhook endpoint

### 3. Webhook Handling

The webhook endpoint (`/api/maksekeskus/notification`):

1. Verifies the MAC signature
2. Updates the order status based on the payment status
3. Marks products as sold for completed payments
4. Returns a 200 OK response to acknowledge receipt

## Security Considerations

1. **API Keys**: Store API keys securely in environment variables, never expose them in client-side code
2. **MAC Verification**: Always verify the MAC signature for notifications
3. **HTTPS**: Use HTTPS for all API endpoints
4. **Idempotency**: Handle duplicate notifications gracefully
5. **Logging**: Log all payment events for audit purposes

## Testing

### Test Environment

1. Set `MAKSEKESKUS_TEST_MODE` to `true`
2. Use test credentials from Maksekeskus sandbox
3. Test the full payment flow with different banks
4. Test cancellation and error scenarios

### Test Scenarios

1. **Successful Payment**: Complete the payment flow successfully
2. **Cancelled Payment**: Cancel the payment at the bank
3. **Expired Session**: Let the payment session expire
4. **Invalid Data**: Test with invalid order data
5. **Duplicate Notifications**: Test handling of duplicate notifications

## Future Enhancements

### 1. Card Payments

To add card payment support:

1. Update the payment methods component to include card options
2. Implement the Maksekeskus JS library for card tokenization
3. Update the backend to handle card payment transactions

### 2. Refunds

To implement refund functionality:

1. Create a new API endpoint for refunds
2. Use the Maksekeskus API to create refunds
3. Update the order status to reflect refunds

### 3. Payment Links

For payment links (e.g., for invoices):

1. Create a new API endpoint to generate payment links
2. Use the Maksekeskus API to create a transaction
3. Return the payment URL to the client

### 4. Recurring Payments

For subscription-based payments:

1. Implement card tokenization
2. Store customer payment tokens securely
3. Create a scheduler for recurring charges

## Troubleshooting

### Common Issues

1. **MAC Verification Failures**
   - Check that the correct secret key is being used
   - Ensure the payload is not modified before verification

2. **Missing Notifications**
   - Check server firewall settings
   - Verify the notification URL is accessible from the internet
   - Check server logs for errors

3. **Payment Method Not Available**
   - Verify the shop is configured for the payment method
   - Check amount limits for the payment method

### Logging

All payment-related events are logged to the console. In a production environment, consider implementing a more robust logging solution.

## Contact Information

For issues with the integration, contact:

- **Developer Support**: support@maksekeskus.ee
- **Technical Documentation**: https://developer.maksekeskus.ee/

## URLs for Maksekeskus Portal

- **Return URL**: https://leen.ee/makse/korras
- **Cancel URL**: https://leen.ee/makse/katkestatud
- **Notification URL**: https://leen.ee/api/maksekeskus/notification