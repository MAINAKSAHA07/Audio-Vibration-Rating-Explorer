import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RatingData } from '../utils/api';
import { FilterState } from './FilterPanel';
import DetailedSoundDrawer from './DetailedSoundDrawer';
import WaveSurferPlayer from './WaveSurferPlayer';

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
  soundname?: string; // Added for the new logic
}

interface SoundGridProps {
  ratings: RatingData[];
  filterState: FilterState;
  onFilterChange?: (updates: Partial<FilterState>) => void;
}

const SoundGrid: React.FC<SoundGridProps> = ({ ratings, filterState, onFilterChange }) => {
  const [selectedSound, setSelectedSound] = useState<SoundCard | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [localSortBy, setLocalSortBy] = useState<'average' | 'variance' | 'filename'>(filterState.sortBy);
  const [localSortOrder, setLocalSortOrder] = useState<'asc' | 'desc'>(filterState.sortOrder);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local sort state with filterState
  useEffect(() => {
    setLocalSortBy(filterState.sortBy);
    setLocalSortOrder(filterState.sortOrder);
  }, [filterState.sortBy, filterState.sortOrder]);

  // Memoized color system to prevent recreation on every render
  const chartColors = useMemo(() => ({
    freqshift: '#FF1744',  // Bright red
    hapticgen: '#00E676',  // Bright green
    percept: '#2196F3',    // Bright blue
    pitchmatch: '#9C27B0'  // Bright purple
  }), []);

  // Memoized category groups to prevent recreation
  const categoryGroups = useMemo(() => [
    { name: 'Animals', sounds: ['dog', 'rooster', 'pig', 'cow', 'frog', 'cat', 'hen', 'insects', 'sheep', 'crow'] },
    { name: 'Natural soundscapes & water', sounds: ['rain', 'sea_waves', 'crackling_fire', 'crickets', 'chirping_birds', 'water_drops', 'wind', 'pouring_water', 'toilet_flush', 'thunderstorm'] },
    { name: 'Human, non-speech', sounds: ['crying_baby', 'sneezing', 'clapping', 'breathing', 'coughing', 'footsteps', 'laughing', 'brushing_teeth', 'snoring', 'drinking_sipping'] },
    { name: 'Interior/domestic', sounds: ['door_wood_knock', 'mouse_click', 'keyboard_typing', 'door_wood_creaks', 'can_opening', 'washing_machine', 'vacuum_cleaner', 'clock_alarm', 'clock_tick', 'glass_breaking'] },
    { name: 'Exterior/urban', sounds: ['helicopter', 'chainsaw', 'siren', 'car_horn', 'engine', 'train', 'church_bells', 'airplane', 'fireworks', 'hand_saw'] }
  ], []);

  // Process and filter sounds with error handling and performance optimization
  const processedSounds = useMemo(() => {
    try {
      setIsProcessing(true);
      setError(null);
      
      console.log('🔍 Filtering with state:', filterState);
      console.log('📊 Total ratings:', ratings.length);
      
      if (ratings.length === 0) {
        console.warn('⚠️ No ratings data available');
        return [];
      }
      
      // Group by audio file to create sound cards - optimized for performance
      const soundMap = new Map<string, SoundCard>();
      
      // Track category counts for sequential numbering
      const categoryCounts = new Map<string, number>();
      
      // Process ratings in batches to prevent memory issues
      const batchSize = 1000;
      for (let i = 0; i < ratings.length; i += batchSize) {
        const batch = ratings.slice(i, i + batchSize);
        
        batch.forEach(rating => {
          if (!soundMap.has(rating.audioFile)) {
            // Generate soundname from category with sequential numbering
            const capitalizeCategory = (category: string) => {
              const words = category.split('_');
              const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
              return capitalizedWords.join('_');
            };
            
            // Get or increment category count
            const currentCount = categoryCounts.get(rating.category) || 0;
            categoryCounts.set(rating.category, currentCount + 1);
            
            soundMap.set(rating.audioFile, {
              id: rating.id,
              filename: rating.audioFile,
              ratings: {
                freqshift: 0,
                hapticgen: 0,
                percept: 0,
                pitchmatch: 0
              },
              maxRating: 0,
              category: rating.category,
              class: rating.class,
              audioFile: rating.audioFile,
              vibrationFiles: {
                freqshift: '',
                hapticgen: '',
                percept: '',
                pitchmatch: ''
              },
              soundname: rating.soundname || `${capitalizeCategory(rating.category)}_${currentCount + 1}`
            });
          }
          
          const sound = soundMap.get(rating.audioFile)!;
          if (rating.design in sound.ratings) {
            sound.ratings[rating.design as keyof typeof sound.ratings] = rating.rating;
            sound.vibrationFiles[rating.design as keyof typeof sound.vibrationFiles] = rating.vibrationFile;
          }
        });
      }

      // Convert to array and calculate max ratings
      let soundCards = Array.from(soundMap.values())
        .map(sound => {
          return {
            ...sound,
            maxRating: Math.max(...Object.values(sound.ratings)),
            hasZeroRatings: Object.values(sound.ratings).some(rating => rating === 0)
          };
        })
        .filter(sound => {
          // Only include sounds that have at least one rating (including zero ratings)
          return Object.values(sound.ratings).some(rating => rating >= 0);
        });

      // Fix sequential numbering by sorting and reassigning numbers
      const categorySoundGroups = new Map<string, SoundCard[]>();
      
      // Group sounds by category
      soundCards.forEach(sound => {
        if (!categorySoundGroups.has(sound.category)) {
          categorySoundGroups.set(sound.category, []);
        }
        categorySoundGroups.get(sound.category)!.push(sound);
      });
      
      // Reassign sequential numbers for each category
      categorySoundGroups.forEach((sounds, category) => {
        const capitalizeCategory = (category: string) => {
          const words = category.split('_');
          const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
          return capitalizedWords.join('_');
        };
        
        // Sort sounds by some consistent criteria (e.g., filename) to ensure stable ordering
        sounds.sort((a, b) => a.filename.localeCompare(b.filename));
        
        // Assign sequential numbers
        sounds.forEach((sound, index) => {
          sound.soundname = `${capitalizeCategory(category)}_${index + 1}`;
        });
      });

      console.log('🎵 Sounds with all ratings:', soundCards.length);

      // Apply filters with early termination for performance
      soundCards = soundCards.filter(sound => {
        // Search filter
        if (filterState.search) {
          const searchTerm = filterState.search.toLowerCase();
          
          // Get category group name for search
          const getCategoryGroupName = (category: string) => {
            for (const group of categoryGroups) {
              if (group.sounds.includes(category)) {
                return group.name;
              }
            }
            return category; // Fallback to category name if not found in groups
          };
          
          const searchableFields = [
            (sound.soundname || '').toLowerCase(), // Search by soundname (e.g., "Dog_1", "Rooster_2")
            sound.filename.toLowerCase(),   // Search by original filename
            sound.category.toLowerCase(),   // Search by category (e.g., "dog", "rooster")
            getCategoryGroupName(sound.category).toLowerCase(), // Search by group name (e.g., "animals", "natural soundscapes & water")
            sound.class.toLowerCase(),      // Search by class (e.g., "A", "B")
            `class ${sound.class}`.toLowerCase() // Search by "class A", "class B"
          ];
          
          const matchesSearch = searchableFields.some(field => field.includes(searchTerm));
          if (!matchesSearch) return false;
        }

        // Category filter
        if (filterState.categories.length > 0) {
          let categoryMatch = false;
          
          for (const categoryFilter of filterState.categories) {
            const categoryGroup = categoryGroups.find(cg => cg.name === categoryFilter);
            if (categoryGroup) {
              if (categoryGroup.sounds.includes(sound.category)) {
                categoryMatch = true;
                break;
              }
            } else {
              if (sound.category === categoryFilter) {
                categoryMatch = true;
                break;
              }
            }
          }
          
          if (!categoryMatch) return false;
        }

        // Class filter
        if (filterState.classes.length > 0 && !filterState.classes.includes(sound.class)) {
          return false;
        }

        // Design filter
        if (filterState.designs.length > 0) {
          const hasSelectedDesign = filterState.designs.some(design => 
            sound.ratings[design as keyof typeof sound.ratings] >= 0
          );
          if (!hasSelectedDesign) return false;
        }

        // Rating range filter
        if (filterState.ratingRange.min > 0 && sound.maxRating < filterState.ratingRange.min) {
          return false;
        }
        if (filterState.ratingRange.max < 100 && sound.maxRating > filterState.ratingRange.max) {
          return false;
        }

        return true;
      });

      // Debug: Log category distribution
      const categoryDistribution = new Map<string, number>();
      soundCards.forEach(sound => {
        const count = categoryDistribution.get(sound.category) || 0;
        categoryDistribution.set(sound.category, count + 1);
      });
      
      console.log('🔍 Category distribution:', Object.fromEntries(categoryDistribution));
      console.log('📊 Total filtered sounds:', soundCards.length);

      // Sort sounds
      soundCards.sort((a, b) => {
        let comparison = 0;
        
        switch (filterState.sortBy) {
          case 'average':
            comparison = b.maxRating - a.maxRating;
            break;
          case 'variance':
            const varianceA = Object.values(a.ratings).reduce((sum, rating) => 
              sum + Math.pow(rating - (Object.values(a.ratings).reduce((s, r) => s + r, 0) / 4), 2), 0) / 4;
            const varianceB = Object.values(b.ratings).reduce((sum, rating) => 
              sum + Math.pow(rating - (Object.values(b.ratings).reduce((s, r) => s + r, 0) / 4), 2), 0) / 4;
            comparison = varianceB - varianceA;
            break;
          case 'filename':
            comparison = a.filename.localeCompare(b.filename);
            break;
        }

        return filterState.sortOrder === 'asc' ? -comparison : comparison;
      });

      setIsProcessing(false);
      return soundCards;
      
    } catch (err) {
      console.error('❌ Error processing sounds:', err);
      setError(err instanceof Error ? err.message : 'Failed to process sounds');
      setIsProcessing(false);
      return [];
    }
  }, [ratings, filterState, categoryGroups]);

  // Memoized sound card component to prevent unnecessary re-renders
  const SoundCard = useCallback<React.FC<{ sound: SoundCard }>>(({ sound }) => {
    const handleCardClick = (e: React.MouseEvent) => {
      // Don't open drawer if clicking on the audio player or wavesurfer player
      if ((e.target as HTMLElement).closest('.audio-player') || 
          (e.target as HTMLElement).closest('.wavesurfer-player')) {
        return;
      }
      
      setSelectedSound(sound);
      setIsDetailsOpen(true);
    };

    // Get category group name
    const getCategoryGroupName = (category: string) => {
      for (const group of categoryGroups) {
        if (group.sounds.includes(category)) {
          return group.name;
        }
      }
      return category; // Fallback to category name if not found in groups
    };
    
    return (
      <div 
        className="sound-card"
        onClick={handleCardClick}
      >
        <div className="card-header">
          <h4 className="filename">{sound.soundname}</h4>
          <span className="average-badge">{sound.maxRating.toFixed(1)}</span>
        </div>
        
        <div className="card-meta">
          <span className="category-tag">{getCategoryGroupName(sound.category)}</span>
        </div>
        
        <div className="mini-chart">
          <WaveSurferPlayer 
            audioUrl={`/audio/${sound.audioFile}`} 
            title={sound.filename} 
          />
        </div>
      </div>
    );
  }, [categoryGroups]);

  // Error state
  if (error) {
    return (
      <div className="sound-grid-container">
        <div className="error-message">
          <h3>Error Loading Sounds</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sound-grid-container">
      {/* Results Header */}
      <div className="results-header">
        <div className="results-header-left">
          <h2>Filtered Results</h2>
          <div className="results-info">
            {isProcessing ? (
              <span className="processing-indicator">Processing sounds...</span>
            ) : (
              <span className="results-count">
                {processedSounds.length} sounds found
                {filterState.search && (
                  <span className="search-highlight">
                    {' '}for "{filterState.search}"
                  </span>
                )}
              </span>
            )}
            {!isProcessing && processedSounds.length === 0 && (
              <p className="no-results">
                {filterState.search 
                  ? `No sounds found for "${filterState.search}". Try a different search term or clear the search.`
                  : 'No sounds match the current filters. Try adjusting your criteria.'
                }
              </p>
            )}
          </div>
        </div>
        
        <div className="results-header-right">
          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={localSortBy}
              onChange={(e) => {
                const newSortBy = e.target.value as 'average' | 'variance' | 'filename';
                setLocalSortBy(newSortBy);
                onFilterChange?.({ sortBy: newSortBy });
              }}
              className="sort-select"
            >
              <option value="average">Highest Average</option>
              <option value="variance">Most Variable</option>
              <option value="filename">Filename</option>
            </select>
            <button
              className="sort-order-btn"
              onClick={() => {
                const newSortOrder = localSortOrder === 'asc' ? 'desc' : 'asc';
                setLocalSortOrder(newSortOrder);
                onFilterChange?.({ sortOrder: newSortOrder });
              }}
              title={`Sort ${localSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {localSortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {isProcessing ? (
        <div className="loading-grid">
          <div className="loading-spinner">Processing sounds...</div>
        </div>
      ) : (
        <div className="sound-grid">
          {processedSounds.map(sound => (
            <SoundCard key={sound.id} sound={sound} />
          ))}
        </div>
      )}

      {/* Details Drawer */}
      <DetailedSoundDrawer 
        sound={selectedSound} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
};

export default SoundGrid;
