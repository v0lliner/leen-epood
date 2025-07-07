# Leen.ee Website

## Omniva Integration Setup for zone.ee

### Configuration

1. **Environment Variables**
   - For security, set the following environment variables in zone.ee control panel:
     - `OMNIVA_CUSTOMER_CODE`: Your Omniva customer code
     - `OMNIVA_USERNAME`: Your Omniva API username
     - `OMNIVA_PASSWORD`: Your Omniva API password
     - `SUPABASE_SERVICE_KEY`: Your Supabase service role key

2. **Cron Job Setup**
   - Set up a cron job to update the Omniva parcel machine locations cache:
   ```
   0 3 * * * php /path/to/your/public/php/update-omniva-locations.php
   ```
   - This will run daily at 3 AM to keep the parcel machine data up-to-date

3. **File Permissions**
   - Ensure these files are writable by the web server:
     - `public/php/omniva_locations_cache.json`
     - `public/php/omniva_shipment_log.txt`
     - `public/php/omniva_error.log`

### Troubleshooting

- Check the log files in the `public/php/` directory for errors
- Verify that the cache file is being updated by the cron job
- Test the API endpoints directly to ensure they're accessible

## Omniva Integration for zone.ee

This project includes integration with Omniva parcel machines for shipping. The integration is configured to work on zone.ee hosting.

### Setup Instructions for zone.ee

1. **Environment Variables**
   
   Set the following environment variables in zone.ee control panel or uncomment them in `.htaccess`:
   
   ```
   OMNIVA_CUSTOMER_CODE=247723
   OMNIVA_USERNAME=247723
   OMNIVA_PASSWORD=Ddg(8?e:$A
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMzgwNCwiZXhwIjoyMDY2Njg5ODA0fQ.VQgOh4VmI0hmyXawVt0-uOmMFgHXkqhkMFQxBLjjQME
   ```

2. **Cron Job for Parcel Machine Data**
   
   Set up a cron job to update the Omniva parcel machine data daily:
   
   ```
   0 3 * * * php /path/to/your/public/php/update-omniva-locations.php
   ```

3. **File Permissions**
   
   Ensure the following files and directories have proper permissions:
   
   ```
   chmod 666 /path/to/your/public/php/omniva_locations_cache.json
   chmod 666 /path/to/your/public/php/omniva_shipment_log.txt
   chmod 666 /path/to/your/public/php/omniva_error.log
   chmod 666 /path/to/your/public/php/omniva_parcel_machines_log.txt
   ```

4. **Troubleshooting**
   
   If you encounter issues with the Omniva integration, check the following log files:
   
   - `/path/to/your/public/php/omniva_shipment_log.txt` - Shipment registration logs
   - `/path/to/your/public/php/omniva_parcel_machines_log.txt` - Parcel machine fetching logs
   - `/path/to/your/public/php/omniva_error.log` - PHP errors
   - `/path/to/your/public/php/omniva_cron_log.txt` - Cron job logs

## Development

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh