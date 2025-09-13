import React from 'react';
import WaveSurferPlayer from './WaveSurferPlayer';
import colors from '../colors.js';
import { BACKEND_CONFIG } from '../config/backend';

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
  soundname?: string;
}

interface DetailedSoundDrawerProps {
  sound: SoundCard | null;
  isOpen: boolean;
  onClose: () => void;
}

const DetailedSoundDrawer: React.FC<DetailedSoundDrawerProps> = ({ sound, isOpen, onClose }) => {
  if (!sound) return null;

  // Color scheme for the ratings
  const ratingColors = {
    freqshift: colors(0),  // Pink
    hapticgen: colors(1),  // Blue
    percept: colors(2),    // Yellow
    pitchmatch: colors(3)  // Lavender
  };

  // Design name mapping
  const designNames = {
    freqshift: 'Frequency Shifting',
    hapticgen: 'HapticGen',
    percept: 'Perception-Level Mapping',
    pitchmatch: 'Pitch Matching'
  };

  // Get category group name
  const getCategoryGroupName = (category: string) => {
    const categoryGroups = [
      { name: 'Animals', sounds: ['dog', 'rooster', 'pig', 'cow', 'frog', 'cat', 'hen', 'insects', 'sheep', 'crow'] },
      { name: 'Natural soundscapes & water', sounds: ['rain', 'sea_waves', 'crackling_fire', 'crickets', 'chirping_birds', 'water_drops', 'wind', 'pouring_water', 'toilet_flush', 'thunderstorm'] },
      { name: 'Human, non-speech', sounds: ['crying_baby', 'sneezing', 'clapping', 'breathing', 'coughing', 'footsteps', 'laughing', 'brushing_teeth', 'snoring', 'drinking_sipping'] },
      { name: 'Interior/domestic', sounds: ['door_wood_knock', 'mouse_click', 'keyboard_typing', 'door_wood_creaks', 'can_opening', 'washing_machine', 'vacuum_cleaner', 'clock_alarm', 'clock_tick', 'glass_breaking'] },
      { name: 'Exterior/urban', sounds: ['helicopter', 'chainsaw', 'siren', 'car_horn', 'engine', 'train', 'church_bells', 'airplane', 'fireworks', 'hand_saw'] }
    ];
    
    for (const group of categoryGroups) {
      if (group.sounds.includes(category)) {
        return group.name;
      }
    }
    return category;
  };

  // Build URLs for audio and vibration files served from EC2 backend
  const getAudioUrl = (filename: string) => {
    return `${BACKEND_CONFIG.BASE_URL}/audio/${filename}`;
  };

  const getVibrationUrl = (filename: string) => {
    return `${BACKEND_CONFIG.BASE_URL}/vibration/${filename}`;
  };

  return (
    <div className={`detailed-sound-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="detailed-sound-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>{sound.filename}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="drawer-content">
          {/* Sound Information */}
          <div className="sound-info">
            <div className="info-grid">
              <div className="info-item">
                <label>Category Group:</label>
                <span>{getCategoryGroupName(sound.category)}</span>
              </div>
              <div className="info-item">
                <label>Soundname:</label>
                <span>{sound.category}</span>
              </div>
              <div className="info-item">
                <label>Highest Rating:</label>
                <span className="rating-badge">{sound.maxRating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          
          {/* Ratings Bar Chart */}
          <div className="ratings-section">
            <h4>📊 Rating Breakdown</h4>
            <div className="ratings-chart">
              {Object.entries(sound.ratings).map(([design, rating]) => (
                <div key={design} className="rating-bar-container">
                  <div className="rating-label">
                    <span className="design-name">{designNames[design as keyof typeof designNames]}</span>
                    <span className="rating-value">{rating.toFixed(1)}</span>
                  </div>
                  <div className="rating-bar">
                    <div 
                      className="rating-fill"
                      style={{ 
                        width: `${(rating / 100) * 100}%`,
                        backgroundColor: ratingColors[design as keyof typeof ratingColors]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Audio Player */}
          <div className="audio-section">
            <h4>🎵 Audio</h4>
            <div className="audio-player-section">
              <WaveSurferPlayer 
                audioUrl={getAudioUrl(sound.audioFile)} 
                title={sound.soundname || sound.filename}
                height={120}
              />
            </div>
          </div>
          
          {/* Vibration Players */}
          <div className="vibration-section">
            <h4>📳 Vibration Designs</h4>
            <div className="vibration-grid">
              {Object.entries(sound.vibrationFiles).map(([design, vibrationFile]) => (
                <div key={design} className="vibration-item">
                  <div className="vibration-header">
                    <h5 style={{ color: ratingColors[design as keyof typeof ratingColors] }}>
                      {designNames[design as keyof typeof designNames]}
                    </h5>
                    <span className="vibration-rating">
                      {sound.ratings[design as keyof typeof sound.ratings].toFixed(1)}
                    </span>
                  </div>
                  <div className="vibration-content">
                    <div className="vibration-player-section">
                      <WaveSurferPlayer 
                        audioUrl={getVibrationUrl(vibrationFile)} 
                        title={`${sound.soundname || sound.filename} - ${design}`}
                        height={100}
                        showDownload={true}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedSoundDrawer; 