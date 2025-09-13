/**
 * Vibration Service - Communicates with Python backend for vibration generation
 */
import { BACKEND_CONFIG } from '../config/backend';

export interface VibrationResult {
  filename: string;
  path: string;
  size: number;
}

export interface VibrationGenerationResponse {
  success: boolean;
  message: string;
  original_file: string;
  results: {
    freqshift?: VibrationResult | { error: string };
    hapticgen?: VibrationResult | { error: string };
    percept?: VibrationResult | { error: string };
    pitch?: VibrationResult | { error: string };
    model1?: VibrationResult | { error: string };
    model2?: VibrationResult | { error: string };
  };
}

export interface BackendHealth {
  status: string;
  algorithms: string[];
  message: string;
}

class VibrationService {
  private baseUrl: string;

  constructor() {
    // Use centralized backend configuration
    this.baseUrl = BACKEND_CONFIG.BASE_URL;
    
    // Check if we're in a secure context (HTTPS)
    if (window.isSecureContext && this.baseUrl.startsWith('http://')) {
      console.warn('⚠️ Mixed content warning: HTTPS site trying to access HTTP backend');
      console.warn('Backend URL:', this.baseUrl);
      console.warn('🔧 To fix this:');
      console.warn('1. Click the shield icon in your browser address bar');
      console.warn('2. Select "Load unsafe scripts" or "Proceed to site"');
      console.warn('3. Or use Chrome with --disable-web-security flag for testing');
      console.warn('4. Or start your React app with: npm start -- --disable-web-security');
    }
  }

  /**
   * Check if the backend service is healthy
   */
  async checkHealth(): Promise<BackendHealth> {
    try {
      const response = await fetch(`${this.baseUrl}${BACKEND_CONFIG.ENDPOINTS.HEALTH}`, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Backend health check failed:', error);
      
      // Check if it's a mixed content error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (window.isSecureContext && this.baseUrl.startsWith('http://')) {
          const mixedContentError = new Error(`Mixed content blocked: HTTPS site cannot access HTTP backend. Please allow mixed content in your browser or use HTTPS for the backend.`);
          (mixedContentError as any).isMixedContentError = true;
          (mixedContentError as any).solutions = [
            'Click the shield icon in your browser address bar and select "Load unsafe scripts"',
            'Use Chrome with --disable-web-security flag for testing',
            'Start React with: npm start -- --disable-web-security',
            'Configure your EC2 backend to use HTTPS'
          ];
          throw mixedContentError;
        }
      }
      
      throw new Error(`Backend health check failed: ${error}`);
    }
  }

  /**
   * Generate vibrations from an audio file using the Python algorithms
   */
  async generateVibrations(audioFile: File): Promise<VibrationGenerationResponse> {
    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);

      const response = await fetch(`${this.baseUrl}${BACKEND_CONFIG.ENDPOINTS.GENERATE_VIBRATIONS}`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Vibration generation failed:', error);
      
      // Check if it's a mixed content error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (window.isSecureContext && this.baseUrl.startsWith('http://')) {
          const mixedContentError = new Error(`Mixed content blocked: HTTPS site cannot access HTTP backend. Please allow mixed content in your browser.`);
          (mixedContentError as any).isMixedContentError = true;
          (mixedContentError as any).solutions = [
            'Click the shield icon in your browser address bar and select "Load unsafe scripts"',
            'Use Chrome with --disable-web-security flag for testing',
            'Start React with: npm start -- --disable-web-security'
          ];
          throw mixedContentError;
        }
      }
      
      throw new Error(`Vibration generation failed: ${error}`);
    }
  }

  /**
   * Generate and download a vibration file directly
   */
  async generateAndDownload(audioFile: File, algorithm: string, timeoutMs: number = 35000): Promise<Blob> {
    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('algorithm', algorithm);

      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${this.baseUrl}${BACKEND_CONFIG.ENDPOINTS.GENERATE_AND_DOWNLOAD}`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 408) {
          throw new Error(`Request timed out. The ${algorithm} algorithm is taking too long. Please try with a shorter audio file or use a different algorithm.`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Generate and download failed:', error);
      
      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs/1000} seconds. The ${algorithm} algorithm is taking too long. Please try with a shorter audio file or use a different algorithm.`);
      }
      
      // Check if it's a mixed content error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (window.isSecureContext && this.baseUrl.startsWith('http://')) {
          const mixedContentError = new Error(`Mixed content blocked: HTTPS site cannot access HTTP backend. Please allow mixed content in your browser.`);
          (mixedContentError as any).isMixedContentError = true;
          (mixedContentError as any).solutions = [
            'Click the shield icon in your browser address bar and select "Load unsafe scripts"',
            'Use Chrome with --disable-web-security flag for testing',
            'Start React with: npm start -- --disable-web-security'
          ];
          throw mixedContentError;
        }
      }
      
      throw new Error(`Generate and download failed: ${error}`);
    }
  }

  /**
   * Download a previously generated vibration file
   */
  async downloadFile(filename: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}${BACKEND_CONFIG.ENDPOINTS.DOWNLOAD}/${filename}`, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('File download failed:', error);
      
      // Check if it's a mixed content error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (window.isSecureContext && this.baseUrl.startsWith('http://')) {
          const mixedContentError = new Error(`Mixed content blocked: HTTPS site cannot access HTTP backend. Please allow mixed content in your browser.`);
          (mixedContentError as any).isMixedContentError = true;
          (mixedContentError as any).solutions = [
            'Click the shield icon in your browser address bar and select "Load unsafe scripts"',
            'Use Chrome with --disable-web-security flag for testing',
            'Start React with: npm start -- --disable-web-security'
          ];
          throw mixedContentError;
        }
      }
      
      throw new Error(`File download failed: ${error}`);
    }
  }

  /**
   * Alias for downloadFile - Download a previously generated vibration file
   */
  async downloadVibration(filename: string): Promise<Blob> {
    return this.downloadFile(filename);
  }

  /**
   * List all generated output files
   */
  async listOutputs(): Promise<{ outputs: any[]; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}${BACKEND_CONFIG.ENDPOINTS.LIST_OUTPUTS}`, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List outputs failed:', error);
      
      // Check if it's a mixed content error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (window.isSecureContext && this.baseUrl.startsWith('http://')) {
          const mixedContentError = new Error(`Mixed content blocked: HTTPS site cannot access HTTP backend. Please allow mixed content in your browser.`);
          (mixedContentError as any).isMixedContentError = true;
          (mixedContentError as any).solutions = [
            'Click the shield icon in your browser address bar and select "Load unsafe scripts"',
            'Use Chrome with --disable-web-security flag for testing',
            'Start React with: npm start -- --disable-web-security'
          ];
          throw mixedContentError;
        }
      }
      
      throw new Error(`List outputs failed: ${error}`);
    }
  }
}

// Export singleton instance
export const vibrationService = new VibrationService();
export default vibrationService;