import React, { useState, useEffect, useRef } from 'react';
import { useAudioFiles } from '../hooks/useAudioFiles';

interface AWSAudioPlayerProps {
  audioFile: string;
  title?: string;
  height?: number;
  showSource?: boolean;
  onLoad?: (url: string, source: 'aws' | 'local') => void;
  onError?: (error: string) => void;
}

const AWSAudioPlayer: React.FC<AWSAudioPlayerProps> = ({
  audioFile,
  title = 'Audio Player',
  height = 80,
  showSource = true,
  onLoad,
  onError,
}) => {
  const { getAudioUrl, audioFileStates } = useAudioFiles();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'aws' | 'local' | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadAudio = async () => {
      try {
        console.log(`🎵 AWSAudioPlayer: Starting to load audio file: ${audioFile}`);
        setLoading(true);
        setError(null);
        
        const url = await getAudioUrl(audioFile);
        console.log(`🎵 AWSAudioPlayer: Got URL for ${audioFile}: ${url}`);
        setAudioUrl(url);
        
        const detectedSource = url.includes('s3.amazonaws.com') ? 'aws' : 'local';
        setSource(detectedSource);
        console.log(`🎵 AWSAudioPlayer: Audio source detected as: ${detectedSource}`);
        
        onLoad?.(url, detectedSource);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load audio';
        console.error(`❌ AWSAudioPlayer: Error loading ${audioFile}:`, err);
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadAudio();
  }, [audioFile, getAudioUrl, onLoad, onError]);

  const fileState = audioFileStates.get(audioFile);

  if (loading || fileState?.loading) {
    return (
      <div 
        style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f5f5f5',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>�� Loading audio...</div>
          {showSource && <div style={{ fontSize: '12px', color: '#666' }}>Checking AWS S3...</div>}
        </div>
      </div>
    );
  }

  if (error || fileState?.error) {
    return (
      <div 
        style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#fee',
          borderRadius: '8px',
          border: '1px solid #fcc',
          color: '#c33'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>❌ Error loading audio</div>
          <div style={{ fontSize: '12px' }}>{error || fileState?.error}</div>
        </div>
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div 
        style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f5f5f5',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}
      >
        <div style={{ textAlign: 'center', color: '#666' }}>
          No audio URL available
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '14px'
      }}>
        <div style={{ fontWeight: '500' }}>{title}</div>
        {showSource && source && (
          <div style={{ 
            fontSize: '12px', 
            padding: '2px 8px', 
            borderRadius: '12px',
            background: source === 'aws' ? '#e3f2fd' : '#f3e5f5',
            color: source === 'aws' ? '#1976d2' : '#7b1fa2',
            fontWeight: '500'
          }}>
            {source === 'aws' ? '☁️ AWS S3' : '💾 Local'}
          </div>
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

export default AWSAudioPlayer;