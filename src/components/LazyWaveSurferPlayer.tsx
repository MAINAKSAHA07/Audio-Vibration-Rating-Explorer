import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface LazyWaveSurferPlayerProps {
  audioUrl: string;
  title: string;
  height?: number;
}

const LazyWaveSurferPlayer: React.FC<LazyWaveSurferPlayerProps> = ({ audioUrl, title, height = 60 }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect when the card is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Load when 10% of the card is visible
        rootMargin: '50px' // Start loading 50px before the card is visible
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [hasLoaded]);

  // Load WaveSurfer only when the card becomes visible
  useEffect(() => {
    if (!isVisible || hasLoaded || !waveformRef.current) return;

    setIsLoading(true);
    setError(null);

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
      setHasLoaded(true);
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
  }, [isVisible, hasLoaded, audioUrl, height]);

  const togglePlayPause = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, []);

  const getButtonText = () => {
    if (isLoading) return '⏳ Loading...';
    if (error) return '🔄 Retry';
    if (isPlaying) return '⏸️ Pause';
    return '▶️ Play';
  };

  const isButtonDisabled = isLoading && !error;

  return (
    <div ref={cardRef} className="lazy-wavesurfer-player">
      {!isVisible ? (
        // Placeholder while not visible
        <div style={{
          height: `${height}px`,
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6c757d',
          fontSize: '12px'
        }}>
          📱 Scroll to load
        </div>
      ) : (
        // Actual WaveSurfer player
        <div className="wavesurfer-player">
          <button 
            onClick={togglePlayPause} 
            className="play-button" 
            disabled={isButtonDisabled}
            title={error || title}
            style={{
              position: 'absolute',
              top: '5px',
              left: '5px',
              zIndex: 10,
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
              opacity: isButtonDisabled ? 0.6 : 1
            }}
          >
            {getButtonText()}
          </button>
          
          <div className="waveform-container" style={{ position: 'relative' }}>
            <div ref={waveformRef} className="waveform" />
            {error && (
              <span className="error-indicator" title={error} style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                color: '#dc3545',
                fontSize: '16px'
              }}>⚠️</span>
            )}
            {!error && !isLoading && !wavesurferRef.current && (
              <span className="warning-indicator" title="Audio not ready" style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                color: '#ffc107',
                fontSize: '16px'
              }}>⏳</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyWaveSurferPlayer;
