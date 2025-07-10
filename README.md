# Leen.ee - Ceramics and Clothing Design Website

This is the source code for Leen Väränen's e-commerce website, featuring ceramics and clothing design products.

## Environment Setup

The application requires several environment variables to function properly. Create a `.env` file in the project root with the following variables:

```
VITE_SUPABASE_URL=https://epcenpirjkfkgdgxktrm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Supabase Service Role Key - Used in PHP backend
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Maksekeskus API Credentials
MAKSEKESKUS_SHOP_ID=your_shop_id
MAKSEKESKUS_PUBLIC_KEY=your_public_key
MAKSEKESKUS_PRIVATE_KEY=your_private_key
MAKSEKESKUS_TEST_MODE=false

# Omniva API Credentials
OMNIVA_CUSTOMER_CODE=your_customer_code
OMNIVA_USERNAME=your_username
OMNIVA_PASSWORD=your_password

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# SMTP Settings
SMTP_HOST=smtp.your-provider.com
SMTP_USERNAME=your_email@example.com
SMTP_PASSWORD=your_password
SMTP_PORT=587
SMTP_SECURE=tls

# Base URL for the application
APP_URL=https://leen.ee
```

## Development

To start the development server:

```bash
npm run dev
```

For PHP backend, start a PHP server in the public directory:

```bash
php -S localhost:8000 -t public
```

## Data Flow

### Frontend to Backend Communication

1. **React Frontend** - Makes API calls to:
   - Supabase directly for database operations (products, categories, etc.)
   - PHP backend for payment processing and order management

2. **PHP Backend** - Handles:
   - Payment processing via Maksekeskus
   - Order management
   - Shipping via Omniva
   - Email notifications

### Payment Flow

1. User adds products to cart and proceeds to checkout
2. Frontend collects shipping and contact information
3. Frontend sends payment request to `/php/process-payment.php`
4. PHP backend creates payment transaction via Maksekeskus API
5. User is redirected to payment provider
6. After payment, Maksekeskus sends webhook notification to `/php/payment-notification.php`
7. PHP backend processes the notification and updates order status
8. User is redirected to success page

### Shipping Flow

1. Admin views orders in admin panel
2. Admin initiates shipping via Omniva
3. PHP backend registers shipment with Omniva API
4. Tracking information is added to the order
5. Email notification with tracking info is sent to customer

## Security Considerations

- All sensitive credentials are stored in environment variables
- Supabase RLS policies control data access
- HTTPS is enforced for all connections
- API keys are never exposed to the frontend