import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { RatingData } from '../utils/api';
import { FilterState } from './FilterPanel';

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

  // Sync local sort state with filterState
  useEffect(() => {
    setLocalSortBy(filterState.sortBy);
    setLocalSortOrder(filterState.sortOrder);
  }, [filterState.sortBy, filterState.sortOrder]);

  // Color system (consistent everywhere)
  const chartColors = {
    freqshift: '#FF1744',  // Bright red
    hapticgen: '#00E676',  // Bright green
    percept: '#2196F3',    // Bright blue
    pitchmatch: '#9C27B0'  // Bright purple
  };

  // Process and filter sounds
  const processedSounds = useMemo(() => {
    console.log('🔍 Filtering with state:', filterState);
    console.log('📊 Total ratings:', ratings.length);
    
    // Log sample data to understand structure
    if (ratings.length > 0) {
      console.log('📋 Sample rating:', ratings[0]);
      console.log('📁 All categories in data:', [...new Set(ratings.map(r => r.category))]);
    }
    
    // Group by audio file to create sound cards
    const soundMap = new Map<string, SoundCard>();
    
    ratings.forEach(rating => {
      if (!soundMap.has(rating.audioFile)) {
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
          }
        });
      }
      
      const sound = soundMap.get(rating.audioFile)!;
      sound.ratings[rating.design as keyof typeof sound.ratings] = rating.rating;
      sound.vibrationFiles[rating.design as keyof typeof sound.vibrationFiles] = rating.vibrationFile;
    });

    // Calculate maximum ratings and include all sounds (including those with zero ratings)
    let soundCards = Array.from(soundMap.values())
      .map(sound => {
        // Check if sound has any ratings (including zero ratings)
        const hasAnyRatings = Object.values(sound.ratings).some(rating => rating >= 0);
        
        // Debug: Check animal sounds specifically
        const animalCategories = ['dog', 'rooster', 'pig', 'cow', 'frog', 'cat', 'hen', 'insects', 'sheep', 'crow'];
        if (animalCategories.includes(sound.category)) {
          const zeroRatings = Object.values(sound.ratings).filter(rating => rating === 0).length;
          if (zeroRatings > 0) {
            console.log(`⚠️ Animal sound with zero ratings: ${sound.filename} (${sound.category}) - zero ratings: ${zeroRatings}, all ratings:`, sound.ratings);
          }
        }
        
        // Include all sounds that have any ratings (including zero)
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
    
    // Debug: Count animal sounds after filtering
    const animalCategories = ['dog', 'rooster', 'pig', 'cow', 'frog', 'cat', 'hen', 'insects', 'sheep', 'crow'];
    const animalSounds = soundCards.filter(sound => animalCategories.includes(sound.category));
    console.log('🐾 Animal sounds after rating filter:', animalSounds.length);
    console.log('🐾 Expected animal sounds: 200');
    console.log('🐾 Missing animal sounds:', 200 - animalSounds.length);

    console.log('🎵 Sounds with all ratings:', soundCards.length);
    console.log('📁 Sample categories:', [...new Set(soundCards.map(s => s.category))]);
    console.log('🎓 Sample classes:', [...new Set(soundCards.map(s => s.class))].slice(0, 10));

    // Apply filters
    soundCards = soundCards.filter(sound => {
      // Search filter - enhanced to search across multiple fields
      if (filterState.search) {
        const searchTerm = filterState.search.toLowerCase();
        const searchableFields = [
          sound.filename.toLowerCase(),
          sound.category.toLowerCase(),
          sound.class.toLowerCase(),
          `class ${sound.class}`.toLowerCase()
        ];
        
        // Check if any field contains the search term
        const matchesSearch = searchableFields.some(field => field.includes(searchTerm));
        
        if (!matchesSearch) {
          return false;
        }
      }

      // Category filter - handle both category groups and subcategories
      if (filterState.categories.length > 0) {
        // Define category groups (same as in FilterPanel)
        const categoryGroups = [
          { name: 'Animals', sounds: ['dog', 'rooster', 'pig', 'cow', 'frog', 'cat', 'hen', 'insects', 'sheep', 'crow'] },
          { name: 'Natural soundscapes & water sounds', sounds: ['rain', 'sea_waves', 'crackling_fire', 'crickets', 'chirping_birds', 'water_drops', 'wind', 'pouring_water', 'toilet_flush', 'thunderstorm'] },
          { name: 'Human, non-speech sounds', sounds: ['crying_baby', 'sneezing', 'clapping', 'breathing', 'coughing', 'footsteps', 'laughing', 'brushing_teeth', 'snoring', 'drinking_sipping'] },
          { name: 'Interior/domestic sounds', sounds: ['door_wood_knock', 'mouse_click', 'keyboard_typing', 'door_wood_creaks', 'can_opening', 'washing_machine', 'vacuum_cleaner', 'clock_alarm', 'clock_tick', 'glass_breaking'] },
          { name: 'Exterior/urban noises', sounds: ['helicopter', 'chainsaw', 'siren', 'car_horn', 'engine', 'train', 'church_bells', 'airplane', 'fireworks', 'hand_saw'] }
        ];

        let categoryMatch = false;
        
        for (const categoryFilter of filterState.categories) {
          // Check if it's a category group
          const categoryGroup = categoryGroups.find(cg => cg.name === categoryFilter);
          if (categoryGroup) {
            // If it's a category group, check if the sound belongs to any of its subcategories
            if (categoryGroup.sounds.includes(sound.category)) {
              categoryMatch = true;
              break;
            }
          } else {
            // If it's a subcategory, check direct match
            if (sound.category === categoryFilter) {
              categoryMatch = true;
              break;
            }
          }
        }
        
        if (!categoryMatch) {
          console.log('❌ Category filter failed for:', sound.filename, 'category:', sound.category, 'expected:', filterState.categories);
          return false;
        }
      }

      // Class filter
      if (filterState.classes.length > 0 && !filterState.classes.includes(sound.class)) {
        console.log('❌ Class filter failed for:', sound.filename, 'class:', sound.class, 'expected:', filterState.classes);
        return false;
      }

      // Design filter
      if (filterState.designs.length > 0) {
        const hasSelectedDesign = filterState.designs.some(design => 
          sound.ratings[design as keyof typeof sound.ratings] >= 0
        );
        if (!hasSelectedDesign) {
          console.log('❌ Design filter failed for:', sound.filename, 'designs:', filterState.designs);
          return false;
        }
      }

      // Rating range filter
      if (sound.maxRating < filterState.ratingRange.min || sound.maxRating > filterState.ratingRange.max) {
        console.log('❌ Rating filter failed for:', sound.filename, 'average:', sound.maxRating, 'range:', filterState.ratingRange);
        return false;
      }

      return true;
    });
    
    console.log('✅ Final filtered sounds:', soundCards.length);

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

    return soundCards;
  }, [ratings, filterState]);

  // Mini 4-bar chart component
  const MiniBarChart: React.FC<{ ratings: SoundCard['ratings'] }> = ({ ratings }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    
    React.useEffect(() => {
      if (!svgRef.current) return;
      
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      
      const width = 60;
      const height = 40;
      const margin = { top: 2, right: 2, bottom: 2, left: 2 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;
      
      const data = [
        { design: 'freqshift', rating: ratings.freqshift },
        { design: 'hapticgen', rating: ratings.hapticgen },
        { design: 'percept', rating: ratings.percept },
        { design: 'pitchmatch', rating: ratings.pitchmatch }
      ];
      
      const xScale = d3.scaleBand()
        .domain(data.map(d => d.design))
        .range([0, chartWidth])
        .padding(0.1);
      
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([chartHeight, 0]);
      
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      g.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.design)!)
        .attr("y", d => yScale(d.rating))
        .attr("width", xScale.bandwidth())
        .attr("height", d => chartHeight - yScale(d.rating))
        .attr("fill", d => chartColors[d.design as keyof typeof chartColors])
        .attr("rx", 1)
        .attr("ry", 1);
    }, [ratings]);
    
    return <svg ref={svgRef} width="60" height="40" />;
  };

  // Sound Card Component
  const SoundCard: React.FC<{ sound: SoundCard }> = ({ sound }) => {
    const hasZeroRatings = sound.hasZeroRatings || Object.values(sound.ratings).some(rating => rating === 0);
    
    return (
      <div 
        className={`sound-card ${hasZeroRatings ? 'has-zero-ratings' : ''}`}
        onClick={() => {
          setSelectedSound(sound);
          setIsDetailsOpen(true);
        }}
      >
        <div className="card-header">
          <h4 className="filename">{sound.filename}</h4>
          <span className="average-badge">{sound.maxRating.toFixed(1)}</span>
          {hasZeroRatings && (
            <span className="zero-rating-indicator" title="Has zero ratings">⚠️</span>
          )}
        </div>
        
        <div className="card-meta">
          <span className="category-tag">{sound.category}</span>
          <span className="class-tag">Class {sound.class}</span>
        </div>
        
        <div className="mini-chart">
          <MiniBarChart ratings={sound.ratings} />
        </div>
        
        <div className="card-stats">
          <div className="rating-breakdown">
            <span style={{ color: chartColors.freqshift }}>F: {sound.ratings.freqshift.toFixed(0)}</span>
            <span style={{ color: chartColors.hapticgen }}>H: {sound.ratings.hapticgen.toFixed(0)}</span>
            <span style={{ color: chartColors.percept }}>P: {sound.ratings.percept.toFixed(0)}</span>
            <span style={{ color: chartColors.pitchmatch }}>M: {sound.ratings.pitchmatch.toFixed(0)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Details Drawer Component
  const DetailsDrawer: React.FC<{ sound: SoundCard | null; isOpen: boolean }> = ({ sound, isOpen }) => {
    if (!sound) return null;
    
    return (
      <div className={`details-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>{sound.filename}</h3>
          <button 
            className="close-button"
            onClick={() => setIsDetailsOpen(false)}
          >
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
            <div className="vibration-buttons">
              {Object.entries(sound.vibrationFiles).map(([design, file]) => (
                <button 
                  key={design}
                  className="vibration-button"
                  style={{ backgroundColor: chartColors[design as keyof typeof chartColors] }}
                >
                  {design.charAt(0).toUpperCase() + design.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="ratings-section">
            <h4>Detailed Ratings</h4>
            <div className="full-ratings-chart">
              <p>Full ratings chart implementation coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sound-grid-container">
      {/* Results Header */}
      <div className="results-header">
        <div className="results-header-left">
          <h2>Filtered Results</h2>
          <div className="results-info">
            <span className="results-count">
              {processedSounds.length} sounds found
              {filterState.search && (
                <span className="search-highlight">
                  {' '}for "{filterState.search}"
                </span>
              )}
            </span>
            {processedSounds.length === 0 && (
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
      <div className="sound-grid">
        {processedSounds.map(sound => (
          <SoundCard key={sound.id} sound={sound} />
        ))}
      </div>

      {/* Details Drawer */}
      <DetailsDrawer sound={selectedSound} isOpen={isDetailsOpen} />
    </div>
  );
};

export default SoundGrid;
