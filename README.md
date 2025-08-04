# Leen Portfolio and E-Shop

This is a React-based portfolio and e-shop website for Leen Väränen, a ceramicist and clothing designer.

## Features

- Responsive design for all devices
- Multi-language support (Estonian and English)
- Product catalog with filtering and sorting
- Shopping cart functionality
- Portfolio/gallery section
- Contact form
- Admin dashboard for content management
- Integration with Supabase for data storage and authentication

## Tech Stack

- React 18
- Vite
- React Router
- i18next for translations
- Supabase for backend and authentication

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Environment Variables

This project uses environment variables for configuration. You need to set the following environment variables in your shell before starting the development server:

```bash
# Supabase Configuration
export VITE_SUPABASE_URL=https://your-project-id.supabase.co
export VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Maps API Key (for Contact page)
export VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

## Deployment

The project can be deployed to any static hosting service like Netlify, Vercel, or GitHub Pages.

### Netlify Deployment

1. Push your code to a Git repository
2. Connect your repository to Netlify
3. Set the build command to `npm run build`
4. Set the publish directory to `dist`
5. Add the required environment variables in the Netlify dashboard

## Project Structure

- `src/` - Source code
  - `components/` - React components
  - `context/` - React context providers
  - `hooks/` - Custom React hooks
  - `pages/` - Page components
  - `styles/` - Global styles
  - `utils/` - Utility functions
  - `i18n/` - Internationalization setup
- `public/` - Static assets
- `translations/` - Translation files

## License

This project is proprietary and not open for redistribution or use without explicit permission.

## Contact

For any inquiries, please contact Leen Väränen at leen@leen.ee.

---
*This is a test change for verification purposes.*
