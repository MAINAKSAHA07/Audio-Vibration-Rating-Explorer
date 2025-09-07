/**
 * Backend Configuration
 * Centralized configuration for API endpoints
 * 
 * Setup:
 * - Frontend (React): localhost:3000 (dev) → Netlify (prod)
 * - Backend (Flask): EC2 instance at 3.138.192.243:5000 (dev & prod)
 */

// Frontend Configuration
export const FRONTEND_CONFIG = {
  // Development frontend runs on port 3000
  DEV_PORT: 3000,
  DEV_URL: 'http://localhost:3000',
  
  // Production frontend is deployed on Netlify
  PROD_URL: 'https://audiovibration.netlify.app'
};

export const BACKEND_CONFIG = {
  // Backend URL configuration
  // Development: Direct access to EC2 backend
  // Production: Use Netlify proxy to avoid mixed content issues
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? '/api'  // Use Netlify proxy in production
    : (process.env.REACT_APP_BACKEND_URL || 'http://3.138.192.243:5000'),
  
  // API Endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    GENERATE_VIBRATIONS: '/generate-vibrations',
    GENERATE_AND_DOWNLOAD: '/generate-and-download',
    DOWNLOAD: '/download',
    LIST_OUTPUTS: '/list-outputs'
  },
  
  // Request Configuration
  TIMEOUT: 30000, // 30 seconds
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Retry Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000 // 1 second
};

export default BACKEND_CONFIG;