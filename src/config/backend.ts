/**
 * Backend Configuration
 * Centralized configuration for API endpoints
 * 
 * Setup:
 * - Frontend (React): localhost:3000 (dev) → Netlify (prod)
 * - Backend (Flask): EC2 instance at 3.144.145.168:5001 (dev & prod)
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
  // Automatically detect environment and use appropriate backend URL
  BASE_URL: process.env.REACT_APP_BACKEND_URL || (() => {
    // Check if we're in production (Netlify) or development
    if (typeof window !== 'undefined') {
      const isProduction = window.location.hostname !== 'localhost' && 
                          !window.location.hostname.includes('127.0.0.1') &&
                          !window.location.hostname.includes('127.0.0.1:3000');
      
      if (isProduction) {
        // Production: Use EC2 backend directly
        console.log('🌐 Production environment detected - using EC2 backend');
        return 'http://3.144.145.168:5000';
      } else {
        // Development: Use local backend
        console.log('🏠 Development environment detected - using local backend');
        return 'http://localhost:5000';
      }
    }
    
    // Fallback for server-side rendering
    return 'http://localhost:5000';
  })(),
  
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