# Leen.ee - Keraamika ja Rõivadisain

This is the official website for Leen Väränen's ceramics and clothing design business.

## Development Setup

This project requires both a Vite development server (for the React frontend) and a PHP server (for backend functionality).

### Prerequisites

- Node.js (v16 or higher)
- PHP (v7.4 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Running the Development Server

You have two options to run the development environment:

#### Option 1: Run both servers with one command (Recommended)
```bash
npm run dev:full
```

This will start both the PHP server (on port 8000) and the Vite dev server (on port 5173) simultaneously.

#### Option 2: Run servers separately

In one terminal, start the PHP server:
```bash
npm run php-server
```

In another terminal, start the Vite dev server:
```bash
npm run dev
```

### Important Notes

- The PHP server must be running on `localhost:8000` for the contact form and other backend features to work
- The Vite dev server runs on `localhost:5173` and proxies PHP requests to the PHP server
- Both servers need to be running for full functionality

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

- `src/` - React frontend application
- `public/php/` - PHP backend scripts
- `supabase/` - Database migrations and configuration
- `translations/` - Internationalization files

## Features

- Multilingual support (Estonian/English)
- Product catalog with shopping cart
- Contact form
- Admin panel for content management
- Payment integration with Maksekeskus
- Responsive design

## Deployment

The project is configured for deployment on Zone.ee hosting. See `docs/zone-ee-deployment.md` for detailed deployment instructions.