export const AWS_CONFIG = {
    // S3 Bucket Configuration
    S3: {
      BUCKET_NAME: process.env.REACT_APP_AWS_BUCKET_NAME || 'aduiovibrations',
      REGION: process.env.REACT_APP_AWS_REGION || 'us-east-2',
      ACCESS_KEY_ID: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      SECRET_ACCESS_KEY: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    },
    
    // CloudFront Configuration (optional, for better performance)
    CLOUDFRONT: {
      DISTRIBUTION_DOMAIN: process.env.REACT_APP_CLOUDFRONT_DOMAIN,
      ENABLED: !!process.env.REACT_APP_CLOUDFRONT_DOMAIN,
    },
    
    // Feature flags
    FEATURES: {
      AWS_ENABLED: process.env.REACT_APP_AWS_ENABLED === 'true',
      FALLBACK_TO_LOCAL: process.env.REACT_APP_FALLBACK_TO_LOCAL !== 'false',
      PRELOAD_AUDIO: process.env.REACT_APP_PRELOAD_AUDIO === 'true',
    }
  };
  
  export const getAudioBaseUrl = (): string => {
    if (AWS_CONFIG.FEATURES.AWS_ENABLED) {
      if (AWS_CONFIG.CLOUDFRONT.ENABLED) {
        return `https://${AWS_CONFIG.CLOUDFRONT.DISTRIBUTION_DOMAIN}`;
      }
      return `https://${AWS_CONFIG.S3.BUCKET_NAME}.s3.${AWS_CONFIG.S3.REGION}.amazonaws.com`;
    }
    return '';
  };
  
  export const getVibrationBaseUrl = (): string => {
    return getAudioBaseUrl();
  };