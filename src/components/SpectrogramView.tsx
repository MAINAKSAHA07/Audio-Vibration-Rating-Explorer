import React, { useRef, useEffect, useState } from 'react';
import { AudioMotionAnalyzer } from 'audiomotion-analyzer';

interface SpectrogramViewProps {
  audioUrl: string;
  title: string;
  width?: number;
  height?: number;
}

const SpectrogramView: React.FC<SpectrogramViewProps> = ({ 
  audioUrl, 
  title, 
  width = 400, 
  height = 200 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spectrogramData, setSpectrogramData] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cooley-Tukey FFT implementation
  const performFFT = (data: Float32Array): Float32Array => {
    const n = data.length;
    if (n <= 1) return data;

    // Check if n is a power of 2
    if ((n & (n - 1)) !== 0) {
      throw new Error('FFT requires power of 2 length');
    }

    // Bit-reversal permutation
    const reversed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let reversedIndex = 0;
      let temp = i;
      for (let j = 0; j < Math.log2(n); j++) {
        reversedIndex = (reversedIndex << 1) | (temp & 1);
        temp >>= 1;
      }
      reversed[i] = data[reversedIndex];
    }

    // FFT computation
    const result = new Float32Array(n * 2); // Complex numbers: [real, imag, real, imag, ...]
    for (let i = 0; i < n; i++) {
      result[i * 2] = reversed[i]; // Real part
      result[i * 2 + 1] = 0; // Imaginary part
    }

    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2;
      const angleStep = (-2 * Math.PI) / size;

      for (let start = 0; start < n; start += size) {
        for (let i = 0; i < halfSize; i++) {
          const angle = angleStep * i;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          const evenIndex = start + i;
          const oddIndex = start + i + halfSize;

          const evenReal = result[evenIndex * 2];
          const evenImag = result[evenIndex * 2 + 1];
          const oddReal = result[oddIndex * 2];
          const oddImag = result[oddIndex * 2 + 1];

          const tempReal = cos * oddReal - sin * oddImag;
          const tempImag = cos * oddImag + sin * oddReal;

          result[evenIndex * 2] = evenReal + tempReal;
          result[evenIndex * 2 + 1] = evenImag + tempImag;
          result[oddIndex * 2] = evenReal - tempReal;
          result[oddIndex * 2 + 1] = evenImag - tempImag;
        }
      }
    }

    return result;
  };

  // Generate spectrogram data from audio buffer
  const generateSpectrogramData = async (audioUrl: string): Promise<number[][]> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const numberOfSamples = audioBuffer.length;
      const frameSize = 512; // Increased for better frequency resolution
      const hopSize = frameSize / 4; // Smaller hop for better time resolution
      const numFrames = Math.floor((numberOfSamples - frameSize) / hopSize);
      const numFreqBins = frameSize / 2;
      
      const spectrogram: number[][] = [];
      const maxFrames = Math.min(numFrames, 100); // More frames for better time resolution
      
      // Apply Hanning window function
      const hanningWindow = new Float32Array(frameSize);
      for (let i = 0; i < frameSize; i++) {
        hanningWindow[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameSize - 1)));
      }
      
      for (let frame = 0; frame < maxFrames; frame++) {
        const frameData = new Float32Array(frameSize);
        const startSample = frame * hopSize;
        
        // Extract frame data and apply window
        for (let i = 0; i < frameSize; i++) {
          if (startSample + i < numberOfSamples) {
            frameData[i] = audioBuffer.getChannelData(0)[startSample + i] * hanningWindow[i];
          }
        }
        
        // Perform FFT
        const fft = performFFT(frameData);
        const magnitudes = new Float32Array(numFreqBins);
        
        // Calculate magnitude spectrum (only positive frequencies)
        for (let i = 0; i < numFreqBins; i++) {
          const real = fft[i * 2];
          const imag = fft[i * 2 + 1];
          magnitudes[i] = Math.sqrt(real * real + imag * imag);
        }
        
        // Apply logarithmic scaling for better dynamic range
        const maxMagnitude = Math.max(...Array.from(magnitudes));
        const frameMagnitudes = Array.from(magnitudes).map(mag => {
          if (maxMagnitude > 0) {
            const normalized = mag / maxMagnitude;
            return Math.max(0, 20 * Math.log10(normalized + 1e-10) + 60);
          }
          return 0;
        });
        
        spectrogram.push(frameMagnitudes);
      }
      
      return spectrogram;
    } catch (error) {
      console.error('Error generating spectrogram:', error);
      throw error;
    }
  };

  // Load and generate spectrogram data
  useEffect(() => {
    const loadSpectrogram = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await generateSpectrogramData(audioUrl);
        setSpectrogramData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate spectrogram');
      } finally {
        setLoading(false);
      }
    };

    if (audioUrl) {
      loadSpectrogram();
    }
  }, [audioUrl]);

  // Draw spectrogram on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || spectrogramData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const numFrames = spectrogramData.length;
    const numFreqBins = spectrogramData[0].length;

    const frameWidth = canvasWidth / numFrames;
    const freqHeight = canvasHeight / numFreqBins;

    // Find global min/max for proper scaling
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let frame = 0; frame < numFrames; frame++) {
      for (let freq = 0; freq < numFreqBins; freq++) {
        const val = spectrogramData[frame][freq];
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    }

    // Color gradient function (similar to standard spectrogram colors)
    const getColor = (value: number) => {
      const normalized = (value - minVal) / (maxVal - minVal);
      
      // Use a color map similar to standard spectrograms
      // Dark blue -> Light blue -> Green -> Yellow -> Red
      if (normalized < 0.2) {
        // Dark blue to light blue
        const t = normalized / 0.2;
        return `rgb(${Math.round(0 + t * 0)}, ${Math.round(0 + t * 100)}, ${Math.round(100 + t * 155)})`;
      } else if (normalized < 0.4) {
        // Light blue to green
        const t = (normalized - 0.2) / 0.2;
        return `rgb(${Math.round(0 + t * 100)}, ${Math.round(100 + t * 155)}, ${Math.round(255 - t * 100)})`;
      } else if (normalized < 0.6) {
        // Green to yellow
        const t = (normalized - 0.4) / 0.2;
        return `rgb(${Math.round(100 + t * 155)}, ${Math.round(255)}, ${Math.round(155 - t * 155)})`;
      } else if (normalized < 0.8) {
        // Yellow to orange
        const t = (normalized - 0.6) / 0.2;
        return `rgb(${Math.round(255)}, ${Math.round(255 - t * 100)}, ${Math.round(0 + t * 100)})`;
      } else {
        // Orange to red
        const t = (normalized - 0.8) / 0.2;
        return `rgb(${Math.round(255)}, ${Math.round(155 - t * 155)}, ${Math.round(100 + t * 155)})`;
      }
    };

    for (let frame = 0; frame < numFrames; frame++) {
      for (let freq = 0; freq < numFreqBins; freq++) {
        const val = spectrogramData[frame][freq];
        
        ctx.fillStyle = getColor(val);
        ctx.fillRect(
          frame * frameWidth,
          canvasHeight - (freq + 1) * freqHeight,
          frameWidth,
          freqHeight
        );
      }
    }
  }, [spectrogramData, width, height]);

  // if (loading) {
  //   return (
  //     <div className="spectrogram-view">
  //       <div className="spectrogram-loading">
  //         <div className="loading-spinner">Generating spectrogram...</div>
  //       </div>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="spectrogram-view">
        <div className="spectrogram-error">
          <p>Error generating spectrogram: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spectrogram-view">
      <div className="spectrogram-header">
        {/* <h4>📊 Spectrogram</h4>
        <p className="spectrogram-title">{title}</p> */}
      </div>
      <div className="spectrogram-container">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ 
            borderRadius: '6px', 
            border: '1px solid #dee2e6',
            width: '100%',
            height: 'auto'
          }}
        />
        
      </div>
      <div className="spectrogram-info">
       {/*loading ? <p className="spectrogram-note">
          Frequency analysis over time
        </p> : <p className="spectrogram-note">
          Frequency analysis over time
        </p>*/}
      </div>
    </div>
  );
};

export default SpectrogramView; 