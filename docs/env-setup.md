# Environment Setup Guide

This guide explains how to set up the environment variables required for the Leen.ee application.

## Environment Variables

The application requires several environment variables to function properly. These should be stored in a `.env` file in the project root.

### Required Environment Variables

```
# Supabase Configuration
VITE_SUPABASE_URL=https://epcenpirjkfkgdgxktrm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
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

## Setting Up Environment Variables

### Local Development

1. Create a `.env` file in the project root
2. Copy the template above and fill in your actual credentials
3. Make sure the `.env` file is included in `.gitignore` to prevent it from being committed

### Production Environment

For production, set the environment variables according to your hosting provider's instructions:

#### Zone.ee

Add environment variables in the Zone.ee control panel:

1. Go to your Zone.ee control panel
2. Navigate to the environment variables section
3. Add each variable with its corresponding value

#### Apache Server

If using Apache, you can set environment variables in your `.htaccess` file:

```apache
SetEnv VITE_SUPABASE_URL https://epcenpirjkfkgdgxktrm.supabase.co
SetEnv VITE_SUPABASE_ANON_KEY your_anon_key
# Add all other environment variables
```

## Accessing Environment Variables

### In JavaScript (Frontend)

Environment variables prefixed with `VITE_` are accessible in the frontend:

```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### In PHP (Backend)

Environment variables are accessed using the `getenv()` function:

```php
$supabaseKey = getenv('SUPABASE_SERVICE_ROLE_KEY');
$shopId = getenv('MAKSEKESKUS_SHOP_ID');
```

The application includes an environment variable loader (`env-loader.php`) that attempts to load variables from the `.env` file if they're not already set in the environment.

## Security Considerations

- Never commit your `.env` file to version control
- Use different credentials for development and production
- Regularly rotate API keys and passwords
- Restrict API keys to only the necessary permissions
- Use environment-specific `.env` files (`.env.development`, `.env.production`) for different environments