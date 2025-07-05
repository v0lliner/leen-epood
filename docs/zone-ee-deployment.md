# Zone.ee Deployment Guide

This document provides step-by-step instructions for deploying the Leen.ee website to Zone.ee hosting.

## Prerequisites

- Zone.ee Pro hosting account (required for dedicated IP and port forwarding)
- Access to Zone.ee control panel
- FTP access to upload files
- SSH access to run commands on the server

## Deployment Steps

### 1. Build the Frontend

1. On your local development machine, run:
   ```bash
   npm run build
   ```

2. This will create a `dist` directory with the compiled frontend files.

### 2. Prepare the Backend

1. Create a directory for the Node.js application:
   ```bash
   mkdir -p node_app
   ```

2. Copy the following files to the `node_app` directory:
   - `api-server.js`
   - `package.json`
   - `.env` (with production values)

### 3. Upload Files to Zone.ee

1. Upload the contents of the `dist` directory to your domain's root directory (e.g., `/home/username/domains/leen.ee/public_html/`)

2. Upload the `node_app` directory to your domain's parent directory (e.g., `/home/username/domains/leen.ee/node_app/`)

### 4. Configure mod_proxy in Zone.ee

1. Log in to your My Zone control panel
2. Go to Webhosting → Webserver
3. Select your domain and click "Modify"
4. In the "mod_proxy backend port" field, enter `3001` (the port your Node.js app listens on)
5. Save the changes

### 5. Set Up PM2 for the Node.js App

1. In the My Zone control panel, go to Webhosting → PM2 and Node.js
2. Click "Add new application"
3. Fill in the form:
   - **Name**: `leen-api`
   - **Script or PM2 .JSON**: Enter the full path to your api-server.js file, e.g., `/home/username/domains/leen.ee/node_app/api-server.js`
   - **Environment variables**: Add all the environment variables from your `.env` file:
     ```
     VITE_SUPABASE_URL=https://epcenpirjkfkgdgxktrm.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTM4MDQsImV4cCI6MjA2NjY4OTgwNH0.lIcxjZO5BH-RV9mlKnkEmuwx4Tcg8XRMyZr2bThhYLc
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMzgwNCwiZXhwIjoyMDY2Njg5ODA0fQ.VQgOh4VmI0hmyXawVt0-uOmMFgHXkqhkMFQxBLjjQME
     MAKSEKESKUS_SHOP_ID=4e2bed9a-aa24-4b87-801b-56c31c535d36
     MAKSEKESKUS_API_SECRET_KEY=WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ
     MAKSEKESKUS_API_OPEN_KEY=wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM
     SITE_URL=https://leen.ee
     MAKSEKESKUS_TEST_MODE=false
     PORT=3001
     ```
   - **Maximum memory usage**: `512` (MB)
4. Click "Save"

### 6. Install Node.js Dependencies

1. Connect to your server via SSH
2. Navigate to the node_app directory:
   ```bash
   cd /home/username/domains/leen.ee/node_app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### 7. Update Maksekeskus Settings

1. Log in to your Maksekeskus merchant portal
2. Go to Settings → Integration
3. Update the following URLs:
   - **Return URL**: `https://leen.ee/makse/korras`
   - **Cancel URL**: `https://leen.ee/makse/katkestatud`
   - **Notification URL**: `https://leen.ee/api/maksekeskus/notification`

### 8. Test the Deployment

1. Visit your website at `https://leen.ee`
2. Test the checkout process with a test payment
3. Verify that orders are being created in the database
4. Check that payment notifications are being received and processed

## Troubleshooting

### API Endpoints Not Working

If the API endpoints are not working, check:

1. That mod_proxy is correctly configured in Zone.ee
2. That the PM2 process is running (check in the Zone.ee control panel)
3. That the Node.js app is listening on the correct port and IP address
4. That the environment variables are correctly set

### Payment Processing Issues

If payments are not being processed correctly:

1. Check the Node.js app logs for errors
2. Verify that the Maksekeskus API credentials are correct
3. Ensure the notification URL is accessible from the internet
4. Test with a different payment method

### Image Loading Issues

If images are not loading:

1. Check that the Supabase storage bucket is public
2. Verify that the RLS policies are correctly configured
3. Check for CORS issues in the browser console

## Maintenance

### Updating the Website

To update the website:

1. Make changes to the code locally
2. Run `npm run build` to create a new build
3. Upload the new build files to the server
4. If backend changes were made, update the `api-server.js` file and restart the PM2 process

### Monitoring

Monitor the application using:

1. Zone.ee PM2 dashboard for Node.js app status
2. Server logs for API errors
3. Supabase dashboard for database operations
4. Maksekeskus merchant portal for payment transactions

## Security Considerations

1. Always use HTTPS for all communications
2. Keep API keys and credentials secure
3. Regularly update dependencies
4. Monitor for suspicious activities
5. Implement proper error handling and logging