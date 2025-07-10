# Security Documentation

This document outlines the security measures implemented in the Leen.ee application.

## Credentials Management

All sensitive credentials are stored in environment variables and accessed securely:

1. **Frontend Environment Variables**
   - `VITE_SUPABASE_URL` - Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
   - `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key (restricted to specific domains)

2. **Backend Environment Variables**
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (private)
   - `MAKSEKESKUS_SHOP_ID` - Maksekeskus shop ID
   - `MAKSEKESKUS_PUBLIC_KEY` - Maksekeskus public key
   - `MAKSEKESKUS_PRIVATE_KEY` - Maksekeskus private key
   - `OMNIVA_CUSTOMER_CODE` - Omniva customer code
   - `OMNIVA_USERNAME` - Omniva username
   - `OMNIVA_PASSWORD` - Omniva password
   - `SMTP_USERNAME` - SMTP username for email sending
   - `SMTP_PASSWORD` - SMTP password

## Data Access Control

### Supabase Row Level Security (RLS)

The application uses Supabase's Row Level Security to control data access:

1. **Public Access**
   - Products: Read-only access to available products
   - Categories: Read-only access to active categories
   - Portfolio items: Read-only access to all items
   - FAQ items: Read-only access to active items

2. **Authenticated Access**
   - Admin users can create, read, update, and delete all data
   - Order management is restricted to admin users

### API Security

1. **Supabase API**
   - Frontend uses anonymous key with limited permissions
   - Backend PHP uses service role key for administrative operations
   - All API requests are authenticated

2. **Maksekeskus API**
   - Payment processing uses server-side API calls
   - MAC signatures verify webhook authenticity
   - All payment data is transmitted securely

3. **Omniva API**
   - Shipping operations are performed server-side
   - Credentials are never exposed to the frontend

## Communication Security

1. **HTTPS**
   - All communication is encrypted using HTTPS
   - Content Security Policy (CSP) is implemented in .htaccess

2. **Form Submissions**
   - All form data is validated server-side
   - CSRF protection is implemented for sensitive operations

3. **Payment Processing**
   - Payment data is never stored on our servers
   - All payment processing is handled by Maksekeskus
   - PCI compliance is maintained by using Maksekeskus for all card processing

## Server Security

1. **PHP Configuration**
   - Error reporting is disabled in production
   - Sensitive error messages are not displayed to users
   - Input validation is performed on all user inputs

2. **File System**
   - Sensitive files are protected from direct access
   - Uploaded files are stored securely in Supabase Storage
   - File types and sizes are validated before upload

## Monitoring and Logging

1. **Error Logging**
   - All errors are logged to files in the `/logs` directory
   - Sensitive information is redacted from logs

2. **Activity Monitoring**
   - Admin actions are logged for audit purposes
   - Payment and shipping events are recorded

## Incident Response

In case of a security incident:

1. Immediately revoke compromised credentials
2. Rotate all API keys
3. Notify affected users if personal data was compromised
4. Document the incident and implement measures to prevent recurrence