# Data Flow Documentation

This document outlines the data flow between different components of the Leen.ee application.

## Overview

The application consists of:

1. **React Frontend** - Client-side application
2. **Supabase** - Database and authentication
3. **PHP Backend** - Server-side processing for payments, shipping, and emails
4. **Third-party Services** - Maksekeskus (payments) and Omniva (shipping)

## Frontend to Supabase Flow

### Authentication
1. User enters credentials in login form
2. Frontend sends credentials to Supabase Auth API
3. Supabase validates credentials and returns JWT token
4. Frontend stores token in local storage
5. Subsequent requests include the token in Authorization header

### Data Fetching
1. Frontend makes requests to Supabase REST API
2. Requests are authenticated with JWT token
3. Supabase RLS policies determine data access
4. Data is returned to frontend for display

### Data Mutations
1. Frontend sends data changes to Supabase REST API
2. Supabase validates permissions using RLS policies
3. Data is updated in the database
4. Changes are reflected in the UI

## Frontend to PHP Backend Flow

### Payment Processing
1. User completes checkout form
2. Frontend collects shipping and contact information
3. Frontend sends payment request to `/php/process-payment.php`
4. PHP backend creates payment transaction via Maksekeskus API
5. Backend returns payment URL to frontend
6. Frontend redirects user to payment provider

### Order Management
1. Admin views orders in admin panel
2. Frontend requests order data from `/php/admin/orders.php`
3. PHP backend fetches order data from Supabase
4. Frontend displays order information
5. Admin actions (update status, etc.) are sent to PHP backend
6. PHP backend updates order data in Supabase

## Maksekeskus Integration Flow

### Payment Initiation
1. PHP backend creates transaction in Maksekeskus
2. Maksekeskus returns payment URL
3. User is redirected to payment URL
4. User completes payment on Maksekeskus platform

### Payment Notification
1. Maksekeskus sends webhook notification to `/php/payment-notification.php`
2. PHP backend verifies MAC signature
3. PHP backend fetches transaction details from Maksekeskus
4. PHP backend updates order status in Supabase
5. PHP backend sends confirmation email to customer

## Omniva Integration Flow

### Shipment Registration
1. Admin initiates shipping via admin panel
2. Frontend sends request to `/php/register-omniva-shipment.php`
3. PHP backend registers shipment with Omniva API
4. Omniva returns tracking number
5. PHP backend updates order with tracking information
6. PHP backend generates shipping label
7. PHP backend sends notification email with tracking info

## Email Communication Flow

### Order Confirmation
1. After successful payment, PHP backend prepares email content
2. PHP backend sends email via SMTP
3. Customer receives order confirmation email

### Shipping Notification
1. After shipment registration, PHP backend prepares email content
2. PHP backend sends email via SMTP
3. Customer receives shipping notification with tracking info

### Contact Form
1. User submits contact form on website
2. Frontend sends form data to `/php/mailer.php`
3. PHP backend validates form data
4. PHP backend sends email via SMTP
5. Admin receives notification email

## Data Storage

### Supabase Database
- Products, categories, portfolio items
- Orders and order items
- Customer information
- Content (FAQ, About page, Homepage)

### File Storage
- Product images stored in Supabase Storage
- Shipping labels stored in `/pdf_labels` directory

## Error Handling and Logging

### Frontend Errors
1. Errors are caught and displayed to user
2. Critical errors are logged to console

### Backend Errors
1. Errors are caught and logged to files in `/logs` directory
2. User-friendly error messages are returned to frontend
3. Sensitive error details are not exposed to users