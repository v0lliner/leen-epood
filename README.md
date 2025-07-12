# Leen.ee E-commerce Website

This is the source code for the Leen.ee e-commerce website.

## Environment Variables

This project uses direct environment variables instead of a `.env` file. For production deployment, set the following environment variables in your hosting environment:

```
SUPABASE_URL=https://epcenpirjkfkgdgxktrm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_URL=https://epcenpirjkfkgdgxktrm.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
MAKSEKESKUS_TEST_MODE=true  # Set to false for production
MAKSEKESKUS_TEST_SHOP_ID=f7741ab2-7445-45f9-9af4-0d0408ef1e4c
MAKSEKESKUS_TEST_PUBLISHABLE_KEY=zPA6jCTIvGKYqrXxlgkXLzv3F82Mjv2E
MAKSEKESKUS_TEST_SECRET_KEY=pfOsGD9oPaFEILwqFLHEHkPf7vZz4j3t36nAcufP1abqT9l99koyuC1IWAOcBeqt
MAKSEKESKUS_LIVE_SHOP_ID=4e2bed9a-aa24-4b87-801b-56c31c535d36
MAKSEKESKUS_LIVE_PUBLISHABLE_KEY=wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM
MAKSEKESKUS_LIVE_SECRET_KEY=WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ
```

### For Local Development

For local development, you can set these variables in your shell before starting the development server:

```bash
# Bash/Zsh
export SUPABASE_URL=https://epcenpirjkfkgdgxktrm.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
# ... and so on for all variables

# Then start the development server
npm run dev
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deployment

The project is built using Vite and can be deployed to any static hosting service. The PHP backend requires a PHP-enabled server.

## Features

- Product catalog with categories and filtering
- Shopping cart functionality
- Checkout with Maksekeskus payment integration
- Admin panel for managing products, orders, and content
- Multilingual support (Estonian and English)
- Responsive design for all devices