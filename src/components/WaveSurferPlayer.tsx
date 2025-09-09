import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveSurferPlayerProps {
  audioUrl: string;
  title: string;
  height?: number;
}

const WaveSurferPlayer: React.FC<WaveSurferPlayerProps> = ({ audioUrl, title, height = 60 }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Create WaveSurfer instance with the exact configuration
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      url: audioUrl,
      height: height,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      normalize: true,
      backend: 'MediaElement',

      // 🎨 palette from your screenshot
      waveColor: '#E0E5EC',       // light gray (unplayed)
      progressColor: '#3A57A8',   // deep blue (played)
      cursorColor: '#3A57A8',     // same blue for the playhead
      cursorWidth: 2,
    });

    wavesurferRef.current = wavesurfer;

    // Event listeners
    wavesurfer.on('ready', () => {
      setIsLoading(false);
      setError(null);
    });

    wavesurfer.on('play', () => {
      setIsPlaying(true);
    });

    wavesurfer.on('pause', () => {
      setIsPlaying(false);
    });

    // Click to play functionality
    wavesurfer.on('click', () => {
      wavesurfer.play();
    });

    wavesurfer.on('error', (err) => {
      console.error('WaveSurfer error:', err);
      setError('Failed to load audio file');
      setIsLoading(false);
    });

    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, height]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const getButtonText = () => {
    if (isLoading) return '⏳ Loading...';
    if (error) return '🔄 Retry';
    if (isPlaying) return '⏸️ Pause';
    return '▶️ Play';
  };

  const isButtonDisabled = isLoading && !error;

  return (
    <div className="wavesurfer-player">
      <button 
        onClick={togglePlayPause} 
        className="play-button" 
        disabled={isButtonDisabled}
        title={error || title}
      >
        {getButtonText()}
      </button>
      
      <div className="waveform-container">
        <div ref={waveformRef} className="waveform" />
        {error && (
          <span className="error-indicator" title={error}>⚠️</span>
        )}
        {!error && !isLoading && !wavesurferRef.current && (
          <span className="warning-indicator" title="Audio not ready">⏳</span>
        )}
      </div>
    </div>
  );
};

export default WaveSurferPlayer; 