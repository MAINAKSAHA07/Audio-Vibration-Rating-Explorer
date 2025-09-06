/**
 * Vibration Service - Communicates with Python backend for vibration generation
 */

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
    // Default to localhost:5000, can be configured via environment variables
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
  }

  /**
   * Check if the backend service is healthy
   */
  async checkHealth(): Promise<BackendHealth> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
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

      const response = await fetch(`${this.baseUrl}/generate-vibrations`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Vibration generation failed: ${error}`);
    }
  }

  /**
   * Download a generated vibration file
   */
  async downloadVibration(filename: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/download/${filename}`);
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

      const response = await fetch(`${this.baseUrl}/generate-and-download`, {
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
      const response = await fetch(`${this.baseUrl}/list-outputs`);
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
    return `${this.baseUrl}/download/${filename}`;
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
