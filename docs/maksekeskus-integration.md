# Maksekeskus Payment Integration

This document outlines the implementation of Maksekeskus payment integration for the Leen.ee e-commerce platform.

## Overview

The integration enables bank link payments through Maksekeskus, a popular Estonian payment service provider. The implementation follows a modular architecture with separate directories for different components.

## Architecture

The integration consists of the following components:

1. **Frontend Components**
   - Payment method selector in the checkout form
   - Payment processing logic in the checkout page

2. **Backend Components**
   - PHP endpoints for processing payments
   - Notification handlers for payment status updates
   - Success and cancel handlers for payment flow

3. **Routing**
   - All requests are routed through the main `index.php` file
   - Modular structure with separate files for each endpoint

## Implementation Details

### Directory Structure

```
public/php/
├── index.php                         # Main router
└── maksekeskus_integration/
    ├── process_payment.php           # Payment processing endpoint
    ├── notification.php              # Payment notification handler
    ├── success.php                   # Success URL handler
    └── cancel.php                    # Cancel URL handler
```

### Payment Flow

1. User selects a payment method in the checkout form
2. Frontend sends payment data to the backend
3. Backend creates a transaction using Maksekeskus SDK
4. User is redirected to the bank's payment page
5. After payment, user is redirected back to the success or cancel URL
6. Maksekeskus sends a notification to the notification URL
7. Order status is updated based on the notification

### Configuration

The integration uses the following environment variables:

- `MAKSEKESKUS_SHOP_ID`: Shop ID from Maksekeskus
- `MAKSEKESKUS_PUBLISHABLE_KEY`: Publishable API key
- `MAKSEKESKUS_SECRET_KEY`: Secret API key
- `MAKSEKESKUS_TEST_MODE`: Whether to use test mode (true/false)

### Endpoints

- **Process Payment**: `/php/maksekeskus_integration/process_payment`
  - Creates a transaction and returns a payment URL

- **Notification**: `/php/maksekeskus_integration/notification`
  - Handles payment notifications from Maksekeskus
  - Updates order status and sends email notifications

- **Success**: `/php/maksekeskus_integration/success`
  - Handles successful payments
  - Verifies the payment status

- **Cancel**: `/php/maksekeskus_integration/cancel`
  - Handles cancelled payments

## Security Considerations

1. All requests are validated using Maksekeskus's MAC verification
2. Sensitive data is not stored in the frontend
3. Environment variables are used for API keys
4. Error handling is implemented to prevent information leakage

## Testing

To test the integration:

1. Set `MAKSEKESKUS_TEST_MODE=true` in the `.env` file
2. Use test bank credentials provided by Maksekeskus
3. Complete a test payment flow

## Troubleshooting

Common issues:

1. **Payment fails to initialize**: Check API keys and shop ID
2. **Notification not received**: Verify notification URL is accessible
3. **MAC verification fails**: Ensure secret key is correct

## Future Improvements

1. Implement card payments
2. Add payment status tracking in the admin panel
3. Implement automatic order status updates
4. Add support for refunds