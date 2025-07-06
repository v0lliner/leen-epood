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

### 2. Upload Files to Zone.ee

1. Upload the contents of the `dist` directory to your domain's root directory (e.g., `/home/username/domains/leen.ee/public_html/`)

### 3. Test the Deployment

1. Visit your website at `https://leen.ee`
2. Test the checkout process with a test payment
3. Verify that the site is working correctly

## Troubleshooting

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

### Monitoring

Monitor the application using:

1. Server logs for errors
2. Supabase dashboard for database operations

## Security Considerations

1. Always use HTTPS for all communications
2. Keep API keys and credentials secure
3. Regularly update dependencies
4. Monitor for suspicious activities
5. Implement proper error handling and logging