# Leen Premium E-pood

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- PHP (v7.4 or higher)
- Supabase account

### Running the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the PHP server:**
   ```bash
   php -S localhost:8000 -t public
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - PHP API: http://localhost:8000

### Important Notes

- The PHP server must be running on port 8000 for the admin dashboard to work properly
- Make sure both servers are running simultaneously during development
- The frontend makes API calls to the PHP server for order statistics and other backend functionality

### Environment Variables

Create a `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```