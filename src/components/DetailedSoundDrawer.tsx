import React from 'react';

interface SoundCard {
  id: string;
  filename: string;
  ratings: {
    freqshift: number;
    hapticgen: number;
    percept: number;
    pitchmatch: number;
  };
  maxRating: number;
  category: string;
  class: string;
  audioFile: string;
  vibrationFiles: {
    freqshift: string;
    hapticgen: string;
    percept: string;
    pitchmatch: string;
  };
  hasZeroRatings?: boolean;
}

interface DetailedSoundDrawerProps {
  sound: SoundCard | null;
  isOpen: boolean;
  onClose: () => void;
}

const DetailedSoundDrawer: React.FC<DetailedSoundDrawerProps> = ({ sound, isOpen, onClose }) => {
  if (!sound) return null;

  return (
    <div className={`detailed-sound-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <h3>{sound.filename}</h3>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>
      
      <div className="drawer-content">
        <div className="sound-info">
          <p><strong>Category:</strong> {sound.category}</p>
          <p><strong>Class:</strong> {sound.class}</p>
          <p><strong>Maximum Rating:</strong> {sound.maxRating.toFixed(1)}</p>
        </div>
        
        <div className="audio-section">
          <h4>Audio Player</h4>
          <p>Audio player implementation coming soon...</p>
        </div>
        
        <div className="vibration-section">
          <h4>Vibration Designs</h4>
          <p>Vibration players implementation coming soon...</p>
        </div>
        
        <div className="ratings-section">
          <h4>Detailed Ratings</h4>
          <p>Rating visualization implementation coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default DetailedSoundDrawer; 
