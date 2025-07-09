import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/debug.js');
}

// Function to detect slow connections
const isSlowConnection = () => {
  const connection = navigator.connection || 
                    navigator.mozConnection || 
                    navigator.webkitConnection;
  
  if (connection) {
    // Check if the connection is slow (2G or saveData is true)
    return connection.effectiveType === '2g' || 
           connection.effectiveType === 'slow-2g' || 
           connection.saveData === true;
  }
  
  return false;
};

// Set data attribute for slow connections to enable CSS optimizations
if (isSlowConnection()) {
  document.documentElement.setAttribute('data-slow-connection', 'true');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)