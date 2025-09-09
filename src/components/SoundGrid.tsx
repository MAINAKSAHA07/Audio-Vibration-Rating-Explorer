import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RatingData } from '../utils/api';
import { FilterState } from './FilterPanel';
import colors from '../colors.js';
import DetailedSoundDrawer from './DetailedSoundDrawer';
import WaveSurferPlayer from './WaveSurferPlayer';
import OverviewChart from './OverviewChart';

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
  bestAlgorithm: string;
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
  selectedAlgorithm?: string;
  onAlgorithmSelect?: (algorithm: string) => void;
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
  selectedSubcategory?: string;
  onSubcategorySelect?: (subcategory: string) => void;
}

const SoundGrid: React.FC<SoundGridProps> = ({ 
  ratings, 
  filterState, 
  onFilterChange,
  selectedAlgorithm,
  onAlgorithmSelect,
  selectedCategory,
  onCategorySelect,
  selectedSubcategory,
  onSubcategorySelect
}) => {
  const [selectedSound, setSelectedSound] = useState<SoundCard | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [localSortBy, setLocalSortBy] = useState<'average' | 'variance' | 'filename'>(filterState.sortBy);
  const [localSortOrder, setLocalSortOrder] = useState<'asc' | 'desc'>(filterState.sortOrder);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Batching state for performance optimization
  const [displayedSounds, setDisplayedSounds] = useState<SoundCard[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [backgroundBatches, setBackgroundBatches] = useState<SoundCard[][]>([]);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  
  const INITIAL_BATCH_SIZE = 100; // Load 100 sounds for initial display
  const BACKGROUND_BATCH_SIZE = 500; // Load 500 sounds per batch in background
  const BACKGROUND_LOAD_DELAY = 4000; // Start background loading after 4 seconds

  // Sync local sort state with filterState
  useEffect(() => {
    setLocalSortBy(filterState.sortBy);
    setLocalSortOrder(filterState.sortOrder);
  }, [filterState.sortBy, filterState.sortOrder]);

  // Memoized color system to prevent recreation on every render
  const chartColors = useMemo(() => ({
    freqshift: colors(0),  // Pink
    hapticgen: colors(1),  // Blue
    percept: colors(2),    // Yellow
    pitchmatch: colors(3)  // Lavender
  }), []);

  // Memoized category groups to prevent recreation
  const categoryGroups = useMemo(() => [
    { name: 'Animals', sounds: ['dog', 'rooster', 'pig', 'cow', 'frog', 'cat', 'hen', 'insects', 'sheep', 'crow'] },
    { name: 'Natural soundscapes & water', sounds: ['rain', 'sea_waves', 'crackling_fire', 'crickets', 'chirping_birds', 'water_drops', 'wind', 'pouring_water', 'toilet_flush', 'thunderstorm'] },
    { name: 'Human, non-speech', sounds: ['crying_baby', 'sneezing', 'clapping', 'breathing', 'coughing', 'footsteps', 'laughing', 'brushing_teeth', 'snoring', 'drinking_sipping'] },
    { name: 'Interior/domestic', sounds: ['door_wood_knock', 'mouse_click', 'keyboard_typing', 'door_wood_creaks', 'can_opening', 'washing_machine', 'vacuum_cleaner', 'clock_alarm', 'clock_tick', 'glass_breaking'] },
    { name: 'Exterior/urban', sounds: ['helicopter', 'chainsaw', 'siren', 'car_horn', 'engine', 'train', 'church_bells', 'airplane', 'fireworks', 'hand_saw'] }
  ], []);

  // Create filtered ratings based on algorithm selection
  const filteredRatings = useMemo(() => {
    if (!filterState.algorithms || filterState.algorithms.length === 0) {
      return ratings; // Show all ratings if no algorithms are selected
    }
    
    // Filter ratings to only include selected algorithms
    return ratings.filter(rating => filterState.algorithms.includes(rating.design));
  }, [ratings, filterState.algorithms]);

  // Process and filter sounds with error handling and performance optimization
  const processedSounds = useMemo(() => {
    try {
      // Only set processing state if we're not already processing
      if (!isProcessing) {
        setIsProcessing(true);
      }
      setError(null);
      
      console.log('🔍 Filtering with state:', filterState);
      console.log('📊 Total ratings:', ratings.length);
      
      if (ratings.length === 0) {
        console.warn('⚠️ No ratings data available');
        setIsProcessing(false);
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
              bestAlgorithm: 'freqshift',
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
          const ratings = Object.values(sound.ratings);
          const maxRating = Math.max(...ratings);
          const bestAlgorithm = Object.keys(sound.ratings).find(key => 
            sound.ratings[key as keyof typeof sound.ratings] === maxRating
          ) || 'freqshift';
          
          return {
            ...sound,
            maxRating,
            bestAlgorithm,
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
      console.log('🎵 Sample audio files:', soundCards.slice(0, 3).map(s => s.audioFile));

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

        // Algorithm filter
        if (filterState.algorithms.length > 0) {
          // Filter sounds where the best algorithm is one of the selected algorithms
          const isBestAlgorithmSelected = filterState.algorithms.includes(sound.bestAlgorithm);
          if (!isBestAlgorithmSelected) return false;
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
      
      // Debug algorithm filtering
      if (filterState.algorithms.length > 0) {
        const algorithmDistribution = new Map<string, number>();
        soundCards.forEach(sound => {
          const count = algorithmDistribution.get(sound.bestAlgorithm) || 0;
          algorithmDistribution.set(sound.bestAlgorithm, count + 1);
        });
        console.log('⚙️ Algorithm distribution:', Object.fromEntries(algorithmDistribution));
        console.log('🎯 Selected algorithms:', filterState.algorithms);
      }

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
      setRetryCount(0); // Reset retry count on successful processing
      return soundCards;
      
    } catch (err) {
      console.error('❌ Error processing sounds:', err);
      setError(err instanceof Error ? err.message : 'Failed to process sounds');
      setIsProcessing(false);
      return [];
    }
  }, [ratings, filterState, categoryGroups]);

  // Initialize display with first batch when processedSounds changes
  useEffect(() => {
    if (processedSounds.length > 0) {
      const firstBatch = processedSounds.slice(0, INITIAL_BATCH_SIZE);
      setDisplayedSounds(firstBatch);
      setCurrentBatch(1);
      setBackgroundBatches([]);
      setBackgroundLoading(false);
      
      // Start background loading after delay
      const backgroundTimer = setTimeout(() => {
        startBackgroundLoading();
      }, BACKGROUND_LOAD_DELAY);
      
      return () => clearTimeout(backgroundTimer);
    } else {
      setDisplayedSounds([]);
      setCurrentBatch(0);
      setBackgroundBatches([]);
      setBackgroundLoading(false);
    }
  }, [processedSounds, INITIAL_BATCH_SIZE, BACKGROUND_LOAD_DELAY]);

  // Background loading function
  const startBackgroundLoading = useCallback(() => {
    if (processedSounds.length <= INITIAL_BATCH_SIZE) {
      return;
    }
    
    setBackgroundLoading(true);
    
    const remainingSounds = processedSounds.slice(INITIAL_BATCH_SIZE);
    const batches: SoundCard[][] = [];
    
    // Create batches using background batch size
    for (let i = 0; i < remainingSounds.length; i += BACKGROUND_BATCH_SIZE) {
      batches.push(remainingSounds.slice(i, i + BACKGROUND_BATCH_SIZE));
    }
    
    // Load batches progressively
    let batchIndex = 0;
    const loadNextBatch = () => {
      if (batchIndex < batches.length) {
        setBackgroundBatches(prev => [...prev, batches[batchIndex]]);
        batchIndex++;
        
        // Load next batch after a small delay
        setTimeout(loadNextBatch, 500);
      } else {
        setBackgroundLoading(false);
      }
    };
    
    loadNextBatch();
  }, [processedSounds, INITIAL_BATCH_SIZE, BACKGROUND_BATCH_SIZE]);

  // Load more function for user interaction
  const loadMoreSounds = useCallback(() => {
    if (isLoadingMore || backgroundBatches.length === 0) return;
    
    setIsLoadingMore(true);
    
    // Add next batch from backgroundBatches
    const nextBatch = backgroundBatches[0];
    const remainingBatches = backgroundBatches.slice(1);
    
    setDisplayedSounds(prev => [...prev, ...nextBatch]);
    setBackgroundBatches(remainingBatches);
    setCurrentBatch(prev => prev + 1);
    
    setTimeout(() => setIsLoadingMore(false), 100);
  }, [isLoadingMore, backgroundBatches, displayedSounds.length]);

  // Check if more sounds can be loaded
  const canLoadMore = backgroundBatches.length > 0 || (processedSounds.length > displayedSounds.length && !backgroundLoading);
  const totalAvailable = processedSounds.length;
  const totalDisplayed = displayedSounds.length;

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
          <span 
            className="average-badge"
            style={{ 
              backgroundColor: chartColors[sound.bestAlgorithm as keyof typeof chartColors] || '#667eea',
              color: 'white',
              fontWeight: 'bold'
            }}
            title={`Best rating: ${sound.maxRating.toFixed(1)} achieved by ${sound.bestAlgorithm === 'freqshift' ? 'Frequency Shifting' : 
                    sound.bestAlgorithm === 'hapticgen' ? 'HapticGen' : 
                    sound.bestAlgorithm === 'percept' ? 'Perception-Level Mapping' : 
                    sound.bestAlgorithm === 'pitchmatch' ? 'Pitch Matching' : 'Frequency Shifting'}`}
          >
            {sound.maxRating.toFixed(1)}
          </span>
        </div>
        
        <div className="card-meta">
          <span className="category-tag">{getCategoryGroupName(sound.category)}</span>
        </div>
        
        <div className="mini-chart">
          <WaveSurferPlayer 
            audioUrl={`/audio/${sound.audioFile}`} 
            title={sound.filename}
            height={130}
          />
        </div>
      </div>
    );
  }, [categoryGroups]);

  // Retry function to clear error and reprocess data
  const handleRetry = useCallback(() => {
    if (retryCount >= 3) {
      setError('Maximum retry attempts reached. Please refresh the page or check your data source.');
      return;
    }
    
    setError(null);
    setIsProcessing(false);
    setRetryCount(prev => prev + 1);
    // Force a re-render by updating a dummy state or just clearing the error
    // The useMemo will automatically recalculate when error is cleared
  }, [retryCount]);

  // Error state
  if (error) {
    return (
      <div className="sound-grid-container">
        <div className="error-message">
          <h3>Error Loading Sounds</h3>
          <p>{error}</p>
          {retryCount > 0 && (
            <p className="retry-info">
              Retry attempts: {retryCount}/3
            </p>
          )}
          <div className="error-actions">
            <button 
              onClick={handleRetry} 
              className="retry-button"
              disabled={retryCount >= 3}
            >
              {retryCount >= 3 ? 'Max Retries Reached' : 'Retry'}
            </button>
            {retryCount >= 3 && (
              <button 
                onClick={() => window.location.reload()} 
                className="refresh-button"
              >
                Refresh Page
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sound-grid-container">
      {/* Fixed Header Section - Overview Charts */}
      <div className="fixed-charts-header" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#f5f5f5',
        padding: '20px 0',
        borderBottom: '2px solid #e9ecef',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <OverviewChart 
          summary={{
            totalEntries: filteredRatings.length,
            uniqueAudioFiles: new Set(filteredRatings.map(r => r.audioFile)).size,
            uniqueClasses: new Set(filteredRatings.map(r => r.class)).size,
            uniqueCategories: new Set(filteredRatings.map(r => r.category)).size,
            uniqueTargets: new Set(filteredRatings.map(r => r.target)).size,
            uniqueFolds: new Set(filteredRatings.map(r => r.fold)).size,
            categories: {},
            designs: filterState.algorithms.length > 0 ? filterState.algorithms : ['freqshift', 'hapticgen', 'percept', 'pitchmatch'],
            ratingCategories: {},
            averageRatings: { 
              overall: 0,
              byDesign: {},
              byCategory: {}
            },
            categoryAverages: {},
            designAverages: {},
            foldDistribution: {},
            targetDistribution: {},
            classDistribution: {}
          }}
          onNavigateToFiltered={() => {}} // No-op since we're already in filtered view
          filterState={filterState}
          ratings={ratings}
          selectedAlgorithm={selectedAlgorithm}
          onAlgorithmSelect={onAlgorithmSelect}
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
          selectedSubcategory={selectedSubcategory}
          onSubcategorySelect={onSubcategorySelect}
          onSoundSelect={(sound) => {
            console.log('🎯 Sunburst sound selected in SoundGrid:', sound);
            console.log('🔍 Available ratings:', ratings.slice(0, 5).map(r => ({ audioFile: r.audioFile, category: r.category, class: r.class })));
            
            // Try to find the matching sound using the ratings data
            // The sunburst chart provides soundname, so we need to match it with our ratings
            let matchingSound = null;
            
            // First, try to find a rating entry that matches the soundname
            const matchingRating = ratings.find(r => 
              r.audioFile === sound.soundname || 
              r.audioFile === sound.filename ||
              r.audioFile.replace(/\.(wav|mp3|flac)$/i, '') === sound.soundname ||
              r.audioFile.replace(/\.(wav|mp3|flac)$/i, '') === sound.filename
            );
            
            if (matchingRating) {
              console.log('✅ Found matching rating:', matchingRating);
              
              // Create a sound card from the rating data
              const audioFile = matchingRating.audioFile;
              const category = matchingRating.category;
              const classNum = matchingRating.class;
              
              // Get all ratings for this audio file
              const audioRatings = ratings.filter(r => r.audioFile === audioFile);
              
              // Create the sound card structure
              const soundCard: SoundCard = {
                id: audioFile,
                filename: audioFile,
                soundname: sound.soundname || sound.filename,
                ratings: {
                  freqshift: audioRatings.find(r => r.design === 'freqshift')?.rating || 0,
                  hapticgen: audioRatings.find(r => r.design === 'hapticgen')?.rating || 0,
                  percept: audioRatings.find(r => r.design === 'percept')?.rating || 0,
                  pitchmatch: audioRatings.find(r => r.design === 'pitchmatch')?.rating || 0
                },
                maxRating: Math.max(...audioRatings.map(r => r.rating)),
                bestAlgorithm: audioRatings.reduce((best, current) => 
                  current.rating > best.rating ? current : best
                ).design,
                category: category,
                class: classNum.toString(),
                audioFile: audioFile,
                vibrationFiles: {
                  freqshift: `${audioFile.replace(/\.(wav|mp3|flac)$/i, '')}-vib-freqshift.wav`,
                  hapticgen: `${audioFile.replace(/\.(wav|mp3|flac)$/i, '')}-vib-hapticgen.wav`,
                  percept: `${audioFile.replace(/\.(wav|mp3|flac)$/i, '')}-vib-percept.wav`,
                  pitchmatch: `${audioFile.replace(/\.(wav|mp3|flac)$/i, '')}-vib-pitchmatch.wav`
                }
              };
              
              console.log('✅ Created sound card from ratings:', soundCard);
              setSelectedSound(soundCard);
              setIsDetailsOpen(true);
            } else {
              console.warn('⚠️ No matching rating found for sound:', sound);
              console.log('🔍 Tried to match:', {
                soundname: sound.soundname,
                filename: sound.filename,
                cleanSoundname: sound.soundname?.replace(/\.(wav|mp3|flac)$/i, ''),
                cleanFilename: sound.filename?.replace(/\.(wav|mp3|flac)$/i, '')
              });
              // You could show a toast notification here
            }
          }}
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="scrollable-content" style={{
        padding: '0 15px'
      }}>
        {/* Results Header */}
        <div className="results-header">
          <div className="results-header-left">
            <h2>Filtered Results</h2>
            {/* No results message moved here for better layout */}
            {!isProcessing && totalAvailable === 0 && (
              <p className="no-results">
                {filterState.search 
                  ? `No sounds found for "${filterState.search}". Try a different search term or clear the search.`
                  : 'No sounds match the current filters. Try adjusting your criteria.'
                }
              </p>
            )}
          </div>
          
          <div className="results-header-right">
            {/* Results Count moved to right side */}
            <div className="results-count-display">
              {isProcessing ? (
                <span className="processing-indicator">Processing sounds...</span>
              ) : (
                <div className="results-count">
                  <span className="main-count">
                    Showing {totalDisplayed} of {totalAvailable} sounds
                    {filterState.search && (
                      <span className="search-highlight">
                        {' '}for "{filterState.search}"
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
            
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
                <option value="average">Highest Rating</option>
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
          <>
            <div className="sound-grid">
              {displayedSounds.map(sound => (
                <SoundCard key={sound.id} sound={sound} />
              ))}
            </div>
            
            {/* Load More Section */}
            {canLoadMore && (
              <div className="load-more-section">
                <button 
                  onClick={loadMoreSounds}
                  disabled={isLoadingMore || backgroundBatches.length === 0}
                  className="load-more-button"
                >
                  {isLoadingMore ? (
                    <span>⏳ Loading...</span>
                  ) : backgroundBatches.length > 0 ? (
                    <span>📈 Load More</span>
                  ) : backgroundLoading ? (
                    <span>📈 Load More</span>
                  ) : (
                    <span>📈 Load More</span>
                  )}
                </button>
                
                
                <div className="load-more-info">
                  <span>Showing {totalDisplayed} of {totalAvailable} total sounds</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
