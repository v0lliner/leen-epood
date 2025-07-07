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

## Development

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh