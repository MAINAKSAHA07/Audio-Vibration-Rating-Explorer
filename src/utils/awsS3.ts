// AWS S3 utility for fetching audio files
export interface AWSS3Config {
  bucketName: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export class AWSS3Service {
  private bucketName: string;
  private region: string;
  private baseUrl: string;

  constructor(config: AWSS3Config) {
    this.bucketName = config.bucketName;
    this.region = config.region;
    this.baseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
    
    console.log(`AWS S3 Service initialized with bucket: ${this.bucketName}, region: ${this.region}`);
    console.log(`Base URL: ${this.baseUrl}`);
  }

  /**
   * Get the full S3 URL for an audio file
   */
  getAudioUrl(filename: string): string {
    return `${this.baseUrl}/audio/${filename}`;
  }

  /**
   * Get the full S3 URL for a vibration file
   */
  getVibrationUrl(filename: string): string {
    return `${this.baseUrl}/vibration/${filename}`;
  }

  /**
   * Check if a file exists in S3
   */
  async fileExists(url: string): Promise<boolean> {
    try {
      console.log(`Checking if file exists: ${url}`);
      const response = await fetch(url, { method: 'HEAD' });
      const exists = response.ok;
      console.log(`File ${exists ? 'exists' : 'not found'} in S3: ${url}`);
      return exists;
    } catch (error) {
      console.warn(`Error checking file in S3: ${url}`, error);
      return false;
    }
  }

  /**
   * Get audio file with fallback to local
   */
  async getAudioFileWithFallback(filename: string): Promise<string> {
    const s3Url = this.getAudioUrl(filename);
    console.log(`Attempting to load audio from S3: ${s3Url}`);
    
    // Try S3 first
    if (await this.fileExists(s3Url)) {
      console.log(`✅ Successfully loaded audio from S3: ${filename}`);
      return s3Url;
    }
    
    // Fallback to local
    console.log(`🔄 Falling back to local audio: ${filename}`);
    return `/audio/${filename}`;
  }

  /**
   * Get vibration file with fallback to local
   */
  async getVibrationFileWithFallback(filename: string): Promise<string> {
    const s3Url = this.getVibrationUrl(filename);
    console.log(`Attempting to load vibration from S3: ${s3Url}`);
    
    // Try S3 first
    if (await this.fileExists(s3Url)) {
      console.log(`✅ Successfully loaded vibration from S3: ${filename}`);
      return s3Url;
    }
    
    // Fallback to local
    console.log(`🔄 Falling back to local vibration: ${filename}`);
    return `/vibration/${filename}`;
  }

  /**
   * Preload multiple audio files
   */
  async preloadAudioFiles(filenames: string[]): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();
    
    const promises = filenames.map(async (filename) => {
      const url = await this.getAudioFileWithFallback(filename);
      urlMap.set(filename, url);
    });
    
    await Promise.all(promises);
    return urlMap;
  }

  /**
   * Preload multiple vibration files
   */
  async preloadVibrationFiles(filenames: string[]): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();
    
    const promises = filenames.map(async (filename) => {
      const url = await this.getVibrationFileWithFallback(filename);
      urlMap.set(filename, url);
    });
    
    await Promise.all(promises);
    return urlMap;
  }
}

// Environment-based configuration
export const getAWSS3Config = (): AWSS3Config => {
  const config = {
    bucketName: process.env.REACT_APP_AWS_BUCKET_NAME || 'aduiovibrations',
    region: process.env.REACT_APP_AWS_REGION || 'us-east-2',
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  };
  
  console.log('AWS S3 Config loaded:', {
    bucketName: config.bucketName,
    region: config.region,
    hasAccessKey: !!config.accessKeyId,
    hasSecretKey: !!config.secretAccessKey
  });
  
  return config;
};

// Create service instance with current configuration
export const getAWSS3Service = (): AWSS3Service => {
  const config = getAWSS3Config();
  return new AWSS3Service(config);
};

// Legacy export for backward compatibility
export const awsS3Service = getAWSS3Service();
