import React, { useState, useEffect, useRef } from 'react';
import { BACKEND_CONFIG } from '../config/backend';

interface EC2AudioPlayerProps {
  audioFile: string;
  title?: string;
  height?: number;
  showSource?: boolean;
  onLoad?: (url: string) => void;
  onError?: (error: string) => void;
}

const EC2AudioPlayer: React.FC<EC2AudioPlayerProps> = ({
  audioFile,
  title = 'Audio Player',
  height = 80,
  showSource = true,
  onLoad,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Build the URL for the audio file served from EC2 backend
  const audioUrl = `${BACKEND_CONFIG.BASE_URL}/audio/${audioFile}`;

  useEffect(() => {
    const loadAudio = async () => {
      try {
        console.log(`🎵 EC2AudioPlayer: Loading audio file: ${audioFile}`);
        setLoading(true);
        setError(null);
        
        // Test if the file exists by making a HEAD request
        const response = await fetch(audioUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Audio file not found: ${audioFile}`);
        }
        
        console.log(`🎵 EC2AudioPlayer: Successfully loaded audio: ${audioFile}`);
        setLoading(false);
        onLoad?.(audioUrl);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load audio';
        console.error(`❌ EC2AudioPlayer: Error loading ${audioFile}:`, err);
        setError(errorMessage);
        onError?.(errorMessage);
        setLoading(false);
      }
    };

    loadAudio();
  }, [audioFile, audioUrl, onLoad, onError]);

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        textAlign: 'center',
        minHeight: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>⏳</div>
        <p style={{ margin: '0', color: '#6c757d', fontSize: '14px' }}>Loading audio...</p>
        {showSource && (
          <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '12px' }}>
            Source: EC2 Backend
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #f5c6cb',
        textAlign: 'center',
        minHeight: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>⚠️</div>
        <p style={{ margin: '0', fontSize: '14px' }}>{error}</p>
        {showSource && (
          <p style={{ margin: '5px 0 0 0', color: '#721c24', fontSize: '12px' }}>
            Source: EC2 Backend
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#333' }}>
          {title}
        </h4>
        {showSource && (
          <p style={{ margin: '0', color: '#6c757d', fontSize: '12px' }}>
            Source: EC2 Backend
          </p>
        )}
      </div>
      
      <audio
        ref={audioRef}
        controls
        style={{ width: '100%', height: `${height}px` }}
        preload="metadata"
      >
        <source src={audioUrl} type="audio/wav" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default EC2AudioPlayer;
