/**
 * Test Backend Configuration
 * Use this for immediate testing with your current EC2 setup
 */

export const BACKEND_CONFIG_TEST = {
  // For immediate testing - use your working EC2 backend
  BASE_URL: 'http://3.144.145.168:5000',
  
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
