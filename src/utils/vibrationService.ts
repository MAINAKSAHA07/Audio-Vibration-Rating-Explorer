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
      throw new Error(`Backend health check failed: ${error}`);
    }
  }

  /**
   * Generate vibrations from an audio file using the Python algorithms
   */
  async generateVibrations(audioFile: File): Promise<VibrationGenerationResponse> {
    try {
      console.log('🎵 Starting vibration generation for file:', audioFile.name);
      console.log('📡 Backend URL:', this.baseUrl);
      
      const formData = new FormData();
      formData.append('audio_file', audioFile);

      const response = await fetch(`${this.baseUrl}${BACKEND_CONFIG.ENDPOINTS.GENERATE_VIBRATIONS}`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        body: formData,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Vibration generation successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Vibration generation failed:', error);
      throw new Error(`Vibration generation failed: ${error}`);
    }
  }

  /**
   * Download a generated vibration file
   */
  async downloadVibration(filename: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}${BACKEND_CONFIG.ENDPOINTS.DOWNLOAD}/${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.blob();
    } catch (error) {
      throw new Error(`Download failed: ${error}`);
    }
  }

  /**
   * Generate and download a vibration file on-demand without saving
   */
  async generateAndDownload(audioFile: File, algorithm: string): Promise<Blob> {
    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('algorithm', algorithm);

      const response = await fetch(`${this.baseUrl}${BACKEND_CONFIG.ENDPOINTS.GENERATE_AND_DOWNLOAD}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      throw new Error(`Generate and download failed: ${error}`);
    }
  }

  /**
   * List all generated output files
   */
  async listOutputs(): Promise<{ outputs: any[]; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}${BACKEND_CONFIG.ENDPOINTS.LIST_OUTPUTS}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to list outputs: ${error}`);
    }
  }

  /**
   * Get the download URL for a vibration file
   */
  getDownloadUrl(filename: string): string {
    return `${this.baseUrl}${BACKEND_CONFIG.ENDPOINTS.DOWNLOAD}/${filename}`;
  }

  /**
   * Check if the backend is accessible
   */
  async isBackendAvailable(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const vibrationService = new VibrationService();
export default vibrationService;
