# Development Setup Guide

## Prerequisites

Before starting development, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **PHP** (v7.4 or higher) - [Download here](https://www.php.net/downloads)
- **npm** (comes with Node.js) or **yarn**

## Quick Start

1. **Clone the repository and install dependencies:**
```bash
git clone <repository-url>
cd leen-ee
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your Supabase configuration
```

3. **Start the development servers:**
```bash
npm run dev:full
```

This command starts both the PHP backend server and the Vite frontend server simultaneously.

## Development Servers

### Why Two Servers?

This project uses a hybrid architecture:
- **Vite dev server** (port 5173) - Serves the React frontend
- **PHP dev server** (port 8000) - Handles backend API requests

The Vite server proxies certain requests (like `/php/*`) to the PHP server.

### Server Commands

| Command | Description |
|---------|-------------|
| `npm run dev:full` | Start both servers (recommended) |
| `npm run dev` | Start only Vite dev server |
| `npm run php-server` | Start only PHP server |

### Manual Server Setup

If you prefer to run servers separately:

**Terminal 1 - PHP Server:**
```bash
npm run php-server
# or directly: php -S localhost:8000 -t public
```

**Terminal 2 - Vite Server:**
```bash
npm run dev
```

## Troubleshooting

### Common Issues

**1. "connect ECONNREFUSED 127.0.0.1:8000"**
- **Cause:** PHP server is not running
- **Solution:** Start the PHP server with `npm run php-server`

**2. "Unexpected end of JSON input" in contact form**
- **Cause:** PHP server is not responding or returning invalid JSON
- **Solution:** Ensure PHP server is running and check PHP error logs

**3. Contact form not working**
- **Cause:** PHP mail function not configured
- **Solution:** Configure PHP mail settings or use a local mail server for testing

### Checking Server Status

**Verify PHP server is running:**
```bash
curl http://localhost:8000/php/mailer.php
```

**Verify Vite server is running:**
```bash
curl http://localhost:5173
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### PHP Configuration

The PHP scripts in `public/php/` handle:
- Contact form submissions (`mailer.php`)
- Payment processing (`process-payment.php`)
- Admin order management (`admin/orders.php`)
- Payment notifications (`payment-notification.php`)

## Database Setup

This project uses Supabase as the database. Migrations are located in `supabase/migrations/`.

To apply migrations:
1. Set up a Supabase project
2. Configure the connection in `.env`
3. Run migrations through the Supabase dashboard or CLI

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory, ready for deployment.

## Development Workflow

1. Start development servers: `npm run dev:full`
2. Open browser to `http://localhost:5173`
3. Make changes to React components in `src/`
4. Make changes to PHP scripts in `public/php/`
5. Both servers support hot reloading for efficient development

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://reactjs.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [PHP Documentation](https://www.php.net/docs.php)