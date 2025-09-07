/**
 * Test Backend Configuration
 * Configuration for testing with AWS EC2 backend
 */

export const BACKEND_CONFIG_TEST = {
  // AWS EC2 Backend URL
  BASE_URL: 'http://3.138.192.243:5000',
  
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

export default BACKEND_CONFIG_TEST;
